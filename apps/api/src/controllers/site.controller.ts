import { Request, Response } from 'express';
import { prisma } from '../index.js';
import {
  createSiteSchema,
  updateSiteSchema,
  createSiteGroupSchema,
  updateSiteGroupSchema,
  paginationSchema,
} from '../utils/validation.js';
import { encrypt, decrypt } from '../utils/encryption.js';
import { WordPressService } from '../services/wordpress.service.js';
import type { AuthRequest } from '../middlewares/auth.middleware.js';

export class SiteController {
  async list(req: AuthRequest, res: Response) {
    try {
      const query = paginationSchema.parse(req.query);
      const { page, limit, search, sortBy, sortOrder } = query;
      const { status, groupId } = req.query as { status?: string; groupId?: string };

      // Build where clause
      let where: any = {};

      // Search
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { url: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Filter by status
      if (status) {
        where.status = status;
      }

      // Filter by group
      if (groupId) {
        where.groups = {
          some: { groupId },
        };
      }

      // Filter by user's assigned sites (for non-admin)
      if (req.user!.role !== 'ADMIN') {
        where.users = {
          some: { userId: req.user!.id },
        };
      }

      const [sites, total] = await Promise.all([
        prisma.site.findMany({
          where,
          select: {
            id: true,
            name: true,
            url: true,
            username: true,
            status: true,
            defaultCategory: true,
            defaultAuthor: true,
            defaultPostStatus: true,
            createdAt: true,
            updatedAt: true,
            _count: {
              select: { articles: true, schedules: true },
            },
            groups: {
              include: {
                group: {
                  select: { id: true, name: true },
                },
              },
            },
          },
          orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.site.count({ where }),
      ]);

      // Transform groups
      const transformedSites = sites.map((site) => ({
        ...site,
        groups: site.groups.map((g) => g.group),
      }));

      res.json({
        data: transformedSites,
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
      const data = createSiteSchema.parse(req.body);

      // Encrypt app password
      const encryptedPassword = encrypt(data.appPassword);

      const site = await prisma.site.create({
        data: {
          name: data.name,
          url: data.url.replace(/\/$/, ''), // Remove trailing slash
          username: data.username,
          appPassword: encryptedPassword,
          defaultCategory: data.defaultCategory,
          defaultAuthor: data.defaultAuthor,
          defaultPostStatus: data.defaultPostStatus,
          status: 'PENDING',
        },
        select: {
          id: true,
          name: true,
          url: true,
          username: true,
          status: true,
          defaultCategory: true,
          defaultAuthor: true,
          defaultPostStatus: true,
          createdAt: true,
        },
      });

      // Log activity
      await prisma.activityLog.create({
        data: {
          type: 'SITE_ADDED',
          message: `Site ${site.name} added`,
          userId: req.user!.id,
          metadata: { siteId: site.id },
        },
      });

      res.status(201).json(site);
    } catch (error) {
      throw error;
    }
  }

  async getById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const site = await prisma.site.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          url: true,
          username: true,
          status: true,
          defaultCategory: true,
          defaultAuthor: true,
          defaultPostStatus: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: { articles: true, schedules: true },
          },
          groups: {
            include: {
              group: { select: { id: true, name: true } },
            },
          },
        },
      });

      if (!site) {
        return res.status(404).json({ error: 'Site not found' });
      }

      // Check access for non-admin
      if (req.user!.role !== 'ADMIN') {
        const hasAccess = await prisma.userSite.findFirst({
          where: { userId: req.user!.id, siteId: id },
        });
        if (!hasAccess) {
          return res.status(403).json({ error: 'Access denied' });
        }
      }

      res.json({
        ...site,
        groups: site.groups.map((g) => g.group),
      });
    } catch (error) {
      throw error;
    }
  }

  async update(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const data = updateSiteSchema.parse(req.body);

      // Check if site exists
      const existing = await prisma.site.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json({ error: 'Site not found' });
      }

      // Prepare update data
      const updateData: any = { ...data };

      // Encrypt app password if provided
      if (data.appPassword) {
        updateData.appPassword = encrypt(data.appPassword);
      }

      // Remove trailing slash from URL
      if (data.url) {
        updateData.url = data.url.replace(/\/$/, '');
      }

      const site = await prisma.site.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          name: true,
          url: true,
          username: true,
          status: true,
          defaultCategory: true,
          defaultAuthor: true,
          defaultPostStatus: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      res.json(site);
    } catch (error) {
      throw error;
    }
  }

  async delete(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const existing = await prisma.site.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json({ error: 'Site not found' });
      }

      await prisma.site.delete({ where: { id } });

      res.json({ message: 'Site deleted successfully' });
    } catch (error) {
      throw error;
    }
  }

  async testConnection(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const site = await prisma.site.findUnique({ where: { id } });
      if (!site) {
        return res.status(404).json({ error: 'Site not found' });
      }

      // Decrypt password
      const appPassword = decrypt(site.appPassword);

      // Test connection
      const wpService = new WordPressService(site.url, site.username, appPassword);
      const result = await wpService.testConnection();

      // Update status based on result
      await prisma.site.update({
        where: { id },
        data: {
          status: result.success ? 'ACTIVE' : 'ERROR',
        },
      });

      res.json(result);
    } catch (error) {
      // Update status to error
      await prisma.site.update({
        where: { id: req.params.id },
        data: { status: 'ERROR' },
      });
      throw error;
    }
  }

  async getCategories(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const site = await prisma.site.findUnique({ where: { id } });
      if (!site) {
        return res.status(404).json({ error: 'Site not found' });
      }

      // Decrypt password
      const appPassword = decrypt(site.appPassword);

      // Get categories from WordPress
      const wpService = new WordPressService(site.url, site.username, appPassword);
      const categories = await wpService.getCategories();

      res.json(categories);
    } catch (error) {
      throw error;
    }
  }

  async bulkImport(req: AuthRequest, res: Response) {
    try {
      const { sites } = req.body as { sites: any[] };

      if (!Array.isArray(sites) || sites.length === 0) {
        return res.status(400).json({ error: 'Sites array is required' });
      }

      const results = {
        success: 0,
        failed: 0,
        errors: [] as string[],
      };

      for (const siteData of sites) {
        try {
          const validated = createSiteSchema.parse(siteData);
          const encryptedPassword = encrypt(validated.appPassword);

          await prisma.site.create({
            data: {
              name: validated.name,
              url: validated.url.replace(/\/$/, ''),
              username: validated.username,
              appPassword: encryptedPassword,
              defaultCategory: validated.defaultCategory,
              defaultAuthor: validated.defaultAuthor,
              defaultPostStatus: validated.defaultPostStatus,
              status: 'PENDING',
            },
          });
          results.success++;
        } catch (error: any) {
          results.failed++;
          results.errors.push(`${siteData.url}: ${error.message}`);
        }
      }

      res.json(results);
    } catch (error) {
      throw error;
    }
  }

  async exportCsv(req: AuthRequest, res: Response) {
    try {
      const sites = await prisma.site.findMany({
        select: {
          name: true,
          url: true,
          username: true,
          status: true,
          defaultCategory: true,
          defaultAuthor: true,
          defaultPostStatus: true,
          createdAt: true,
        },
      });

      // Create CSV content
      const headers = ['Name', 'URL', 'Username', 'Status', 'Default Category', 'Default Author', 'Default Post Status', 'Created At'];
      const rows = sites.map((site) => [
        site.name,
        site.url,
        site.username,
        site.status,
        site.defaultCategory || '',
        site.defaultAuthor || '',
        site.defaultPostStatus,
        site.createdAt.toISOString(),
      ]);

      const csv = [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=sites.csv');
      res.send(csv);
    } catch (error) {
      throw error;
    }
  }

  // Site Groups
  async listGroups(req: AuthRequest, res: Response) {
    try {
      const groups = await prisma.siteGroup.findMany({
        include: {
          _count: {
            select: { sites: true },
          },
        },
        orderBy: { name: 'asc' },
      });

      res.json(groups);
    } catch (error) {
      throw error;
    }
  }

  async createGroup(req: AuthRequest, res: Response) {
    try {
      const data = createSiteGroupSchema.parse(req.body);

      const group = await prisma.siteGroup.create({
        data: {
          name: data.name,
          sites: data.siteIds
            ? {
                create: data.siteIds.map((siteId) => ({ siteId })),
              }
            : undefined,
        },
        include: {
          _count: { select: { sites: true } },
        },
      });

      res.status(201).json(group);
    } catch (error) {
      throw error;
    }
  }

  async updateGroup(req: AuthRequest, res: Response) {
    try {
      const { groupId } = req.params;
      const data = updateSiteGroupSchema.parse(req.body);

      const existing = await prisma.siteGroup.findUnique({ where: { id: groupId } });
      if (!existing) {
        return res.status(404).json({ error: 'Group not found' });
      }

      // Update group name
      if (data.name) {
        await prisma.siteGroup.update({
          where: { id: groupId },
          data: { name: data.name },
        });
      }

      // Update site assignments
      if (data.siteIds !== undefined) {
        // Remove all existing
        await prisma.siteGroupSite.deleteMany({
          where: { groupId },
        });

        // Add new
        if (data.siteIds.length > 0) {
          await prisma.siteGroupSite.createMany({
            data: data.siteIds.map((siteId) => ({
              groupId,
              siteId,
            })),
          });
        }
      }

      const updated = await prisma.siteGroup.findUnique({
        where: { id: groupId },
        include: {
          _count: { select: { sites: true } },
          sites: {
            include: {
              site: { select: { id: true, name: true, url: true } },
            },
          },
        },
      });

      res.json({
        ...updated,
        sites: updated!.sites.map((s) => s.site),
      });
    } catch (error) {
      throw error;
    }
  }

  async deleteGroup(req: AuthRequest, res: Response) {
    try {
      const { groupId } = req.params;

      const existing = await prisma.siteGroup.findUnique({ where: { id: groupId } });
      if (!existing) {
        return res.status(404).json({ error: 'Group not found' });
      }

      await prisma.siteGroup.delete({ where: { id: groupId } });

      res.json({ message: 'Group deleted successfully' });
    } catch (error) {
      throw error;
    }
  }
}
