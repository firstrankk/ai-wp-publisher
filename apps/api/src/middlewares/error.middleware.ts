import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', err);

  // Zod validation error (duck-type check to avoid CJS/ESM instanceof mismatch)
  if ((err as any)?.issues) {
    const errors = (err as any).issues.map((e: any) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return res.status(400).json({
      error: 'Validation failed',
      details: errors,
    });
  }

  // Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002':
        const target = (err.meta?.target as string[])?.join(', ');
        return res.status(409).json({
          error: `Duplicate entry for: ${target}`,
        });
      case 'P2025':
        return res.status(404).json({
          error: 'Record not found',
        });
      case 'P2003':
        return res.status(400).json({
          error: 'Foreign key constraint failed',
        });
      default:
        return res.status(400).json({
          error: 'Database error',
        });
    }
  }

  // Custom AppError
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
    });
  }

  // Default error
  return res.status(500).json({
    error: 'Internal server error',
  });
};

export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
