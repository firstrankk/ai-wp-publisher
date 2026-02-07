import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../index.js';
import {
  createUserSchema,
  updateUserSchema,
  assignSitesSchema,
  paginationSchema,
} from '../utils/validation.js';
import type { AuthRequest } from '../middlewares/auth.middleware.js';

export class UserController {
  async list(req: AuthRequest, res: Response) {
    try {
      const query = paginationSchema.parse(req.query);
      const { page, limit, search, sortBy, sortOrder } = query;

      const where = search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { email: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {};

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
            updatedAt: true,
            _count: {
              select: { sites: true, articles: true },
            },
          },
          orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.user.count({ where }),
      ]);

      res.json({
        data: users,
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
      const data = createUserSchema.parse(req.body);

      // Check if email exists
      const existing = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (existing) {
        return res.status(409).json({ error: 'Email already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, 12);

      const user = await prisma.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          name: data.name,
          role: data.role,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
      });

      res.status(201).json(user);
    } catch (error) {
      throw error;
    }
  }

  async getById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          sites: {
            include: {
              site: {
                select: {
                  id: true,
                  name: true,
                  url: true,
                  status: true,
                },
              },
            },
          },
        },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Transform sites
      const userData = {
        ...user,
        sites: user.sites.map((us) => us.site),
      };

      res.json(userData);
    } catch (error) {
      throw error;
    }
  }

  async update(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const data = updateUserSchema.parse(req.body);

      // Check if user exists
      const existing = await prisma.user.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Check email uniqueness if updating email
      if (data.email && data.email !== existing.email) {
        const emailExists = await prisma.user.findUnique({
          where: { email: data.email },
        });
        if (emailExists) {
          return res.status(409).json({ error: 'Email already exists' });
        }
      }

      // Hash password if provided
      const updateData: any = { ...data };
      if (data.password) {
        updateData.password = await bcrypt.hash(data.password, 12);
      }

      const user = await prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      res.json(user);
    } catch (error) {
      throw error;
    }
  }

  async delete(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      // Prevent self-deletion
      if (id === req.user!.id) {
        return res.status(400).json({ error: 'Cannot delete your own account' });
      }

      // Check if user exists
      const existing = await prisma.user.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json({ error: 'User not found' });
      }

      await prisma.user.delete({ where: { id } });

      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      throw error;
    }
  }

  async assignSites(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const data = assignSitesSchema.parse(req.body);

      // Check if user exists
      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Remove all existing assignments
      await prisma.userSite.deleteMany({
        where: { userId: id },
      });

      // Create new assignments
      if (data.siteIds.length > 0) {
        await prisma.userSite.createMany({
          data: data.siteIds.map((siteId) => ({
            userId: id,
            siteId,
          })),
        });
      }

      // Get updated user with sites
      const updatedUser = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          sites: {
            include: {
              site: {
                select: {
                  id: true,
                  name: true,
                  url: true,
                  status: true,
                },
              },
            },
          },
        },
      });

      res.json({
        ...updatedUser,
        sites: updatedUser!.sites.map((us) => us.site),
      });
    } catch (error) {
      throw error;
    }
  }
}
