import { Response } from 'express';
import { prisma } from '../index.js';
import {
  createScheduleSchema,
  updateScheduleSchema,
  addKeywordsSchema,
  paginationSchema,
} from '../utils/validation.js';
import type { AuthRequest } from '../middlewares/auth.middleware.js';

export class ScheduleController {
  async list(req: AuthRequest, res: Response) {
    try {
      const query = paginationSchema.parse(req.query);
      const { page, limit, search, sortBy, sortOrder } = query;
      const { siteId, isActive } = req.query as { siteId?: string; isActive?: string };

      let where: any = {};

      if (search) {
        where.name = { contains: search, mode: 'insensitive' };
      }

      if (siteId) {
        where.siteId = siteId;
      }

      if (isActive !== undefined) {
        where.isActive = isActive === 'true';
      }

      // Filter by user's assigned sites (for non-admin)
      if (req.user!.role !== 'ADMIN') {
        const userSites = await prisma.userSite.findMany({
          where: { userId: req.user!.id },
          select: { siteId: true },
        });
        where.siteId = { in: userSites.map((us) => us.siteId) };
      }

      const [schedules, total] = await Promise.all([
        prisma.schedule.findMany({
          where,
          include: {
            site: { select: { id: true, name: true, url: true } },
            _count: { select: { keywords: true, articles: true } },
          },
          orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.schedule.count({ where }),
      ]);

      res.json({
        data: schedules,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      throw error;
    }
  }

  async create(req: AuthRequest, res: Response) {
    try {
      const data = createScheduleSchema.parse(req.body);

      // Check site access
      if (req.user!.role !== 'ADMIN') {
        const hasAccess = await prisma.userSite.findFirst({
          where: { userId: req.user!.id, siteId: data.siteId },
        });
        if (!hasAccess) {
          return res.status(403).json({ error: 'Access denied to this site' });
        }
      }

      const schedule = await prisma.schedule.create({
        data: {
          name: data.name,
          frequency: data.frequency,
          days: data.days,
          timeStart: data.timeStart,
          timeEnd: data.timeEnd,
          tone: data.tone,
          length: data.length,
          siteId: data.siteId,
          userId: req.user!.id,
          keywords: data.keywords
            ? {
                create: data.keywords.map((keyword) => ({ keyword })),
              }
            : undefined,
        },
        include: {
          site: { select: { id: true, name: true, url: true } },
          _count: { select: { keywords: true } },
        },
      });

      res.status(201).json(schedule);
    } catch (error) {
      throw error;
    }
  }

  async getById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const schedule = await prisma.schedule.findUnique({
        where: { id },
        include: {
          site: { select: { id: true, name: true, url: true } },
          user: { select: { id: true, name: true } },
          keywords: {
            orderBy: { createdAt: 'desc' },
          },
          _count: { select: { articles: true } },
        },
      });

      if (!schedule) {
        return res.status(404).json({ error: 'Schedule not found' });
      }

      res.json(schedule);
    } catch (error) {
      throw error;
    }
  }

  async update(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const data = updateScheduleSchema.parse(req.body);

      const existing = await prisma.schedule.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json({ error: 'Schedule not found' });
      }

      const schedule = await prisma.schedule.update({
        where: { id },
        data,
        include: {
          site: { select: { id: true, name: true, url: true } },
          _count: { select: { keywords: true, articles: true } },
        },
      });

      res.json(schedule);
    } catch (error) {
      throw error;
    }
  }

  async delete(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const existing = await prisma.schedule.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json({ error: 'Schedule not found' });
      }

      await prisma.schedule.delete({ where: { id } });

      res.json({ message: 'Schedule deleted successfully' });
    } catch (error) {
      throw error;
    }
  }

  async runNow(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const schedule = await prisma.schedule.findUnique({
        where: { id },
        include: {
          keywords: { where: { isUsed: false } },
          site: true,
        },
      });

      if (!schedule) {
        return res.status(404).json({ error: 'Schedule not found' });
      }

      if (schedule.keywords.length === 0) {
        return res.status(400).json({ error: 'No unused keywords available' });
      }

      // Pick random unused keyword
      const randomIndex = Math.floor(Math.random() * schedule.keywords.length);
      const keyword = schedule.keywords[randomIndex];

      // Create article
      const article = await prisma.article.create({
        data: {
          title: '',
          content: '',
          keyword: keyword.keyword,
          tone: schedule.tone,
          length: schedule.length,
          seoKeywords: [],
          status: 'DRAFT',
          siteId: schedule.siteId,
          userId: req.user!.id,
          scheduleId: schedule.id,
        },
      });

      // Mark keyword as used
      await prisma.keyword.update({
        where: { id: keyword.id },
        data: { isUsed: true, usedAt: new Date() },
      });

      // Update schedule lastRunAt
      await prisma.schedule.update({
        where: { id },
        data: { lastRunAt: new Date() },
      });

      // Log activity
      await prisma.activityLog.create({
        data: {
          type: 'SCHEDULE_RUN',
          message: `Schedule "${schedule.name}" triggered manually`,
          userId: req.user!.id,
          metadata: { scheduleId: id, articleId: article.id },
        },
      });

      res.json({
        message: 'Schedule triggered successfully',
        article: { id: article.id, keyword: keyword.keyword },
      });
    } catch (error) {
      throw error;
    }
  }

  async pause(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const schedule = await prisma.schedule.update({
        where: { id },
        data: { isActive: false },
        include: {
          site: { select: { id: true, name: true } },
        },
      });

      res.json(schedule);
    } catch (error) {
      throw error;
    }
  }

  async resume(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const schedule = await prisma.schedule.update({
        where: { id },
        data: { isActive: true },
        include: {
          site: { select: { id: true, name: true } },
        },
      });

      res.json(schedule);
    } catch (error) {
      throw error;
    }
  }

  async history(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const query = paginationSchema.parse(req.query);
      const { page, limit } = query;

      const [articles, total] = await Promise.all([
        prisma.article.findMany({
          where: { scheduleId: id },
          select: {
            id: true,
            title: true,
            keyword: true,
            status: true,
            createdAt: true,
            publishedAt: true,
            wpPostUrl: true,
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.article.count({ where: { scheduleId: id } }),
      ]);

      res.json({
        data: articles,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      throw error;
    }
  }

  // Keywords
  async listKeywords(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { isUsed } = req.query as { isUsed?: string };

      let where: any = { scheduleId: id };
      if (isUsed !== undefined) {
        where.isUsed = isUsed === 'true';
      }

      const keywords = await prisma.keyword.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });

      res.json(keywords);
    } catch (error) {
      throw error;
    }
  }

  async addKeywords(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const data = addKeywordsSchema.parse(req.body);

      // Check schedule exists
      const schedule = await prisma.schedule.findUnique({ where: { id } });
      if (!schedule) {
        return res.status(404).json({ error: 'Schedule not found' });
      }

      // Add keywords
      await prisma.keyword.createMany({
        data: data.keywords.map((keyword) => ({
          keyword,
          scheduleId: id,
        })),
      });

      const keywords = await prisma.keyword.findMany({
        where: { scheduleId: id },
        orderBy: { createdAt: 'desc' },
      });

      res.json(keywords);
    } catch (error) {
      throw error;
    }
  }

  async removeKeyword(req: AuthRequest, res: Response) {
    try {
      const { id, keywordId } = req.params;

      const keyword = await prisma.keyword.findFirst({
        where: { id: keywordId, scheduleId: id },
      });

      if (!keyword) {
        return res.status(404).json({ error: 'Keyword not found' });
      }

      await prisma.keyword.delete({ where: { id: keywordId } });

      res.json({ message: 'Keyword removed successfully' });
    } catch (error) {
      throw error;
    }
  }

  async bulkImportKeywords(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { keywords } = req.body as { keywords: string[] };

      if (!Array.isArray(keywords) || keywords.length === 0) {
        return res.status(400).json({ error: 'Keywords array is required' });
      }

      // Check schedule exists
      const schedule = await prisma.schedule.findUnique({ where: { id } });
      if (!schedule) {
        return res.status(404).json({ error: 'Schedule not found' });
      }

      // Filter out duplicates
      const existingKeywords = await prisma.keyword.findMany({
        where: { scheduleId: id },
        select: { keyword: true },
      });
      const existingSet = new Set(existingKeywords.map((k) => k.keyword.toLowerCase()));

      const newKeywords = keywords.filter(
        (k) => k.trim() && !existingSet.has(k.toLowerCase().trim())
      );

      if (newKeywords.length > 0) {
        await prisma.keyword.createMany({
          data: newKeywords.map((keyword) => ({
            keyword: keyword.trim(),
            scheduleId: id,
          })),
        });
      }

      res.json({
        message: `Added ${newKeywords.length} keywords, ${keywords.length - newKeywords.length} duplicates skipped`,
        added: newKeywords.length,
        skipped: keywords.length - newKeywords.length,
      });
    } catch (error) {
      throw error;
    }
  }
}
