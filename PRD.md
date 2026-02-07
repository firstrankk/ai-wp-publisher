# Product Requirements Document (PRD)
## AI WordPress Publisher

**Version:** 1.0  
**Last Updated:** February 2026  
**Status:** Draft

---

## 1. Overview

### 1.1 Product Summary
ระบบสร้างและเผยแพร่บทความอัตโนมัติไปยัง WordPress โดยใช้ AI พร้อมสร้างภาพปก รองรับการทำงานแบบ Bulk และ Scheduling

### 1.2 Problem Statement
- มีเว็บไซต์ WordPress จำนวน 500+ เว็บ
- ต้องอัพบทความ 3 บทความ/เว็บ/สัปดาห์ (รวม ~1,500 บทความ/สัปดาห์)
- ปัจจุบันพนักงานต้องสร้างบทความด้วย AI แล้วนำไปโพสต์ทีละเว็บ
- เสียเวลาและ Error-prone

### 1.3 Solution
ระบบ Centralized ที่:
- จัดการเว็บไซต์ทั้งหมดในที่เดียว
- สร้างบทความด้วย AI อัตโนมัติ
- สร้างภาพปกอัตโนมัติ
- ตั้ง Schedule ให้โพสต์อัตโนมัติ
- จัดการ User และสิทธิ์การเข้าถึง

### 1.4 Target Users
- **Admin:** เจ้าของระบบ จัดการทุกอย่าง
- **Editor:** พนักงานที่ดูแลเว็บที่ถูก assign
- **Viewer:** ดูรายงานได้อย่างเดียว

---

## 2. Features Specification

### 2.1 User Management

#### 2.1.1 Authentication
| Feature | Description | Priority |
|---------|-------------|----------|
| Register | สมัครสมาชิกด้วย Email + Password | P0 |
| Login | เข้าสู่ระบบ | P0 |
| Logout | ออกจากระบบ | P0 |
| Forgot Password | รีเซ็ตรหัสผ่าน | P1 |
| Two-Factor Auth | 2FA ด้วย TOTP | P2 |

#### 2.1.2 User CRUD (Admin Only)
| Feature | Description | Priority |
|---------|-------------|----------|
| List Users | ดูรายชื่อ User ทั้งหมด | P0 |
| Create User | เพิ่ม User ใหม่ | P0 |
| Edit User | แก้ไขข้อมูล User | P0 |
| Delete User | ลบ User | P0 |
| Assign Role | กำหนด Role (Admin/Editor/Viewer) | P0 |
| Assign Sites | กำหนดว่า User ดูแลเว็บไหน | P0 |

#### 2.1.3 Roles & Permissions
```
Admin:
├── User Management: Full Access
├── Site Management: Full Access
├── Article Management: Full Access
├── Schedule Management: Full Access
├── API Key Management: Full Access
└── Settings: Full Access

Editor:
├── User Management: No Access
├── Site Management: View/Edit Assigned Sites Only
├── Article Management: CRUD on Assigned Sites
├── Schedule Management: CRUD on Assigned Sites
├── API Key Management: No Access
└── Settings: View Own Profile

Viewer:
├── User Management: No Access
├── Site Management: View Assigned Sites Only
├── Article Management: View Only
├── Schedule Management: View Only
├── API Key Management: No Access
└── Settings: View Own Profile
```

---

### 2.2 Site Management

#### 2.2.1 Site CRUD
| Feature | Description | Priority |
|---------|-------------|----------|
| List Sites | แสดงรายการเว็บทั้งหมด (Filter, Search, Pagination) | P0 |
| Add Site | เพิ่มเว็บใหม่ (URL, Username, App Password) | P0 |
| Edit Site | แก้ไขข้อมูลเว็บ | P0 |
| Delete Site | ลบเว็บ (Soft Delete) | P0 |
| Test Connection | ทดสอบการเชื่อมต่อ WordPress API | P0 |
| Bulk Import | Import หลายเว็บจาก CSV | P1 |
| Bulk Export | Export รายการเว็บเป็น CSV | P2 |

#### 2.2.2 Site Groups
| Feature | Description | Priority |
|---------|-------------|----------|
| Create Group | สร้างกลุ่มเว็บ (เช่น "ท่องเที่ยว", "สุขภาพ") | P1 |
| Assign to Group | เพิ่มเว็บเข้ากลุ่ม | P1 |
| Remove from Group | ลบเว็บออกจากกลุ่ม | P1 |
| Filter by Group | กรองดูเว็บตามกลุ่ม | P1 |

#### 2.2.3 Site Settings
| Feature | Description | Priority |
|---------|-------------|----------|
| Default Category | ตั้ง Category เริ่มต้นของเว็บ | P1 |
| Default Author | ตั้ง Author เริ่มต้น | P1 |
| Default Post Status | Draft / Publish / Pending | P1 |
| Custom Fields | เก็บข้อมูลเพิ่มเติม | P2 |

#### 2.2.4 Site Status
```
Active    - เว็บพร้อมใช้งาน
Inactive  - ปิดใช้งานชั่วคราว
Error     - เชื่อมต่อไม่ได้
Pending   - รอตรวจสอบ
```

---

### 2.3 Article Management

#### 2.3.1 Create Article (Manual)
| Feature | Description | Priority |
|---------|-------------|----------|
| Input Topic/Keyword | ใส่หัวข้อหรือ Keyword | P0 |
| Select Target Site | เลือกเว็บปลายทาง | P0 |
| Select Tone | เป็นกันเอง / ทางการ / ให้ความรู้ / ขายของ | P0 |
| Select Length | สั้น (500) / กลาง (1000) / ยาว (1500+) | P0 |
| SEO Keywords | ระบุ Keywords สำหรับ SEO | P1 |
| Generate Article | กดปุ่มให้ AI สร้างบทความ | P0 |
| Preview | ดูตัวอย่างบทความ | P0 |
| Edit Content | แก้ไขเนื้อหาก่อนโพสต์ | P0 |
| Regenerate | สร้างใหม่ถ้าไม่พอใจ | P1 |

#### 2.3.2 Featured Image Generation
| Feature | Description | Priority |
|---------|-------------|----------|
| Auto Generate | สร้างภาพปกอัตโนมัติ | P0 |
| Background Type | Solid Color / Gradient / Pattern | P0 |
| Text Overlay | ใส่หัวข้อลงบนภาพ | P0 |
| Font Selection | เลือก Font | P1 |
| Color Selection | เลือกสีพื้นหลัง/ตัวอักษร | P1 |
| Image Size | 16:9 / 4:3 / 1:1 | P1 |
| Save as Template | บันทึกเป็น Template | P2 |

#### 2.3.3 Publish Options
| Feature | Description | Priority |
|---------|-------------|----------|
| Publish Now | โพสต์ทันที | P0 |
| Schedule | ตั้งเวลาโพสต์ | P1 |
| Save as Draft | บันทึกเป็น Draft | P0 |
| Select Category | เลือก Category บน WordPress | P1 |
| Set Tags | ใส่ Tags | P1 |

#### 2.3.4 Bulk Article Creation
| Feature | Description | Priority |
|---------|-------------|----------|
| Import Keywords | Upload CSV รายการ Keywords | P1 |
| Bulk Generate | สร้างหลายบทความพร้อมกัน | P1 |
| Progress Tracking | ดูความคืบหน้า | P1 |
| Batch Publish | โพสต์ทั้งหมดที่พร้อม | P1 |

#### 2.3.5 Article Status Flow
```
Draft → Generating → Ready → Publishing → Published
                 ↓                    ↓
              Failed              Failed
```

#### 2.3.6 Article History
| Feature | Description | Priority |
|---------|-------------|----------|
| List Articles | ดูบทความทั้งหมด (Filter, Search) | P0 |
| View Detail | ดูรายละเอียดบทความ | P0 |
| View on WordPress | Link ไปดูบนเว็บจริง | P0 |
| Retry Failed | โพสต์ใหม่ถ้า Error | P1 |
| Delete | ลบบทความ (จากระบบ + WordPress) | P1 |

---

### 2.4 Schedule Management (Loop System)

#### 2.4.1 Create Schedule
| Feature | Description | Priority |
|---------|-------------|----------|
| Select Site(s) | เลือกเว็บ (เดี่ยวหรือกลุ่ม) | P0 |
| Set Frequency | กี่บทความต่อสัปดาห์ | P0 |
| Set Days | วันที่โพสต์ (จ, อ, พ, ...) | P0 |
| Set Time Range | ช่วงเวลา (เช่น 09:00-17:00) | P0 |
| Add Keywords | รายการ Keywords ให้สุ่ม | P0 |
| Set Tone | Tone ของบทความ | P0 |
| Set Length | ความยาวบทความ | P0 |
| Enable/Disable | เปิด/ปิด Schedule | P0 |

#### 2.4.2 Keyword Pool
| Feature | Description | Priority |
|---------|-------------|----------|
| Add Keywords | เพิ่ม Keywords ทีละตัวหรือ Bulk | P0 |
| Import Keywords | Import จาก CSV | P1 |
| Remove Keywords | ลบ Keywords | P0 |
| Mark as Used | ทำเครื่องหมาย Keyword ที่ใช้แล้ว | P1 |
| Keyword Rotation | สุ่มเลือก Keyword ที่ยังไม่ใช้ | P0 |

#### 2.4.3 Schedule Example
```yaml
Schedule: "Site A Weekly Posts"
Site: example.com
Keywords:
  - รีวิวมือถือ 2024
  - เปรียบเทียบ iPhone vs Samsung
  - มือถือราคาถูก
  - มือถือกล้องสวย
Frequency: 3 posts/week
Days: [Monday, Wednesday, Friday]
Time Range: 10:00 - 14:00
Tone: Friendly
Length: Medium (800-1200 words)
Status: Active
```

#### 2.4.4 Schedule Operations
| Feature | Description | Priority |
|---------|-------------|----------|
| List Schedules | ดู Schedule ทั้งหมด | P0 |
| Edit Schedule | แก้ไข Schedule | P0 |
| Pause Schedule | หยุดชั่วคราว | P0 |
| Resume Schedule | เปิดใช้งานต่อ | P0 |
| Delete Schedule | ลบ Schedule | P0 |
| Run Now | รัน Schedule ทันที (Manual Trigger) | P1 |
| View History | ดูประวัติการรัน | P1 |

---

### 2.5 API Key Management

#### 2.5.1 API Key CRUD
| Feature | Description | Priority |
|---------|-------------|----------|
| Add API Key | เพิ่ม Key (Claude, OpenAI, etc.) | P0 |
| Edit API Key | แก้ไข Key | P0 |
| Delete API Key | ลบ Key | P0 |
| Test API Key | ทดสอบว่า Key ใช้ได้ | P0 |

#### 2.5.2 API Key Types
```
- Claude API (สร้างบทความ)
- OpenAI API (สร้างบทความ - Alternative)
- DALL-E API (สร้างภาพ - Optional)
- Replicate API (สร้างภาพ - Alternative)
```

#### 2.5.3 Key Rotation & Load Balancing
| Feature | Description | Priority |
|---------|-------------|----------|
| Multiple Keys | รองรับหลาย Keys ต่อ Provider | P1 |
| Auto Rotate | สลับ Key เมื่อถึง Rate Limit | P1 |
| Usage Tracking | ติดตามการใช้งาน | P1 |
| Cost Estimation | ประมาณค่าใช้จ่าย | P2 |

---

### 2.6 Dashboard & Reports

#### 2.6.1 Dashboard Overview
| Widget | Description | Priority |
|--------|-------------|----------|
| Total Sites | จำนวนเว็บทั้งหมด | P0 |
| Active Schedules | จำนวน Schedule ที่ Active | P0 |
| Today's Posts | บทความที่โพสต์วันนี้ | P0 |
| This Week's Posts | บทความสัปดาห์นี้ | P0 |
| Queue Status | จำนวนงานในคิว | P0 |
| Error Count | จำนวน Error | P0 |
| Recent Activity | กิจกรรมล่าสุด | P1 |

#### 2.6.2 Reports
| Report | Description | Priority |
|--------|-------------|----------|
| Post Summary | สรุปการโพสต์รายวัน/สัปดาห์/เดือน | P1 |
| Site Performance | สถิติแต่ละเว็บ | P1 |
| Error Report | รายงาน Error | P1 |
| API Usage | การใช้งาน API | P1 |
| Export to CSV | Export รายงาน | P2 |

---

### 2.7 Settings

#### 2.7.1 System Settings (Admin Only)
| Setting | Description | Priority |
|---------|-------------|----------|
| Default Tone | Tone เริ่มต้น | P1 |
| Default Length | ความยาวเริ่มต้น | P1 |
| Default Image Style | Style ภาพปกเริ่มต้น | P1 |
| Notification Email | Email รับแจ้งเตือน | P1 |
| Error Alert | แจ้งเตือนเมื่อ Error | P1 |

#### 2.7.2 User Profile
| Setting | Description | Priority |
|---------|-------------|----------|
| Edit Name | แก้ไขชื่อ | P0 |
| Change Password | เปลี่ยนรหัสผ่าน | P0 |
| Email Notifications | เปิด/ปิดการแจ้งเตือน | P1 |

---

## 3. Non-Functional Requirements

### 3.1 Performance
- รองรับ 500+ เว็บไซต์
- สร้างบทความ 100+ บทความ/วัน
- Response Time < 3 วินาที สำหรับ UI
- Queue Processing ไม่เกิน 5 นาที/บทความ

### 3.2 Scalability
- Horizontal scaling สำหรับ Workers
- Queue-based architecture
- Database indexing ที่เหมาะสม

### 3.3 Security
- Password Hashing (bcrypt)
- API Key Encryption at rest
- HTTPS only
- Rate Limiting
- Input Validation
- CSRF Protection
- XSS Prevention

### 3.4 Reliability
- Auto-retry สำหรับ Failed Jobs (3 ครั้ง)
- Error Logging
- Health Check Endpoints
- Graceful Shutdown

### 3.5 Availability
- 99% Uptime
- Scheduled Maintenance Window
- Database Backup Daily

---

## 4. Technical Constraints

### 4.1 WordPress Requirements
- WordPress REST API enabled
- Application Password enabled
- PHP 7.4+
- HTTPS

### 4.2 API Limits
- Claude API: ~100K tokens/minute
- WordPress REST API: Varies by host
- Image Generation: ~50 images/minute

### 4.3 Browser Support
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

---

## 5. Future Considerations (Out of Scope for V1)

- WordPress Plugin for two-way sync
- Analytics integration (Google Analytics)
- A/B Testing for titles
- Multi-language support
- AI Image generation (ไม่ใช่แค่ text overlay)
- Social Media auto-posting
- SEO Analysis & Scoring
- Plagiarism Check
- Content Spinning
- Team Collaboration (Comments, Approval Workflow)

---

## 6. Success Metrics

| Metric | Target |
|--------|--------|
| Time saved per article | 80% reduction |
| Articles published per day | 200+ |
| Error rate | < 5% |
| User adoption | 100% of team |
| System uptime | 99% |

---

## 7. Timeline (Suggested)

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| Phase 1: MVP | 4 weeks | User Auth, Site CRUD, Manual Article Creation |
| Phase 2: Automation | 3 weeks | Schedule System, Queue, Auto-posting |
| Phase 3: Enhancement | 2 weeks | Dashboard, Reports, Bulk Operations |
| Phase 4: Polish | 1 week | Bug fixes, Performance optimization |

**Total: 10 weeks**
