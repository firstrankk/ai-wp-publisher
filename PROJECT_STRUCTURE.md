# Project Structure
## AI WordPress Publisher

---

## Directory Structure

```
ai-wp-publisher/
├── .cursor/
│   └── rules                    # Cursor AI rules
├── .env.example                 # Environment variables template
├── .env.local                   # Local environment (gitignored)
├── .gitignore
├── README.md
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
├── prisma/
│   ├── schema.prisma           # Database schema
│   ├── migrations/             # Database migrations
│   └── seed.ts                 # Seed data
│
├── docs/                       # Documentation
│   ├── PRD.md
│   └── TECHNICAL_SPEC.md
│
├── public/
│   ├── favicon.ico
│   └── images/
│
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Landing page (redirect to dashboard)
│   │   ├── globals.css
│   │   │
│   │   ├── (auth)/             # Auth pages (no sidebar)
│   │   │   ├── layout.tsx
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── register/
│   │   │   │   └── page.tsx
│   │   │   └── forgot-password/
│   │   │       └── page.tsx
│   │   │
│   │   ├── (dashboard)/        # Dashboard pages (with sidebar)
│   │   │   ├── layout.tsx      # Dashboard layout with sidebar
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx    # Overview dashboard
│   │   │   │
│   │   │   ├── sites/
│   │   │   │   ├── page.tsx    # Site list
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx # Add new site
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx # Site detail
│   │   │   │       └── edit/
│   │   │   │           └── page.tsx
│   │   │   │
│   │   │   ├── site-groups/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── articles/
│   │   │   │   ├── page.tsx    # Article list
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx # Create article
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx # Article detail
│   │   │   │       └── edit/
│   │   │   │           └── page.tsx
│   │   │   │
│   │   │   ├── schedules/
│   │   │   │   ├── page.tsx    # Schedule list
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx
│   │   │   │       └── keywords/
│   │   │   │           └── page.tsx
│   │   │   │
│   │   │   ├── users/          # Admin only
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── api-keys/       # Admin only
│   │   │   │   └── page.tsx
│   │   │   │
│   │   │   ├── reports/
│   │   │   │   └── page.tsx
│   │   │   │
│   │   │   └── settings/
│   │   │       ├── page.tsx    # System settings
│   │   │       └── profile/
│   │   │           └── page.tsx
│   │   │
│   │   └── api/                # API Routes
│   │       ├── auth/
│   │       │   ├── [...nextauth]/
│   │       │   │   └── route.ts
│   │       │   ├── register/
│   │       │   │   └── route.ts
│   │       │   └── forgot-password/
│   │       │       └── route.ts
│   │       │
│   │       ├── users/
│   │       │   ├── route.ts    # GET (list), POST (create)
│   │       │   └── [id]/
│   │       │       ├── route.ts # GET, PUT, DELETE
│   │       │       ├── role/
│   │       │       │   └── route.ts
│   │       │       └── sites/
│   │       │           └── route.ts
│   │       │
│   │       ├── sites/
│   │       │   ├── route.ts
│   │       │   ├── import/
│   │       │   │   └── route.ts
│   │       │   ├── export/
│   │       │   │   └── route.ts
│   │       │   └── [id]/
│   │       │       ├── route.ts
│   │       │       └── test/
│   │       │           └── route.ts
│   │       │
│   │       ├── site-groups/
│   │       │   ├── route.ts
│   │       │   └── [id]/
│   │       │       ├── route.ts
│   │       │       └── sites/
│   │       │           └── route.ts
│   │       │
│   │       ├── articles/
│   │       │   ├── route.ts
│   │       │   ├── bulk/
│   │       │   │   └── route.ts
│   │       │   └── [id]/
│   │       │       ├── route.ts
│   │       │       ├── generate/
│   │       │       │   └── route.ts
│   │       │       ├── generate-image/
│   │       │       │   └── route.ts
│   │       │       ├── publish/
│   │       │       │   └── route.ts
│   │       │       └── retry/
│   │       │           └── route.ts
│   │       │
│   │       ├── schedules/
│   │       │   ├── route.ts
│   │       │   └── [id]/
│   │       │       ├── route.ts
│   │       │       ├── pause/
│   │       │       │   └── route.ts
│   │       │       ├── resume/
│   │       │       │   └── route.ts
│   │       │       ├── run/
│   │       │       │   └── route.ts
│   │       │       ├── history/
│   │       │       │   └── route.ts
│   │       │       └── keywords/
│   │       │           ├── route.ts
│   │       │           ├── import/
│   │       │           │   └── route.ts
│   │       │           └── [kid]/
│   │       │               └── route.ts
│   │       │
│   │       ├── api-keys/
│   │       │   ├── route.ts
│   │       │   ├── usage/
│   │       │   │   └── route.ts
│   │       │   └── [id]/
│   │       │       ├── route.ts
│   │       │       └── test/
│   │       │           └── route.ts
│   │       │
│   │       ├── dashboard/
│   │       │   ├── stats/
│   │       │   │   └── route.ts
│   │       │   ├── recent/
│   │       │   │   └── route.ts
│   │       │   ├── queue/
│   │       │   │   └── route.ts
│   │       │   └── errors/
│   │       │       └── route.ts
│   │       │
│   │       ├── reports/
│   │       │   ├── posts/
│   │       │   │   └── route.ts
│   │       │   ├── sites/
│   │       │   │   └── route.ts
│   │       │   ├── errors/
│   │       │   │   └── route.ts
│   │       │   ├── api-usage/
│   │       │   │   └── route.ts
│   │       │   └── export/
│   │       │       └── route.ts
│   │       │
│   │       └── settings/
│   │           ├── route.ts
│   │           ├── profile/
│   │           │   └── route.ts
│   │           └── password/
│   │               └── route.ts
│   │
│   ├── components/
│   │   ├── ui/                 # Shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── table.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── card.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── toast.tsx
│   │   │   └── ...
│   │   │
│   │   ├── layout/
│   │   │   ├── sidebar.tsx
│   │   │   ├── header.tsx
│   │   │   ├── nav-item.tsx
│   │   │   └── user-menu.tsx
│   │   │
│   │   ├── auth/
│   │   │   ├── login-form.tsx
│   │   │   ├── register-form.tsx
│   │   │   └── forgot-password-form.tsx
│   │   │
│   │   ├── sites/
│   │   │   ├── site-list.tsx
│   │   │   ├── site-card.tsx
│   │   │   ├── site-form.tsx
│   │   │   ├── site-status-badge.tsx
│   │   │   ├── connection-test-button.tsx
│   │   │   └── import-csv-dialog.tsx
│   │   │
│   │   ├── articles/
│   │   │   ├── article-list.tsx
│   │   │   ├── article-card.tsx
│   │   │   ├── article-form.tsx
│   │   │   ├── article-preview.tsx
│   │   │   ├── article-status-badge.tsx
│   │   │   ├── content-editor.tsx
│   │   │   ├── generate-button.tsx
│   │   │   └── publish-button.tsx
│   │   │
│   │   ├── schedules/
│   │   │   ├── schedule-list.tsx
│   │   │   ├── schedule-card.tsx
│   │   │   ├── schedule-form.tsx
│   │   │   ├── keyword-manager.tsx
│   │   │   ├── day-picker.tsx
│   │   │   └── time-range-picker.tsx
│   │   │
│   │   ├── images/
│   │   │   ├── image-generator.tsx
│   │   │   ├── background-picker.tsx
│   │   │   ├── color-picker.tsx
│   │   │   ├── font-picker.tsx
│   │   │   └── image-preview.tsx
│   │   │
│   │   ├── users/
│   │   │   ├── user-list.tsx
│   │   │   ├── user-form.tsx
│   │   │   ├── role-select.tsx
│   │   │   └── site-assignment.tsx
│   │   │
│   │   ├── api-keys/
│   │   │   ├── api-key-list.tsx
│   │   │   ├── api-key-form.tsx
│   │   │   └── usage-chart.tsx
│   │   │
│   │   ├── dashboard/
│   │   │   ├── stats-cards.tsx
│   │   │   ├── recent-activity.tsx
│   │   │   ├── queue-status.tsx
│   │   │   └── error-list.tsx
│   │   │
│   │   └── shared/
│   │       ├── data-table.tsx
│   │       ├── pagination.tsx
│   │       ├── search-input.tsx
│   │       ├── filter-dropdown.tsx
│   │       ├── confirm-dialog.tsx
│   │       ├── loading-spinner.tsx
│   │       ├── empty-state.tsx
│   │       └── error-boundary.tsx
│   │
│   ├── lib/
│   │   ├── prisma.ts           # Prisma client
│   │   ├── auth.ts             # NextAuth config
│   │   ├── crypto.ts           # Encryption utilities
│   │   ├── utils.ts            # General utilities
│   │   ├── validations.ts      # Zod schemas
│   │   │
│   │   ├── wordpress/
│   │   │   ├── client.ts       # WordPress API client
│   │   │   ├── types.ts        # WordPress types
│   │   │   └── utils.ts
│   │   │
│   │   ├── ai/
│   │   │   ├── claude.ts       # Claude API
│   │   │   ├── openai.ts       # OpenAI API (optional)
│   │   │   ├── prompts.ts      # Prompt templates
│   │   │   └── types.ts
│   │   │
│   │   ├── image/
│   │   │   ├── generator.ts    # Image generation
│   │   │   ├── templates.ts    # Image templates
│   │   │   └── fonts.ts        # Font configurations
│   │   │
│   │   └── queue/
│   │       ├── index.ts        # Queue setup
│   │       ├── workers/
│   │       │   ├── article.worker.ts
│   │       │   ├── image.worker.ts
│   │       │   ├── publish.worker.ts
│   │       │   └── schedule.worker.ts
│   │       └── scheduler.ts    # Cron job setup
│   │
│   ├── hooks/
│   │   ├── use-sites.ts
│   │   ├── use-articles.ts
│   │   ├── use-schedules.ts
│   │   ├── use-users.ts
│   │   ├── use-api-keys.ts
│   │   ├── use-dashboard.ts
│   │   └── use-auth.ts
│   │
│   ├── stores/
│   │   ├── auth-store.ts
│   │   ├── site-store.ts
│   │   └── ui-store.ts
│   │
│   ├── types/
│   │   ├── index.ts
│   │   ├── api.ts
│   │   ├── site.ts
│   │   ├── article.ts
│   │   ├── schedule.ts
│   │   ├── user.ts
│   │   └── api-key.ts
│   │
│   └── middleware.ts           # Auth middleware
│
└── workers/                    # Standalone workers (if separate process)
    └── index.ts
```

---

## Key Files Description

### Configuration Files

| File | Purpose |
|------|---------|
| `next.config.js` | Next.js configuration |
| `tailwind.config.ts` | Tailwind CSS configuration |
| `tsconfig.json` | TypeScript configuration |
| `prisma/schema.prisma` | Database schema |
| `.env.example` | Environment variables template |

### Core Library Files

| File | Purpose |
|------|---------|
| `src/lib/prisma.ts` | Prisma client singleton |
| `src/lib/auth.ts` | NextAuth.js configuration |
| `src/lib/crypto.ts` | AES encryption/decryption |
| `src/lib/validations.ts` | Zod validation schemas |
| `src/lib/wordpress/client.ts` | WordPress REST API client |
| `src/lib/ai/claude.ts` | Claude API integration |
| `src/lib/image/generator.ts` | Featured image generation |
| `src/lib/queue/index.ts` | BullMQ queue setup |

### Important Components

| Component | Purpose |
|-----------|---------|
| `layout/sidebar.tsx` | Main navigation sidebar |
| `sites/site-form.tsx` | Add/Edit site form |
| `articles/content-editor.tsx` | Article content editor |
| `schedules/keyword-manager.tsx` | Keyword pool management |
| `images/image-generator.tsx` | Featured image creator |
| `shared/data-table.tsx` | Reusable data table |

---

## Component Dependencies

```
Dashboard
├── layout/sidebar
├── layout/header
├── dashboard/stats-cards
├── dashboard/recent-activity
├── dashboard/queue-status
└── dashboard/error-list

Sites Page
├── sites/site-list
│   ├── sites/site-card
│   │   └── sites/site-status-badge
│   └── shared/data-table
├── sites/site-form
│   └── sites/connection-test-button
└── sites/import-csv-dialog

Articles Page
├── articles/article-list
│   ├── articles/article-card
│   │   └── articles/article-status-badge
│   └── shared/data-table
├── articles/article-form
│   ├── articles/content-editor
│   └── images/image-generator
│       ├── images/background-picker
│       ├── images/color-picker
│       └── images/image-preview
└── articles/publish-button

Schedules Page
├── schedules/schedule-list
│   └── schedules/schedule-card
├── schedules/schedule-form
│   ├── schedules/day-picker
│   └── schedules/time-range-picker
└── schedules/keyword-manager
```

---

## API Route Patterns

### Standard CRUD Pattern

```typescript
// src/app/api/sites/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { siteCreateSchema } from '@/lib/validations';

// GET /api/sites - List all sites
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const search = searchParams.get('search') || '';
  
  const where = {
    ...(session.user.role !== 'ADMIN' && {
      users: { some: { userId: session.user.id } }
    }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { url: { contains: search, mode: 'insensitive' } },
      ]
    }),
  };
  
  const [sites, total] = await Promise.all([
    prisma.site.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.site.count({ where }),
  ]);
  
  return NextResponse.json({
    data: sites,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

// POST /api/sites - Create new site
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  const body = await request.json();
  const validated = siteCreateSchema.parse(body);
  
  const site = await prisma.site.create({
    data: {
      ...validated,
      applicationPassword: encrypt(validated.applicationPassword),
    },
  });
  
  return NextResponse.json({ data: site }, { status: 201 });
}
```

---

## State Management Pattern

```typescript
// src/hooks/use-sites.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Site, SiteCreateInput } from '@/types';

export function useSites(params?: { page?: number; search?: string }) {
  return useQuery({
    queryKey: ['sites', params],
    queryFn: () => api.get('/sites', { params }),
  });
}

export function useSite(id: string) {
  return useQuery({
    queryKey: ['sites', id],
    queryFn: () => api.get(`/sites/${id}`),
    enabled: !!id,
  });
}

export function useCreateSite() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: SiteCreateInput) => api.post('/sites', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
    },
  });
}

export function useUpdateSite() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Site> }) =>
      api.put(`/sites/${id}`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      queryClient.invalidateQueries({ queryKey: ['sites', id] });
    },
  });
}

export function useDeleteSite() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => api.delete(`/sites/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
    },
  });
}

export function useTestConnection() {
  return useMutation({
    mutationFn: (id: string) => api.post(`/sites/${id}/test`),
  });
}
```
