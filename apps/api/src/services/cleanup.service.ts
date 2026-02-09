import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';

// Run daily at 3:00 AM
const CLEANUP_CRON_SCHEDULE = process.env.CLEANUP_CRON_SCHEDULE || '0 3 * * *';

async function getCleanupSettings(prisma: PrismaClient) {
  const settings = await prisma.systemSetting.findMany({
    where: {
      key: { in: ['cleanup_enabled', 'cleanup_retention_days', 'activity_log_retention_days'] },
    },
  });

  const map: Record<string, string> = {};
  for (const s of settings) {
    map[s.key] = s.value;
  }

  return {
    enabled: (map.cleanup_enabled ?? 'true') === 'true',
    retentionDays: parseInt(map.cleanup_retention_days ?? '15', 10),
    logRetentionDays: parseInt(map.activity_log_retention_days ?? '30', 10),
  };
}

export function startCleanupJob(prisma: PrismaClient) {
  console.log('[Cleanup] Scheduled: daily at 3:00 AM (reads settings from DB)');

  cron.schedule(CLEANUP_CRON_SCHEDULE, async () => {
    try {
      const settings = await getCleanupSettings(prisma);

      if (!settings.enabled) {
        console.log('[Cleanup] Skipped — disabled in settings');
        return;
      }

      console.log(`[Cleanup] Starting: retention=${settings.retentionDays}d, logs=${settings.logRetentionDays}d`);

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - settings.retentionDays);

      // Delete only PUBLISHED articles older than retention period
      // This does NOT delete from WordPress — only from local DB
      const deletedArticles = await prisma.article.deleteMany({
        where: {
          status: 'PUBLISHED',
          publishedAt: { lt: cutoffDate },
        },
      });

      console.log(`[Cleanup] Deleted ${deletedArticles.count} published articles`);

      // Clean up old activity logs
      const logCutoffDate = new Date();
      logCutoffDate.setDate(logCutoffDate.getDate() - settings.logRetentionDays);

      const deletedLogs = await prisma.activityLog.deleteMany({
        where: { createdAt: { lt: logCutoffDate } },
      });

      console.log(`[Cleanup] Deleted ${deletedLogs.count} activity logs`);

      await prisma.activityLog.create({
        data: {
          type: 'SYSTEM_CLEANUP',
          message: `Auto cleanup: ${deletedArticles.count} articles, ${deletedLogs.count} logs removed`,
          metadata: {
            articlesDeleted: deletedArticles.count,
            logsDeleted: deletedLogs.count,
            retentionDays: settings.retentionDays,
            logRetentionDays: settings.logRetentionDays,
          },
        },
      });
    } catch (error) {
      console.error('[Cleanup] Error:', error);
    }
  });
}
