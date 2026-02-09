import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../index.js';
import { registerSchema, loginSchema, changePasswordSchema } from '../utils/validation.js';
import { AppError } from '../middlewares/error.middleware.js';
import type { AuthRequest } from '../middlewares/auth.middleware.js';

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const data = registerSchema.parse(req.body);

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (existingUser) {
        return res.status(409).json({ error: 'Email already registered' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, 12);

      // Check if this is the first user (make admin)
      const userCount = await prisma.user.count();
      const role = userCount === 0 ? 'ADMIN' : 'EDITOR';

      // Create user
      const user = await prisma.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          name: data.name,
          role,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
      });

      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET as string,
        { expiresIn: '7d' }
      );

      // Log activity
      await prisma.activityLog.create({
        data: {
          type: 'USER_REGISTERED',
          message: `User ${user.name} registered`,
          userId: user.id,
        },
      });

      res.status(201).json({ user, token });
    } catch (error) {
      throw error;
    }
  }

  async login(req: Request, res: Response) {
    try {
      const data = loginSchema.parse(req.body);

      // Find user
      const user = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Check password
      const isValid = await bcrypt.compare(data.password, user.password);

      if (!isValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET as string,
        { expiresIn: '7d' }
      );

      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          createdAt: user.createdAt,
        },
        token,
      });
    } catch (error) {
      throw error;
    }
  }

  async logout(req: AuthRequest, res: Response) {
    // JWT is stateless, so we just return success
    // In production, you might want to implement token blacklisting
    res.json({ message: 'Logged out successfully' });
  }

  async me(req: AuthRequest, res: Response) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
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

  async changePassword(req: AuthRequest, res: Response) {
    try {
      const data = changePasswordSchema.parse(req.body);

      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Verify current password
      const isValid = await bcrypt.compare(data.currentPassword, user.password);

      if (!isValid) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(data.newPassword, 12);

      // Update password
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });

      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      throw error;
    }
  }
}
