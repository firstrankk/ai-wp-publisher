import { Response } from 'express';
import { prisma } from '../index.js';
import type { AuthRequest } from '../middlewares/auth.middleware.js';

export class DashboardController {
  async getStats(req: AuthRequest, res: Response) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);

      // Build site filter for non-admin
      let siteFilter: any = {};
      if (req.user!.role !== 'ADMIN') {
        const userSites = await prisma.userSite.findMany({
          where: { userId: req.user!.id },
          select: { siteId: true },
        });
        siteFilter = { siteId: { in: userSites.map((us) => us.siteId) } };
      }

      const [
        totalSites,
        activeSites,
        todayPosts,
        weekPosts,
        queueCount,
        errorCount,
      ] = await Promise.all([
        prisma.site.count(req.user!.role !== 'ADMIN' ? { where: { users: { some: { userId: req.user!.id } } } } : {}),
        prisma.site.count({
          where: {
            status: 'ACTIVE',
            ...(req.user!.role !== 'ADMIN' ? { users: { some: { userId: req.user!.id } } } : {}),
          },
        }),
        prisma.article.count({
          where: {
            status: 'PUBLISHED',
            publishedAt: { gte: today },
            ...siteFilter,
          },
        }),
        prisma.article.count({
          where: {
            status: 'PUBLISHED',
            publishedAt: { gte: weekAgo },
            ...siteFilter,
          },
        }),
        prisma.article.count({
          where: {
            status: { in: ['DRAFT', 'GENERATING', 'READY', 'PUBLISHING'] },
            ...siteFilter,
          },
        }),
        prisma.article.count({
          where: {
            status: 'FAILED',
            createdAt: { gte: weekAgo },
            ...siteFilter,
          },
        }),
      ]);

      res.json({
        totalSites,
        activeSites,
        todayPosts,
        weekPosts,
        queueCount,
        errorCount,
      });
    } catch (error) {
      throw error;
    }
  }

  async getRecentActivity(req: AuthRequest, res: Response) {
    try {
      const activities = await prisma.activityLog.findMany({
        where: req.user!.role !== 'ADMIN'
          ? { userId: req.user!.id }
          : {},
        orderBy: { createdAt: 'desc' },
        take: 20,
      });

      res.json(activities);
    } catch (error) {
      throw error;
    }
  }

  async getPostsReport(req: AuthRequest, res: Response) {
    try {
      const { period = 'week' } = req.query as { period?: 'day' | 'week' | 'month' };

      const startDate = new Date();
      switch (period) {
        case 'day':
          startDate.setDate(startDate.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
      }

      // Build site filter for non-admin
      let siteFilter: any = {};
      if (req.user!.role !== 'ADMIN') {
        const userSites = await prisma.userSite.findMany({
          where: { userId: req.user!.id },
          select: { siteId: true },
        });
        siteFilter = { siteId: { in: userSites.map((us) => us.siteId) } };
      }

      const [published, failed, pending] = await Promise.all([
        prisma.article.count({
          where: {
            status: 'PUBLISHED',
            publishedAt: { gte: startDate },
            ...siteFilter,
          },
        }),
        prisma.article.count({
          where: {
            status: 'FAILED',
            createdAt: { gte: startDate },
            ...siteFilter,
          },
        }),
        prisma.article.count({
          where: {
            status: { in: ['DRAFT', 'GENERATING', 'READY'] },
            createdAt: { gte: startDate },
            ...siteFilter,
          },
        }),
      ]);

      // Get posts by site
      const postsBySite = await prisma.article.groupBy({
        by: ['siteId'],
        where: {
          status: 'PUBLISHED',
          publishedAt: { gte: startDate },
          ...siteFilter,
        },
        _count: true,
      });

      // Get site names
      const siteIds = postsBySite.map((p) => p.siteId);
      const sites = await prisma.site.findMany({
        where: { id: { in: siteIds } },
        select: { id: true, name: true },
      });

      const siteMap = new Map(sites.map((s) => [s.id, s.name]));

      res.json({
        summary: { published, failed, pending },
        bySite: postsBySite.map((p) => ({
          siteId: p.siteId,
          siteName: siteMap.get(p.siteId) || 'Unknown',
          count: p._count,
        })),
      });
    } catch (error) {
      throw error;
    }
  }

  async getErrorsReport(req: AuthRequest, res: Response) {
    try {
      // Build site filter for non-admin
      let siteFilter: any = {};
      if (req.user!.role !== 'ADMIN') {
        const userSites = await prisma.userSite.findMany({
          where: { userId: req.user!.id },
          select: { siteId: true },
        });
        siteFilter = { siteId: { in: userSites.map((us) => us.siteId) } };
      }

      const errors = await prisma.article.findMany({
        where: {
          status: 'FAILED',
          ...siteFilter,
        },
        select: {
          id: true,
          title: true,
          keyword: true,
          errorMessage: true,
          createdAt: true,
          site: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      res.json(errors);
    } catch (error) {
      throw error;
    }
  }

  async getApiUsageReport(req: AuthRequest, res: Response) {
    try {
      // Admin only
      if (req.user!.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const apiKeys = await prisma.apiKey.findMany({
        select: {
          id: true,
          name: true,
          provider: true,
          usageCount: true,
          lastUsedAt: true,
          isActive: true,
        },
        orderBy: { usageCount: 'desc' },
      });

      const totalUsage = apiKeys.reduce((sum, key) => sum + key.usageCount, 0);

      res.json({
        totalUsage,
        keys: apiKeys,
      });
    } catch (error) {
      throw error;
    }
  }
}
