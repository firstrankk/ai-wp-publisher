import { Response } from 'express';
import { prisma } from '../index.js';
import type { AuthRequest } from '../middlewares/auth.middleware.js';
import { z } from 'zod';

const SETTING_DEFAULTS: Record<string, string> = {
  cleanup_enabled: 'true',
  cleanup_retention_days: '15',
  activity_log_retention_days: '30',
};

const updateCleanupSchema = z.object({
  cleanupEnabled: z.boolean(),
  cleanupRetentionDays: z.number().min(1).max(365),
  activityLogRetentionDays: z.number().min(1).max(365),
});

export class SettingsController {
  async getCleanupSettings(req: AuthRequest, res: Response) {
    try {
      const keys = Object.keys(SETTING_DEFAULTS);
      const settings = await prisma.systemSetting.findMany({
        where: { key: { in: keys } },
      });

      const settingsMap: Record<string, string> = { ...SETTING_DEFAULTS };
      for (const s of settings) {
        settingsMap[s.key] = s.value;
      }

      res.json({
        cleanupEnabled: settingsMap.cleanup_enabled === 'true',
        cleanupRetentionDays: parseInt(settingsMap.cleanup_retention_days, 10),
        activityLogRetentionDays: parseInt(settingsMap.activity_log_retention_days, 10),
      });
    } catch (error) {
      throw error;
    }
  }

  async updateCleanupSettings(req: AuthRequest, res: Response) {
    try {
      const data = updateCleanupSchema.parse(req.body);

      const updates = [
        { key: 'cleanup_enabled', value: String(data.cleanupEnabled) },
        { key: 'cleanup_retention_days', value: String(data.cleanupRetentionDays) },
        { key: 'activity_log_retention_days', value: String(data.activityLogRetentionDays) },
      ];

      for (const { key, value } of updates) {
        await prisma.systemSetting.upsert({
          where: { key },
          update: { value },
          create: { key, value },
        });
      }

      await prisma.activityLog.create({
        data: {
          type: 'SETTINGS_UPDATED',
          message: `Cleanup settings updated: retention=${data.cleanupRetentionDays}d, logs=${data.activityLogRetentionDays}d, enabled=${data.cleanupEnabled}`,
          userId: req.user!.id,
        },
      });

      res.json({
        cleanupEnabled: data.cleanupEnabled,
        cleanupRetentionDays: data.cleanupRetentionDays,
        activityLogRetentionDays: data.activityLogRetentionDays,
      });
    } catch (error) {
      throw error;
    }
  }

  async runCleanupNow(req: AuthRequest, res: Response) {
    try {
      const retentionSetting = await prisma.systemSetting.findUnique({
        where: { key: 'cleanup_retention_days' },
      });
      const logRetentionSetting = await prisma.systemSetting.findUnique({
        where: { key: 'activity_log_retention_days' },
      });

      const retentionDays = parseInt(retentionSetting?.value || '15', 10);
      const logRetentionDays = parseInt(logRetentionSetting?.value || '30', 10);

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const deletedArticles = await prisma.article.deleteMany({
        where: {
          status: 'PUBLISHED',
          publishedAt: { lt: cutoffDate },
        },
      });

      const logCutoffDate = new Date();
      logCutoffDate.setDate(logCutoffDate.getDate() - logRetentionDays);

      const deletedLogs = await prisma.activityLog.deleteMany({
        where: { createdAt: { lt: logCutoffDate } },
      });

      await prisma.activityLog.create({
        data: {
          type: 'MANUAL_CLEANUP',
          message: `Manual cleanup: ${deletedArticles.count} articles, ${deletedLogs.count} logs removed`,
          userId: req.user!.id,
          metadata: {
            articlesDeleted: deletedArticles.count,
            logsDeleted: deletedLogs.count,
            retentionDays,
            logRetentionDays,
          },
        },
      });

      res.json({
        articlesDeleted: deletedArticles.count,
        logsDeleted: deletedLogs.count,
      });
    } catch (error) {
      throw error;
    }
  }
}
