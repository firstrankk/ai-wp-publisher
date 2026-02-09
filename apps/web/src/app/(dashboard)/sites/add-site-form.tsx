'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Globe, User, Lock, Link } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { sitesApi } from '@/lib/api';

const addSiteSchema = z.object({
  name: z.string().min(1, 'กรุณากรอกชื่อเว็บไซต์'),
  url: z.string().url('URL ไม่ถูกต้อง'),
  username: z.string().min(1, 'กรุณากรอก Username'),
  appPassword: z.string().min(1, 'กรุณากรอก Application Password'),
});

type AddSiteForm = z.infer<typeof addSiteSchema>;

interface AddSiteFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function AddSiteForm({ onSuccess, onCancel }: AddSiteFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AddSiteForm>({
    resolver: zodResolver(addSiteSchema),
  });

  const onSubmit = async (data: AddSiteForm) => {
    setIsLoading(true);
    try {
      await sitesApi.create(data);
      toast.success('เพิ่มเว็บไซต์สำเร็จ');
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'เพิ่มเว็บไซต์ไม่สำเร็จ');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Globe className="h-3.5 w-3.5" style={{ color: '#6b7280' }} />
          <label className="text-sm font-medium" style={{ color: '#374151' }}>
            ชื่อเว็บไซต์
          </label>
        </div>
        <Input
          placeholder="เช่น บล็อกสุขภาพ"
          {...register('name')}
          error={errors.name?.message}
        />
      </div>

      <div>
        <div className="flex items-center gap-2 mb-1">
          <Link className="h-3.5 w-3.5" style={{ color: '#6b7280' }} />
          <label className="text-sm font-medium" style={{ color: '#374151' }}>
            URL เว็บไซต์
          </label>
        </div>
        <Input
          placeholder="https://example.com"
          {...register('url')}
          error={errors.url?.message}
        />
        <p className="mt-1 text-xs" style={{ color: '#6b7280' }}>
          URL เต็มของเว็บไซต์ WordPress
        </p>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-1">
          <User className="h-3.5 w-3.5" style={{ color: '#6b7280' }} />
          <label className="text-sm font-medium" style={{ color: '#374151' }}>
            WordPress Username
          </label>
        </div>
        <Input
          placeholder="admin"
          {...register('username')}
          error={errors.username?.message}
        />
      </div>

      <div>
        <div className="flex items-center gap-2 mb-1">
          <Lock className="h-3.5 w-3.5" style={{ color: '#6b7280' }} />
          <label className="text-sm font-medium" style={{ color: '#374151' }}>
            Application Password
          </label>
        </div>
        <Input
          type="password"
          placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"
          {...register('appPassword')}
          error={errors.appPassword?.message}
        />
        <p className="mt-1 text-xs" style={{ color: '#6b7280' }}>
          สร้างได้ที่ WordPress {'>'} Users {'>'} Profile {'>'} Application Passwords
        </p>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          ยกเลิก
        </Button>
        <Button type="submit" isLoading={isLoading}>
          เพิ่มเว็บไซต์
        </Button>
      </div>
    </form>
  );
}
