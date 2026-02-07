// Validation helpers
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Format helpers
export const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('th-TH').format(num);
};

// Slug helpers
export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// Word count
export const getWordCount = (text: string): number => {
  return text.trim().split(/\s+/).filter(Boolean).length;
};

// Length targets
export const getLengthTarget = (length: 'SHORT' | 'MEDIUM' | 'LONG'): { min: number; max: number } => {
  switch (length) {
    case 'SHORT':
      return { min: 400, max: 600 };
    case 'MEDIUM':
      return { min: 800, max: 1200 };
    case 'LONG':
      return { min: 1400, max: 2000 };
  }
};

// Tone labels
export const getToneLabel = (tone: 'FRIENDLY' | 'FORMAL' | 'EDUCATIONAL' | 'SALES'): string => {
  switch (tone) {
    case 'FRIENDLY':
      return 'เป็นกันเอง';
    case 'FORMAL':
      return 'ทางการ';
    case 'EDUCATIONAL':
      return 'ให้ความรู้';
    case 'SALES':
      return 'ขายของ';
  }
};

// Status labels
export const getArticleStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    DRAFT: 'แบบร่าง',
    GENERATING: 'กำลังสร้าง',
    READY: 'พร้อมโพสต์',
    PUBLISHING: 'กำลังโพสต์',
    PUBLISHED: 'โพสต์แล้ว',
    FAILED: 'ล้มเหลว',
  };
  return labels[status] || status;
};

export const getSiteStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    ACTIVE: 'ใช้งาน',
    INACTIVE: 'ปิดใช้งาน',
    ERROR: 'มีปัญหา',
    PENDING: 'รอตรวจสอบ',
  };
  return labels[status] || status;
};

// Day labels
export const getDayLabel = (day: number): string => {
  const days = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัส', 'ศุกร์', 'เสาร์'];
  return days[day] || '';
};
