import { z } from 'zod';

// Auth schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

// User schemas
export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['ADMIN', 'EDITOR', 'VIEWER']).default('EDITOR'),
});

export const updateUserSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  role: z.enum(['ADMIN', 'EDITOR', 'VIEWER']).optional(),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
});

export const assignSitesSchema = z.object({
  siteIds: z.array(z.string()),
});

// Site schemas
export const createSiteSchema = z.object({
  name: z.string().min(1, 'Site name is required'),
  url: z.string().url('Invalid URL'),
  username: z.string().min(1, 'Username is required'),
  appPassword: z.string().min(1, 'App password is required'),
  defaultCategory: z.string().optional(),
  defaultAuthor: z.string().optional(),
  defaultPostStatus: z.enum(['DRAFT', 'PUBLISH', 'PENDING']).default('DRAFT'),
});

export const updateSiteSchema = z.object({
  name: z.string().min(1).optional(),
  url: z.string().url().optional(),
  username: z.string().min(1).optional(),
  appPassword: z.string().min(1).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ERROR', 'PENDING']).optional(),
  defaultCategory: z.string().optional().nullable(),
  defaultAuthor: z.string().optional().nullable(),
  defaultPostStatus: z.enum(['DRAFT', 'PUBLISH', 'PENDING']).optional(),
});

// Site group schemas
export const createSiteGroupSchema = z.object({
  name: z.string().min(1, 'Group name is required'),
  siteIds: z.array(z.string()).optional(),
});

export const updateSiteGroupSchema = z.object({
  name: z.string().min(1).optional(),
  siteIds: z.array(z.string()).optional(),
});

// Article schemas
export const createArticleSchema = z.object({
  keyword: z.string().min(1, 'Keyword is required'),
  siteId: z.string().min(1, 'Site is required'),
  tone: z.enum(['FRIENDLY', 'FORMAL', 'EDUCATIONAL', 'SALES', 'PROFESSIONAL', 'HUMOROUS', 'INSPIRATIONAL', 'STORYTELLING', 'NEWS', 'REVIEW']),
  length: z.enum(['SHORT', 'MEDIUM', 'LONG']),
  seoKeywords: z.array(z.string()).optional(),
  category: z.string().optional(),
  categories: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  scheduledAt: z.string().datetime().optional(),
});

export const updateArticleSchema = z.object({
  title: z.string().optional(),
  content: z.string().optional(),
  excerpt: z.string().optional(),
  keyword: z.string().optional(),
  tone: z.enum(['FRIENDLY', 'FORMAL', 'EDUCATIONAL', 'SALES', 'PROFESSIONAL', 'HUMOROUS', 'INSPIRATIONAL', 'STORYTELLING', 'NEWS', 'REVIEW']).optional(),
  length: z.enum(['SHORT', 'MEDIUM', 'LONG']).optional(),
  seoKeywords: z.array(z.string()).optional(),
  featuredImage: z.string().optional().nullable(),
  category: z.string().optional(),
  categories: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  scheduledAt: z.string().datetime().optional().nullable(),
});

// Schedule schemas
export const createScheduleSchema = z.object({
  name: z.string().min(1, 'Schedule name is required'),
  siteId: z.string().min(1, 'Site is required'),
  frequency: z.number().min(1).max(7),
  days: z.array(z.number().min(0).max(6)),
  timeStart: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format'),
  timeEnd: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format'),
  tone: z.enum(['FRIENDLY', 'FORMAL', 'EDUCATIONAL', 'SALES', 'PROFESSIONAL', 'HUMOROUS', 'INSPIRATIONAL', 'STORYTELLING', 'NEWS', 'REVIEW']),
  length: z.enum(['SHORT', 'MEDIUM', 'LONG']),
  keywords: z.array(z.string()).optional(),
});

export const updateScheduleSchema = z.object({
  name: z.string().min(1).optional(),
  frequency: z.number().min(1).max(7).optional(),
  days: z.array(z.number().min(0).max(6)).optional(),
  timeStart: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  timeEnd: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  tone: z.enum(['FRIENDLY', 'FORMAL', 'EDUCATIONAL', 'SALES', 'PROFESSIONAL', 'HUMOROUS', 'INSPIRATIONAL', 'STORYTELLING', 'NEWS', 'REVIEW']).optional(),
  length: z.enum(['SHORT', 'MEDIUM', 'LONG']).optional(),
  isActive: z.boolean().optional(),
});

export const addKeywordsSchema = z.object({
  keywords: z.array(z.string().min(1)).min(1, 'At least one keyword is required'),
});

// API Key schemas
export const createApiKeySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  provider: z.enum(['CLAUDE', 'OPENAI', 'GEMINI', 'OPENROUTER', 'DALLE', 'REPLICATE']),
  key: z.string().min(1, 'API key is required'),
  model: z.string().optional(),
});

export const updateApiKeySchema = z.object({
  name: z.string().min(1).optional(),
  key: z.string().min(1).optional(),
  model: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

// Pagination schema
export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
