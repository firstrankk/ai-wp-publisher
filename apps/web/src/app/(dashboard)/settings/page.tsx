'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  User,
  Mail,
  Shield,
  Lock,
  Trash2,
  Clock,
  ScrollText,
  Play,
  Save,
  Info,
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useAuth } from '@/lib/auth';
import { authApi, settingsApi } from '@/lib/api';

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'กรุณากรอกรหัสผ่านปัจจุบัน'),
    newPassword: z.string().min(8, 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'รหัสผ่านไม่ตรงกัน',
    path: ['confirmPassword'],
  });

type ChangePasswordForm = z.infer<typeof changePasswordSchema>;

const cleanupSchema = z.object({
  cleanupRetentionDays: z.number().min(1, 'ต้องมากกว่า 0').max(365, 'ไม่เกิน 365 วัน'),
  activityLogRetentionDays: z.number().min(1, 'ต้องมากกว่า 0').max(365, 'ไม่เกิน 365 วัน'),
});

type CleanupForm = z.infer<typeof cleanupSchema>;

const ROLE_LABELS: Record<string, { label: string; variant: 'info' | 'success' | 'warning' }> = {
  ADMIN: { label: 'Admin', variant: 'info' },
  EDITOR: { label: 'Editor', variant: 'success' },
  VIEWER: { label: 'Viewer', variant: 'warning' },
};

export default function SettingsPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [cleanupRunning, setCleanupRunning] = useState(false);
  const [cleanupEnabled, setCleanupEnabled] = useState(true);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
  });

  const {
    register: registerCleanup,
    handleSubmit: handleCleanupSubmit,
    setValue: setCleanupValue,
    formState: { errors: cleanupErrors },
  } = useForm<CleanupForm>({
    resolver: zodResolver(cleanupSchema),
    defaultValues: {
      cleanupRetentionDays: 15,
      activityLogRetentionDays: 30,
    },
  });

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      settingsApi.getCleanup().then((res) => {
        const data = res.data;
        setCleanupEnabled(data.cleanupEnabled);
        setCleanupValue('cleanupRetentionDays', data.cleanupRetentionDays);
        setCleanupValue('activityLogRetentionDays', data.activityLogRetentionDays);
        setSettingsLoaded(true);
      }).catch(() => {
        setSettingsLoaded(true);
      });
    }
  }, [user, setCleanupValue]);

  const onPasswordSubmit = async (data: ChangePasswordForm) => {
    setIsLoading(true);
    try {
      await authApi.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success('เปลี่ยนรหัสผ่านสำเร็จ');
      reset();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'เปลี่ยนรหัสผ่านไม่สำเร็จ');
    } finally {
      setIsLoading(false);
    }
  };

  const onCleanupSubmit = async (data: CleanupForm) => {
    setCleanupLoading(true);
    try {
      await settingsApi.updateCleanup({
        cleanupEnabled,
        cleanupRetentionDays: data.cleanupRetentionDays,
        activityLogRetentionDays: data.activityLogRetentionDays,
      });
      toast.success('บันทึกการตั้งค่าสำเร็จ');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'บันทึกไม่สำเร็จ');
    } finally {
      setCleanupLoading(false);
    }
  };

  const handleRunCleanupNow = async () => {
    if (!confirm('ต้องการล้างข้อมูลตอนนี้เลยหรือไม่?\nบทความที่โพสแล้วเกินกำหนดจะถูกลบออกจากระบบ (ไม่กระทบ WordPress)')) {
      return;
    }
    setCleanupRunning(true);
    try {
      const res = await settingsApi.runCleanupNow();
      const { articlesDeleted, logsDeleted } = res.data;
      toast.success(`ล้างข้อมูลสำเร็จ: ลบบทความ ${articlesDeleted} รายการ, ล็อก ${logsDeleted} รายการ`);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'ล้างข้อมูลไม่สำเร็จ');
    } finally {
      setCleanupRunning(false);
    }
  };

  const roleInfo = ROLE_LABELS[user?.role || 'VIEWER'];

  return (
    <div>
      <Header title="ตั้งค่า" description="จัดการบัญชีและการตั้งค่าระบบ" />

      <div className="p-8 space-y-6">
        {/* Profile Info */}
        <Card>
          <CardHeader>
            <CardTitle>ข้อมูลบัญชี</CardTitle>
            <CardDescription>ข้อมูลผู้ใช้งานปัจจุบัน</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: '#f9fafb' }}>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: '#fee2e2' }}>
                <User className="h-5 w-5" style={{ color: '#dc2626' }} />
              </div>
              <div>
                <p className="text-xs" style={{ color: '#9ca3af' }}>ชื่อ</p>
                <p className="font-medium" style={{ color: '#1f2937' }}>{user?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: '#f9fafb' }}>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: '#fee2e2' }}>
                <Mail className="h-5 w-5" style={{ color: '#dc2626' }} />
              </div>
              <div>
                <p className="text-xs" style={{ color: '#9ca3af' }}>อีเมล</p>
                <p className="font-medium" style={{ color: '#1f2937' }}>{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: '#f9fafb' }}>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: '#fee2e2' }}>
                <Shield className="h-5 w-5" style={{ color: '#dc2626' }} />
              </div>
              <div>
                <p className="text-xs" style={{ color: '#9ca3af' }}>สิทธิ์การใช้งาน</p>
                <Badge variant={roleInfo.variant}>{roleInfo.label}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Auto Cleanup Settings - Admin only */}
        {user?.role === 'ADMIN' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>ล้างข้อมูลอัตโนมัติ</CardTitle>
                  <CardDescription>
                    ลบบทความที่โพสแล้วออกจาก Database เพื่อประหยัดพื้นที่ (ไม่กระทบบทความบน WordPress)
                  </CardDescription>
                </div>
                <Badge variant={cleanupEnabled ? 'success' : 'default'}>
                  {cleanupEnabled ? 'เปิดใช้งาน' : 'ปิดอยู่'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {!settingsLoaded ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600" />
                </div>
              ) : (
                <form onSubmit={handleCleanupSubmit(onCleanupSubmit)} className="space-y-5">
                  {/* Enable/Disable Toggle */}
                  <div
                    className="flex items-center justify-between p-4 rounded-lg"
                    style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-lg"
                        style={{ backgroundColor: cleanupEnabled ? '#dcfce7' : '#f3f4f6' }}
                      >
                        <Clock
                          className="h-5 w-5"
                          style={{ color: cleanupEnabled ? '#16a34a' : '#9ca3af' }}
                        />
                      </div>
                      <div>
                        <p className="font-medium text-sm" style={{ color: '#374151' }}>
                          เปิดใช้งานล้างข้อมูลอัตโนมัติ
                        </p>
                        <p className="text-xs" style={{ color: '#9ca3af' }}>
                          ตรวจสอบทุกวันเวลา 03:00 น. หากมีบทความที่โพสแล้วเกินกำหนดจะลบออกจาก DB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCleanupEnabled(!cleanupEnabled)}
                      className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                      style={{ backgroundColor: cleanupEnabled ? '#dc2626' : '#d1d5db' }}
                    >
                      <span
                        className="inline-block h-4 w-4 rounded-full bg-white transition-transform shadow-sm"
                        style={{ transform: cleanupEnabled ? 'translateX(1.375rem)' : 'translateX(0.25rem)' }}
                      />
                    </button>
                  </div>

                  {/* Retention Settings */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div
                      className="p-4 rounded-lg"
                      style={{ border: '1px solid #e5e7eb' }}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <Trash2 className="h-4 w-4" style={{ color: '#ef4444' }} />
                        <label className="text-sm font-medium" style={{ color: '#374151' }}>
                          เก็บบทความ (วัน)
                        </label>
                      </div>
                      <Input
                        type="number"
                        min={1}
                        max={365}
                        {...registerCleanup('cleanupRetentionDays', { valueAsNumber: true })}
                        error={cleanupErrors.cleanupRetentionDays?.message}
                      />
                      <p className="text-xs mt-2" style={{ color: '#9ca3af' }}>
                        บทความ Published เกินจำนวนวันนี้จะถูกลบจาก DB (ไม่ลบจาก WordPress)
                      </p>
                    </div>

                    <div
                      className="p-4 rounded-lg"
                      style={{ border: '1px solid #e5e7eb' }}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <ScrollText className="h-4 w-4" style={{ color: '#f59e0b' }} />
                        <label className="text-sm font-medium" style={{ color: '#374151' }}>
                          เก็บ Activity Log (วัน)
                        </label>
                      </div>
                      <Input
                        type="number"
                        min={1}
                        max={365}
                        {...registerCleanup('activityLogRetentionDays', { valueAsNumber: true })}
                        error={cleanupErrors.activityLogRetentionDays?.message}
                      />
                      <p className="text-xs mt-2" style={{ color: '#9ca3af' }}>
                        ประวัติการใช้งานเกินจำนวนวันนี้จะถูกลบ
                      </p>
                    </div>
                  </div>

                  {/* Info Box */}
                  <div
                    className="flex gap-3 p-3 rounded-lg"
                    style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}
                  >
                    <Info className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: '#dc2626' }} />
                    <div className="text-xs space-y-1" style={{ color: '#991b1b' }}>
                      <p>ลบเฉพาะบทความสถานะ &quot;Published&quot; เท่านั้น บทความที่เป็น Draft, Generating, Ready หรือ Failed จะไม่ถูกลบ</p>
                      <p>บทความบน WordPress จะยังคงอยู่ตามปกติ ลบเฉพาะข้อมูลในระบบนี้เท่านั้น</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-1">
                    <Button type="submit" isLoading={cleanupLoading}>
                      <Save className="h-4 w-4 mr-2" />
                      บันทึกการตั้งค่า
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      isLoading={cleanupRunning}
                      onClick={handleRunCleanupNow}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      ล้างข้อมูลตอนนี้
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        )}

        {/* Change Password */}
        <Card>
          <CardHeader>
            <CardTitle>เปลี่ยนรหัสผ่าน</CardTitle>
            <CardDescription>อัปเดตรหัสผ่านของบัญชี</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onPasswordSubmit)} className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Lock className="h-3.5 w-3.5" style={{ color: '#6b7280' }} />
                  <label className="text-sm font-medium" style={{ color: '#374151' }}>
                    รหัสผ่านปัจจุบัน
                  </label>
                </div>
                <Input
                  type="password"
                  placeholder="กรอกรหัสผ่านปัจจุบัน"
                  {...register('currentPassword')}
                  error={errors.currentPassword?.message}
                />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Lock className="h-3.5 w-3.5" style={{ color: '#6b7280' }} />
                  <label className="text-sm font-medium" style={{ color: '#374151' }}>
                    รหัสผ่านใหม่
                  </label>
                </div>
                <Input
                  type="password"
                  placeholder="อย่างน้อย 8 ตัวอักษร"
                  {...register('newPassword')}
                  error={errors.newPassword?.message}
                />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Lock className="h-3.5 w-3.5" style={{ color: '#6b7280' }} />
                  <label className="text-sm font-medium" style={{ color: '#374151' }}>
                    ยืนยันรหัสผ่านใหม่
                  </label>
                </div>
                <Input
                  type="password"
                  placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                  {...register('confirmPassword')}
                  error={errors.confirmPassword?.message}
                />
              </div>
              <Button type="submit" isLoading={isLoading}>
                <Lock className="h-4 w-4 mr-2" />
                เปลี่ยนรหัสผ่าน
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
