# Technical Specification
## AI WordPress Publisher

---

## 1. Technology Stack

### 1.1 Frontend
```
Framework:      Next.js 14 (App Router)
Language:       TypeScript
Styling:        Tailwind CSS
UI Components:  Shadcn/ui
State:          Zustand + React Query
Forms:          React Hook Form + Zod
Charts:         Recharts
```

### 1.2 Backend
```
Runtime:        Node.js 20+
Framework:      Next.js API Routes
ORM:            Prisma
Database:       PostgreSQL 15+
Queue:          BullMQ + Redis
Auth:           NextAuth.js
```

### 1.3 External Services
```
AI Content:     Claude API (Anthropic)
AI Image:       Canvas API / Sharp (Text Overlay)
WordPress:      REST API v2
```

### 1.4 Infrastructure
```
Hosting:        Vercel / Railway / VPS
Database:       Supabase / Railway / Neon
Redis:          Upstash / Railway
Storage:        Cloudflare R2 / S3 (for images)
```

---

## 2. Database Schema (Prisma)

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ==================== USER & AUTH ====================

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  password      String    // bcrypt hashed
  name          String
  role          UserRole  @default(EDITOR)
  isActive      Boolean   @default(true)
  
  // Relations
  sites         UserSite[]
  articles      Article[]
  activityLogs  ActivityLog[]
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

enum UserRole {
  ADMIN
  EDITOR
  VIEWER
}

// ==================== SITE MANAGEMENT ====================

model Site {
  id                  String      @id @default(cuid())
  name                String
  url                 String      @unique
  username            String
  applicationPassword String      // encrypted
  status              SiteStatus  @default(PENDING)
  
  // Default settings
  defaultCategory     String?
  defaultAuthor       String?
  defaultPostStatus   PostStatus  @default(PUBLISH)
  
  // Relations
  group               SiteGroup?  @relation(fields: [groupId], references: [id])
  groupId             String?
  users               UserSite[]
  articles            Article[]
  schedules           Schedule[]
  
  // Metadata
  lastCheckedAt       DateTime?
  lastErrorMessage    String?
  
  createdAt           DateTime    @default(now())
  updatedAt           DateTime    @updatedAt
  
  @@index([groupId])
  @@index([status])
}

enum SiteStatus {
  ACTIVE
  INACTIVE
  ERROR
  PENDING
}

enum PostStatus {
  DRAFT
  PUBLISH
  PENDING
}

model SiteGroup {
  id          String    @id @default(cuid())
  name        String    @unique
  description String?
  color       String?   // for UI display
  
  sites       Site[]
  
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model UserSite {
  id        String   @id @default(cuid())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId    String
  site      Site     @relation(fields: [siteId], references: [id], onDelete: Cascade)
  siteId    String
  
  createdAt DateTime @default(now())
  
  @@unique([userId, siteId])
  @@index([userId])
  @@index([siteId])
}

// ==================== ARTICLE MANAGEMENT ====================

model Article {
  id              String          @id @default(cuid())
  
  // Content
  keyword         String
  title           String?
  content         String?         @db.Text
  excerpt         String?
  seoKeywords     String[]
  
  // Settings
  tone            ArticleTone     @default(FRIENDLY)
  length          ArticleLength   @default(MEDIUM)
  
  // Featured Image
  featuredImageUrl    String?
  imageBackgroundType BackgroundType @default(GRADIENT)
  imageBackgroundValue String?      // color code or gradient
  imageFontFamily     String?
  imageTextColor      String?
  
  // Status
  status          ArticleStatus   @default(DRAFT)
  errorMessage    String?
  retryCount      Int             @default(0)
  
  // WordPress Reference
  wpPostId        Int?
  wpPostUrl       String?
  
  // Relations
  site            Site            @relation(fields: [siteId], references: [id])
  siteId          String
  user            User            @relation(fields: [userId], references: [id])
  userId          String
  schedule        Schedule?       @relation(fields: [scheduleId], references: [id])
  scheduleId      String?
  
  // Timestamps
  generatedAt     DateTime?
  publishedAt     DateTime?
  scheduledFor    DateTime?
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
  
  @@index([siteId])
  @@index([userId])
  @@index([status])
  @@index([scheduleId])
  @@index([scheduledFor])
}

enum ArticleTone {
  FRIENDLY      // เป็นกันเอง
  PROFESSIONAL  // ทางการ
  INFORMATIVE   // ให้ความรู้
  SALES         // ขายของ
}

enum ArticleLength {
  SHORT         // ~500 words
  MEDIUM        // ~1000 words
  LONG          // ~1500+ words
}

enum ArticleStatus {
  DRAFT         // รอสร้าง
  GENERATING    // กำลังสร้าง
  READY         // พร้อมโพสต์
  PUBLISHING    // กำลังโพสต์
  PUBLISHED     // โพสต์แล้ว
  FAILED        // Error
  CANCELLED     // ยกเลิก
}

enum BackgroundType {
  SOLID
  GRADIENT
  PATTERN
}

// ==================== SCHEDULE MANAGEMENT ====================

model Schedule {
  id              String          @id @default(cuid())
  name            String
  
  // Target
  site            Site            @relation(fields: [siteId], references: [id])
  siteId          String
  
  // Frequency
  postsPerWeek    Int             @default(3)
  daysOfWeek      Int[]           // 0=Sunday, 1=Monday, etc.
  timeRangeStart  String          // "09:00"
  timeRangeEnd    String          // "17:00"
  
  // Content Settings
  tone            ArticleTone     @default(FRIENDLY)
  length          ArticleLength   @default(MEDIUM)
  
  // Status
  isActive        Boolean         @default(true)
  lastRunAt       DateTime?
  nextRunAt       DateTime?
  
  // Relations
  keywords        ScheduleKeyword[]
  articles        Article[]
  
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
  
  @@index([siteId])
  @@index([isActive])
  @@index([nextRunAt])
}

model ScheduleKeyword {
  id          String    @id @default(cuid())
  keyword     String
  isUsed      Boolean   @default(false)
  usedAt      DateTime?
  
  schedule    Schedule  @relation(fields: [scheduleId], references: [id], onDelete: Cascade)
  scheduleId  String
  
  createdAt   DateTime  @default(now())
  
  @@index([scheduleId])
  @@index([isUsed])
}

// ==================== API KEY MANAGEMENT ====================

model ApiKey {
  id          String      @id @default(cuid())
  name        String
  provider    ApiProvider
  key         String      // encrypted
  isActive    Boolean     @default(true)
  
  // Usage tracking
  usageCount  Int         @default(0)
  lastUsedAt  DateTime?
  
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  
  @@index([provider])
  @@index([isActive])
}

enum ApiProvider {
  CLAUDE
  OPENAI
  DALLE
  REPLICATE
}

// ==================== ACTIVITY LOG ====================

model ActivityLog {
  id          String      @id @default(cuid())
  action      String      // e.g., "article.created", "site.updated"
  entity      String      // e.g., "Article", "Site"
  entityId    String?
  details     Json?
  
  user        User?       @relation(fields: [userId], references: [id])
  userId      String?
  
  createdAt   DateTime    @default(now())
  
  @@index([userId])
  @@index([entity])
  @@index([createdAt])
}

// ==================== JOB QUEUE (Optional - for tracking) ====================

model Job {
  id          String    @id @default(cuid())
  type        JobType
  status      JobStatus @default(PENDING)
  payload     Json
  result      Json?
  error       String?
  attempts    Int       @default(0)
  
  processedAt DateTime?
  completedAt DateTime?
  createdAt   DateTime  @default(now())
  
  @@index([type])
  @@index([status])
  @@index([createdAt])
}

enum JobType {
  GENERATE_ARTICLE
  GENERATE_IMAGE
  PUBLISH_ARTICLE
  TEST_CONNECTION
}

enum JobStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}
```

---

## 3. API Endpoints

### 3.1 Authentication

```
POST   /api/auth/register        - Register new user (Admin only)
POST   /api/auth/login           - Login
POST   /api/auth/logout          - Logout
POST   /api/auth/forgot-password - Request password reset
POST   /api/auth/reset-password  - Reset password with token
GET    /api/auth/me              - Get current user
```

### 3.2 Users (Admin Only)

```
GET    /api/users                - List all users
POST   /api/users                - Create user
GET    /api/users/:id            - Get user detail
PUT    /api/users/:id            - Update user
DELETE /api/users/:id            - Delete user
PUT    /api/users/:id/role       - Update user role
PUT    /api/users/:id/sites      - Assign sites to user
GET    /api/users/:id/activity   - Get user activity log
```

### 3.3 Sites

```
GET    /api/sites                - List sites (filtered by permission)
POST   /api/sites                - Create site
GET    /api/sites/:id            - Get site detail
PUT    /api/sites/:id            - Update site
DELETE /api/sites/:id            - Delete site (soft delete)
POST   /api/sites/:id/test       - Test WordPress connection
POST   /api/sites/import         - Bulk import from CSV
GET    /api/sites/export         - Export sites to CSV
```

### 3.4 Site Groups

```
GET    /api/site-groups          - List all groups
POST   /api/site-groups          - Create group
GET    /api/site-groups/:id      - Get group detail
PUT    /api/site-groups/:id      - Update group
DELETE /api/site-groups/:id      - Delete group
PUT    /api/site-groups/:id/sites - Assign sites to group
```

### 3.5 Articles

```
GET    /api/articles             - List articles (filter by site, status, date)
POST   /api/articles             - Create article (manual)
GET    /api/articles/:id         - Get article detail
PUT    /api/articles/:id         - Update article
DELETE /api/articles/:id         - Delete article
POST   /api/articles/:id/generate      - Generate content with AI
POST   /api/articles/:id/generate-image - Generate featured image
POST   /api/articles/:id/publish       - Publish to WordPress
POST   /api/articles/:id/retry         - Retry failed article
POST   /api/articles/bulk              - Bulk create articles
```

### 3.6 Schedules

```
GET    /api/schedules            - List schedules
POST   /api/schedules            - Create schedule
GET    /api/schedules/:id        - Get schedule detail
PUT    /api/schedules/:id        - Update schedule
DELETE /api/schedules/:id        - Delete schedule
POST   /api/schedules/:id/pause  - Pause schedule
POST   /api/schedules/:id/resume - Resume schedule
POST   /api/schedules/:id/run    - Run schedule now (manual trigger)
GET    /api/schedules/:id/history - Get schedule run history
```

### 3.7 Schedule Keywords

```
GET    /api/schedules/:id/keywords     - List keywords
POST   /api/schedules/:id/keywords     - Add keywords
DELETE /api/schedules/:id/keywords/:kid - Remove keyword
POST   /api/schedules/:id/keywords/import - Import from CSV
```

### 3.8 API Keys (Admin Only)

```
GET    /api/api-keys             - List API keys
POST   /api/api-keys             - Add API key
PUT    /api/api-keys/:id         - Update API key
DELETE /api/api-keys/:id         - Delete API key
POST   /api/api-keys/:id/test    - Test API key
GET    /api/api-keys/usage       - Get usage statistics
```

### 3.9 Dashboard

```
GET    /api/dashboard/stats      - Get overview statistics
GET    /api/dashboard/recent     - Get recent activity
GET    /api/dashboard/queue      - Get queue status
GET    /api/dashboard/errors     - Get recent errors
```

### 3.10 Reports

```
GET    /api/reports/posts        - Post summary report
GET    /api/reports/sites        - Site performance report
GET    /api/reports/errors       - Error report
GET    /api/reports/api-usage    - API usage report
GET    /api/reports/export       - Export report to CSV
```

### 3.11 Settings

```
GET    /api/settings             - Get system settings
PUT    /api/settings             - Update system settings
GET    /api/settings/profile     - Get user profile
PUT    /api/settings/profile     - Update user profile
PUT    /api/settings/password    - Change password
```

---

## 4. Request/Response Examples

### 4.1 Create Site

**Request:**
```http
POST /api/sites
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "My Tech Blog",
  "url": "https://mytechblog.com",
  "username": "admin@mytechblog.com",
  "applicationPassword": "xxxx xxxx xxxx xxxx",
  "groupId": "clxxx...",  // optional
  "defaultCategory": "technology",
  "defaultPostStatus": "PUBLISH"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "clxxx...",
    "name": "My Tech Blog",
    "url": "https://mytechblog.com",
    "status": "PENDING",
    "createdAt": "2026-02-04T10:00:00Z"
  }
}
```

### 4.2 Create Article

**Request:**
```http
POST /api/articles
Content-Type: application/json

{
  "siteId": "clxxx...",
  "keyword": "รีวิว iPhone 16 Pro",
  "tone": "FRIENDLY",
  "length": "MEDIUM",
  "seoKeywords": ["iPhone 16", "รีวิวมือถือ", "Apple"],
  "imageBackgroundType": "GRADIENT",
  "imageBackgroundValue": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "clxxx...",
    "keyword": "รีวิว iPhone 16 Pro",
    "status": "DRAFT",
    "createdAt": "2026-02-04T10:00:00Z"
  }
}
```

### 4.3 Generate Article Content

**Request:**
```http
POST /api/articles/clxxx.../generate
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "clxxx...",
    "title": "รีวิว iPhone 16 Pro: สุดยอดสมาร์ทโฟนแห่งปี 2026",
    "content": "<h2>บทนำ</h2><p>...</p>",
    "excerpt": "มาดูกันว่า iPhone 16 Pro...",
    "status": "READY",
    "generatedAt": "2026-02-04T10:01:00Z"
  }
}
```

### 4.4 Create Schedule

**Request:**
```http
POST /api/schedules
Content-Type: application/json

{
  "name": "Tech Blog Weekly",
  "siteId": "clxxx...",
  "postsPerWeek": 3,
  "daysOfWeek": [1, 3, 5],  // Mon, Wed, Fri
  "timeRangeStart": "10:00",
  "timeRangeEnd": "14:00",
  "tone": "FRIENDLY",
  "length": "MEDIUM",
  "keywords": [
    "รีวิวมือถือ 2026",
    "เปรียบเทียบ iPhone vs Samsung",
    "มือถือราคาถูก 2026"
  ]
}
```

---

## 5. Queue System Architecture

### 5.1 Job Types

```typescript
// types/jobs.ts

interface GenerateArticleJob {
  type: 'GENERATE_ARTICLE';
  articleId: string;
}

interface GenerateImageJob {
  type: 'GENERATE_IMAGE';
  articleId: string;
}

interface PublishArticleJob {
  type: 'PUBLISH_ARTICLE';
  articleId: string;
}

interface ScheduleRunJob {
  type: 'SCHEDULE_RUN';
  scheduleId: string;
}
```

### 5.2 Queue Configuration

```typescript
// lib/queue.ts

import { Queue, Worker } from 'bullmq';

const connection = {
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || '6379'),
};

// Queues
export const articleQueue = new Queue('articles', { connection });
export const imageQueue = new Queue('images', { connection });
export const publishQueue = new Queue('publish', { connection });
export const scheduleQueue = new Queue('schedules', { connection });

// Default job options
const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 5000,
  },
  removeOnComplete: 100,
  removeOnFail: 50,
};
```

### 5.3 Worker Example

```typescript
// workers/article.worker.ts

import { Worker, Job } from 'bullmq';
import { generateArticleContent } from '@/lib/ai/claude';
import { prisma } from '@/lib/prisma';

const worker = new Worker(
  'articles',
  async (job: Job) => {
    const { articleId } = job.data;
    
    // Update status
    await prisma.article.update({
      where: { id: articleId },
      data: { status: 'GENERATING' },
    });
    
    try {
      // Get article
      const article = await prisma.article.findUnique({
        where: { id: articleId },
      });
      
      // Generate content
      const content = await generateArticleContent({
        keyword: article.keyword,
        tone: article.tone,
        length: article.length,
        seoKeywords: article.seoKeywords,
      });
      
      // Update article
      await prisma.article.update({
        where: { id: articleId },
        data: {
          title: content.title,
          content: content.body,
          excerpt: content.excerpt,
          status: 'READY',
          generatedAt: new Date(),
        },
      });
      
      return { success: true };
    } catch (error) {
      await prisma.article.update({
        where: { id: articleId },
        data: {
          status: 'FAILED',
          errorMessage: error.message,
          retryCount: { increment: 1 },
        },
      });
      throw error;
    }
  },
  { connection }
);
```

### 5.4 Scheduler Cron

```typescript
// lib/scheduler.ts

import cron from 'node-cron';
import { prisma } from '@/lib/prisma';
import { scheduleQueue } from '@/lib/queue';

// Run every hour
cron.schedule('0 * * * *', async () => {
  const now = new Date();
  
  // Find schedules that should run
  const schedules = await prisma.schedule.findMany({
    where: {
      isActive: true,
      nextRunAt: { lte: now },
    },
    include: {
      keywords: {
        where: { isUsed: false },
        take: 1,
      },
    },
  });
  
  for (const schedule of schedules) {
    // Check if today is a scheduled day
    const dayOfWeek = now.getDay();
    if (!schedule.daysOfWeek.includes(dayOfWeek)) continue;
    
    // Check if within time range
    const currentTime = `${now.getHours()}:${now.getMinutes()}`;
    if (currentTime < schedule.timeRangeStart || currentTime > schedule.timeRangeEnd) continue;
    
    // Add job to queue
    await scheduleQueue.add('schedule-run', {
      scheduleId: schedule.id,
    });
  }
});
```

---

## 6. Key Library Functions

### 6.1 WordPress Client

```typescript
// lib/wordpress.ts

interface WordPressClient {
  testConnection(): Promise<boolean>;
  createPost(data: CreatePostData): Promise<WPPost>;
  uploadMedia(file: Buffer, filename: string): Promise<WPMedia>;
  getCategories(): Promise<WPCategory[]>;
}

export function createWordPressClient(site: Site): WordPressClient {
  const auth = Buffer.from(
    `${site.username}:${decrypt(site.applicationPassword)}`
  ).toString('base64');
  
  const baseUrl = `${site.url}/wp-json/wp/v2`;
  
  return {
    async testConnection() {
      const res = await fetch(`${baseUrl}/users/me`, {
        headers: { Authorization: `Basic ${auth}` },
      });
      return res.ok;
    },
    
    async createPost(data) {
      const res = await fetch(`${baseUrl}/posts`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: data.title,
          content: data.content,
          excerpt: data.excerpt,
          status: data.status || 'publish',
          featured_media: data.featuredMediaId,
          categories: data.categories,
          tags: data.tags,
        }),
      });
      return res.json();
    },
    
    async uploadMedia(file, filename) {
      const formData = new FormData();
      formData.append('file', new Blob([file]), filename);
      
      const res = await fetch(`${baseUrl}/media`, {
        method: 'POST',
        headers: { Authorization: `Basic ${auth}` },
        body: formData,
      });
      return res.json();
    },
    
    async getCategories() {
      const res = await fetch(`${baseUrl}/categories`, {
        headers: { Authorization: `Basic ${auth}` },
      });
      return res.json();
    },
  };
}
```

### 6.2 AI Content Generator

```typescript
// lib/ai/claude.ts

import Anthropic from '@anthropic-ai/sdk';
import { getActiveApiKey } from '@/lib/api-keys';

interface GenerateContentInput {
  keyword: string;
  tone: ArticleTone;
  length: ArticleLength;
  seoKeywords?: string[];
}

interface GeneratedContent {
  title: string;
  body: string;
  excerpt: string;
}

const WORD_COUNTS = {
  SHORT: 500,
  MEDIUM: 1000,
  LONG: 1500,
};

const TONE_INSTRUCTIONS = {
  FRIENDLY: 'เขียนด้วยน้ำเสียงเป็นกันเอง ใช้ภาษาง่ายๆ เข้าใจง่าย',
  PROFESSIONAL: 'เขียนด้วยน้ำเสียงทางการ เป็นมืออาชีพ',
  INFORMATIVE: 'เขียนให้ความรู้ อ้างอิงข้อมูล เป็นประโยชน์',
  SALES: 'เขียนเพื่อขาย กระตุ้นการตัดสินใจ มี CTA',
};

export async function generateArticleContent(
  input: GenerateContentInput
): Promise<GeneratedContent> {
  const apiKey = await getActiveApiKey('CLAUDE');
  
  const client = new Anthropic({ apiKey: decrypt(apiKey.key) });
  
  const systemPrompt = `คุณเป็นนักเขียนบทความ SEO มืออาชีพ
- ${TONE_INSTRUCTIONS[input.tone]}
- ความยาวประมาณ ${WORD_COUNTS[input.length]} คำ
- ใส่ Keywords: ${input.seoKeywords?.join(', ') || input.keyword}
- เขียนเป็นภาษาไทย
- ใช้ HTML tags: <h2>, <h3>, <p>, <ul>, <li>
- อย่าใส่ <h1> (จะใช้ title แทน)`;

  const userPrompt = `เขียนบทความเรื่อง: "${input.keyword}"

ตอบในรูปแบบ JSON:
{
  "title": "หัวข้อบทความที่น่าสนใจ",
  "body": "<h2>...</h2><p>...</p>...",
  "excerpt": "สรุปสั้นๆ 2-3 ประโยค"
}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });
  
  const text = response.content[0].type === 'text' 
    ? response.content[0].text 
    : '';
  
  // Parse JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Invalid AI response format');
  
  return JSON.parse(jsonMatch[0]);
}
```

### 6.3 Featured Image Generator

```typescript
// lib/image/generator.ts

import sharp from 'sharp';

interface ImageOptions {
  width: number;
  height: number;
  backgroundType: 'SOLID' | 'GRADIENT' | 'PATTERN';
  backgroundValue: string;
  text: string;
  fontFamily?: string;
  textColor?: string;
}

export async function generateFeaturedImage(
  options: ImageOptions
): Promise<Buffer> {
  const {
    width = 1200,
    height = 630,
    backgroundType,
    backgroundValue,
    text,
    textColor = '#FFFFFF',
  } = options;
  
  // Create SVG with text overlay
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        ${backgroundType === 'GRADIENT' ? `
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${parseGradient(backgroundValue).start}"/>
            <stop offset="100%" style="stop-color:${parseGradient(backgroundValue).end}"/>
          </linearGradient>
        ` : ''}
      </defs>
      <rect width="100%" height="100%" fill="${
        backgroundType === 'GRADIENT' ? 'url(#bg)' : backgroundValue
      }"/>
      <text
        x="50%"
        y="50%"
        text-anchor="middle"
        dominant-baseline="middle"
        font-family="Noto Sans Thai, sans-serif"
        font-size="48"
        font-weight="bold"
        fill="${textColor}"
      >
        ${wrapText(text, 30)}
      </text>
    </svg>
  `;
  
  return sharp(Buffer.from(svg))
    .png()
    .toBuffer();
}

function wrapText(text: string, maxChars: number): string {
  // Simple text wrapping for SVG
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  for (const word of words) {
    if ((currentLine + word).length > maxChars) {
      lines.push(`<tspan x="50%" dy="1.2em">${currentLine.trim()}</tspan>`);
      currentLine = word + ' ';
    } else {
      currentLine += word + ' ';
    }
  }
  lines.push(`<tspan x="50%" dy="1.2em">${currentLine.trim()}</tspan>`);
  
  return lines.join('');
}

function parseGradient(value: string): { start: string; end: string } {
  // Parse CSS gradient string
  const colors = value.match(/#[0-9A-Fa-f]{6}/g) || ['#667eea', '#764ba2'];
  return { start: colors[0], end: colors[1] || colors[0] };
}
```

---

## 7. Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:pass@host:5432/db"

# Redis
REDIS_HOST="localhost"
REDIS_PORT="6379"

# NextAuth
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Encryption
ENCRYPTION_KEY="32-byte-hex-key"

# API Keys (Default - can be managed via UI)
CLAUDE_API_KEY="sk-ant-..."
OPENAI_API_KEY="sk-..."

# Storage (Optional)
S3_BUCKET="your-bucket"
S3_REGION="auto"
S3_ACCESS_KEY="..."
S3_SECRET_KEY="..."
S3_ENDPOINT="https://..."
```

---

## 8. Security Considerations

### 8.1 Encryption
- Application Passwords: AES-256-GCM encryption at rest
- API Keys: AES-256-GCM encryption at rest
- Use `@/lib/crypto.ts` for encrypt/decrypt functions

### 8.2 Authentication
- JWT tokens with short expiry (1 hour)
- Refresh token rotation
- Rate limiting on auth endpoints

### 8.3 Authorization
- Role-based access control (RBAC)
- Site-level permissions
- Middleware for route protection

### 8.4 Input Validation
- Zod schemas for all API inputs
- URL validation for WordPress sites
- SQL injection prevention via Prisma

---

## 9. Deployment Checklist

- [ ] Set all environment variables
- [ ] Run database migrations
- [ ] Set up Redis instance
- [ ] Configure cron jobs for scheduler
- [ ] Set up workers (can be same process or separate)
- [ ] Configure HTTPS
- [ ] Set up monitoring (optional: Sentry, LogRocket)
- [ ] Set up backups for database
- [ ] Test WordPress connections
- [ ] Test API key functionality
