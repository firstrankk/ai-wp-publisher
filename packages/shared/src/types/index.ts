// User Types
export type Role = 'ADMIN' | 'EDITOR' | 'VIEWER';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserWithSites extends User {
  sites: Site[];
}

// Site Types
export type SiteStatus = 'ACTIVE' | 'INACTIVE' | 'ERROR' | 'PENDING';
export type PostStatus = 'DRAFT' | 'PUBLISH' | 'PENDING';

export interface Site {
  id: string;
  name: string;
  url: string;
  username: string;
  status: SiteStatus;
  defaultCategory?: string;
  defaultAuthor?: string;
  defaultPostStatus: PostStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface SiteGroup {
  id: string;
  name: string;
  sites: Site[];
  createdAt: Date;
}

// Article Types
export type ArticleStatus = 'DRAFT' | 'GENERATING' | 'READY' | 'PUBLISHING' | 'PUBLISHED' | 'FAILED';
export type Tone = 'FRIENDLY' | 'FORMAL' | 'EDUCATIONAL' | 'SALES';
export type Length = 'SHORT' | 'MEDIUM' | 'LONG';

export interface Article {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  keyword: string;
  tone: Tone;
  length: Length;
  seoKeywords: string[];
  featuredImage?: string;
  wpPostId?: string;
  wpPostUrl?: string;
  status: ArticleStatus;
  errorMessage?: string;
  siteId: string;
  userId: string;
  scheduleId?: string;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  scheduledAt?: Date;
}

export interface ArticleWithRelations extends Article {
  site: Site;
  user: User;
}

// Schedule Types
export interface Schedule {
  id: string;
  name: string;
  isActive: boolean;
  frequency: number;
  days: number[];
  timeStart: string;
  timeEnd: string;
  tone: Tone;
  length: Length;
  siteId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  lastRunAt?: Date;
}

export interface ScheduleWithRelations extends Schedule {
  site: Site;
  keywords: Keyword[];
  articles: Article[];
}

export interface Keyword {
  id: string;
  keyword: string;
  isUsed: boolean;
  usedAt?: Date;
  scheduleId: string;
  createdAt: Date;
}

// API Key Types
export type ApiProvider = 'CLAUDE' | 'OPENAI' | 'DALLE' | 'REPLICATE';

export interface ApiKey {
  id: string;
  name: string;
  provider: ApiProvider;
  isActive: boolean;
  usageCount: number;
  lastUsedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// API Request/Response Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface CreateSiteRequest {
  name: string;
  url: string;
  username: string;
  appPassword: string;
  defaultCategory?: string;
  defaultAuthor?: string;
  defaultPostStatus?: PostStatus;
}

export interface CreateArticleRequest {
  keyword: string;
  siteId: string;
  tone: Tone;
  length: Length;
  seoKeywords?: string[];
}

export interface GenerateArticleRequest {
  articleId: string;
}

export interface CreateScheduleRequest {
  name: string;
  siteId: string;
  frequency: number;
  days: number[];
  timeStart: string;
  timeEnd: string;
  tone: Tone;
  length: Length;
  keywords: string[];
}

// Dashboard Types
export interface DashboardStats {
  totalSites: number;
  activeSites: number;
  activeSchedules: number;
  todayPosts: number;
  weekPosts: number;
  queueCount: number;
  errorCount: number;
}

export interface RecentActivity {
  id: string;
  type: 'ARTICLE_CREATED' | 'ARTICLE_PUBLISHED' | 'SITE_ADDED' | 'SCHEDULE_RUN' | 'ERROR';
  message: string;
  createdAt: Date;
}

// Pagination
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
