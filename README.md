# AI WordPress Publisher

ระบบสร้างและเผยแพร่บทความอัตโนมัติไปยัง WordPress โดยใช้ AI

## 📋 เอกสารประกอบ

| ไฟล์ | รายละเอียด |
|------|------------|
| `PRD.md` | Product Requirements - ความต้องการและฟีเจอร์ทั้งหมด |
| `TECHNICAL_SPEC.md` | Technical Specification - Database Schema, API, Code Examples |
| `PROJECT_STRUCTURE.md` | โครงสร้างโปรเจค |
| `.cursorrules` | Rules สำหรับ Cursor AI |

---

## 🚀 Quick Start

### 1. สร้าง Project

```bash
npx create-next-app@latest ai-wp-publisher --typescript --tailwind --eslint --app --src-dir
cd ai-wp-publisher
```

### 2. ติดตั้ง Dependencies

```bash
# Core
npm install @prisma/client @tanstack/react-query zustand
npm install next-auth @auth/prisma-adapter
npm install zod react-hook-form @hookform/resolvers

# UI
npx shadcn@latest init
npx shadcn@latest add button input select table card dialog badge toast tabs form

# Queue
npm install bullmq ioredis

# AI & Image
npm install @anthropic-ai/sdk
npm install sharp

# Dev
npm install -D prisma
```

### 3. Setup Prisma

```bash
npx prisma init
```

Copy schema จาก `TECHNICAL_SPEC.md` ไปยัง `prisma/schema.prisma`

```bash
npx prisma migrate dev --name init
```

### 4. Environment Variables

สร้างไฟล์ `.env.local`:

```env
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/ai_wp_publisher"

# Redis
REDIS_HOST="localhost"
REDIS_PORT="6379"

# Auth
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Encryption (generate with: openssl rand -hex 32)
ENCRYPTION_KEY="your-32-byte-hex-key"

# Claude API
CLAUDE_API_KEY="sk-ant-..."
```

### 5. Copy Cursor Rules

```bash
mkdir -p .cursor
cp .cursorrules .cursor/rules
```

### 6. Start Development

```bash
npm run dev
```

---

## 📁 Recommended Development Order

### Phase 1: Foundation (Week 1-2)
1. ✅ Project setup
2. ⬜ Prisma schema & migrations
3. ⬜ Authentication (NextAuth)
4. ⬜ Basic layout (Sidebar, Header)
5. ⬜ User CRUD (Admin)

### Phase 2: Core Features (Week 2-3)
6. ⬜ Site Management (CRUD, Test Connection)
7. ⬜ Article Creation (Manual)
8. ⬜ AI Content Generation
9. ⬜ Featured Image Generation
10. ⬜ Publish to WordPress

### Phase 3: Automation (Week 3-4)
11. ⬜ Queue System (BullMQ)
12. ⬜ Schedule Management
13. ⬜ Keyword Pool
14. ⬜ Cron Scheduler

### Phase 4: Polish (Week 4-5)
15. ⬜ Dashboard
16. ⬜ Reports
17. ⬜ API Key Management
18. ⬜ Error Handling & Retry
19. ⬜ Testing & Bug Fixes

---

## 🛠 Development Tips

### Using with Cursor

1. เปิด Cursor ใน project folder
2. Cursor จะอ่าน `.cursor/rules` อัตโนมัติ
3. ใช้ Composer (Ctrl+I) เพื่อ generate code
4. Reference ไฟล์เอกสาร: `@PRD.md`, `@TECHNICAL_SPEC.md`

### Example Prompts for Cursor

```
สร้าง API route สำหรับ CRUD sites ตาม @TECHNICAL_SPEC.md
```

```
สร้าง component SiteForm สำหรับเพิ่ม/แก้ไข WordPress site
```

```
สร้าง hook useSites สำหรับจัดการ state ของ sites
```

```
สร้าง function generateArticleContent ตาม spec ใน @TECHNICAL_SPEC.md
```

---

## 📚 References

- [Next.js 14 Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Shadcn/ui](https://ui.shadcn.com/)
- [BullMQ](https://docs.bullmq.io/)
- [Claude API](https://docs.anthropic.com/)
- [WordPress REST API](https://developer.wordpress.org/rest-api/)

---

## 💡 Notes

- ใช้ `.cursorrules` เพื่อให้ Cursor AI เข้าใจ context ของ project
- อ่าน `PRD.md` เพื่อดู feature ทั้งหมด
- อ่าน `TECHNICAL_SPEC.md` เพื่อดู code examples และ database schema
- อ่าน `PROJECT_STRUCTURE.md` เพื่อดูโครงสร้างไฟล์

Good luck with your development! 🚀
