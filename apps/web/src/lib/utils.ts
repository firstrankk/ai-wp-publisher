import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('th-TH').format(num);
}

export const STATUS_COLORS = {
  DRAFT: 'bg-gray-100 text-gray-800',
  GENERATING: 'bg-amber-100 text-amber-800',
  READY: 'bg-green-100 text-green-800',
  PUBLISHING: 'bg-yellow-100 text-yellow-800',
  PUBLISHED: 'bg-emerald-100 text-emerald-800',
  FAILED: 'bg-red-100 text-red-800',
  ACTIVE: 'bg-green-100 text-green-800',
  INACTIVE: 'bg-gray-100 text-gray-800',
  ERROR: 'bg-red-100 text-red-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
};

export const STATUS_LABELS = {
  DRAFT: 'แบบร่าง',
  GENERATING: 'กำลังสร้าง',
  READY: 'พร้อมโพสต์',
  PUBLISHING: 'กำลังโพสต์',
  PUBLISHED: 'โพสต์แล้ว',
  SCHEDULED: 'ตั้งเวลา',
  FAILED: 'ล้มเหลว',
  ACTIVE: 'ใช้งาน',
  INACTIVE: 'ปิดใช้งาน',
  ERROR: 'มีปัญหา',
  PENDING: 'รอตรวจสอบ',
};

export const TONE_LABELS = {
  FRIENDLY: 'เป็นกันเอง',
  FORMAL: 'ทางการ',
  EDUCATIONAL: 'ให้ความรู้',
  SALES: 'ขายของ',
  PROFESSIONAL: 'มืออาชีพ',
  HUMOROUS: 'ตลกขำขัน',
  INSPIRATIONAL: 'สร้างแรงบันดาลใจ',
  STORYTELLING: 'เล่าเรื่อง',
  NEWS: 'ข่าว/รายงาน',
  REVIEW: 'รีวิว',
};

export const LENGTH_LABELS = {
  SHORT: 'สั้น (500 คำ)',
  MEDIUM: 'กลาง (1,000 คำ)',
  LONG: 'ยาว (1,500+ คำ)',
};

export const DAY_LABELS = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

export const ROLE_LABELS = {
  ADMIN: 'Admin',
  EDITOR: 'Editor',
  VIEWER: 'Viewer',
};
