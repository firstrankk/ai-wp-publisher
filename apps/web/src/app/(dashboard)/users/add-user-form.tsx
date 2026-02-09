'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { User, Mail, Lock, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { usersApi } from '@/lib/api';

const addUserSchema = z.object({
  name: z.string().min(2, 'ชื่อต้องมีอย่างน้อย 2 ตัวอักษร'),
  email: z.string().email('อีเมลไม่ถูกต้อง'),
  password: z.string().min(8, 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร'),
  role: z.enum(['ADMIN', 'EDITOR', 'VIEWER']),
});

type AddUserForm = z.infer<typeof addUserSchema>;

interface AddUserFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function AddUserForm({ onSuccess, onCancel }: AddUserFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AddUserForm>({
    resolver: zodResolver(addUserSchema),
    defaultValues: {
      role: 'EDITOR',
    },
  });

  const onSubmit = async (data: AddUserForm) => {
    setIsLoading(true);
    try {
      await usersApi.create(data);
      toast.success('สร้างผู้ใช้สำเร็จ');
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'สร้างผู้ใช้ไม่สำเร็จ');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <User className="h-3.5 w-3.5" style={{ color: '#6b7280' }} />
          <label className="text-sm font-medium" style={{ color: '#374151' }}>
            ชื่อ
          </label>
        </div>
        <Input
          placeholder="กรอกชื่อผู้ใช้"
          {...register('name')}
          error={errors.name?.message}
        />
      </div>

      <div>
        <div className="flex items-center gap-2 mb-1">
          <Mail className="h-3.5 w-3.5" style={{ color: '#6b7280' }} />
          <label className="text-sm font-medium" style={{ color: '#374151' }}>
            อีเมล
          </label>
        </div>
        <Input
          type="email"
          placeholder="user@example.com"
          {...register('email')}
          error={errors.email?.message}
        />
      </div>

      <div>
        <div className="flex items-center gap-2 mb-1">
          <Lock className="h-3.5 w-3.5" style={{ color: '#6b7280' }} />
          <label className="text-sm font-medium" style={{ color: '#374151' }}>
            รหัสผ่าน
          </label>
        </div>
        <Input
          type="password"
          placeholder="อย่างน้อย 8 ตัวอักษร"
          {...register('password')}
          error={errors.password?.message}
        />
      </div>

      <div>
        <div className="flex items-center gap-2 mb-1">
          <Shield className="h-3.5 w-3.5" style={{ color: '#6b7280' }} />
          <label className="text-sm font-medium" style={{ color: '#374151' }}>
            สิทธิ์การใช้งาน
          </label>
        </div>
        <Select
          {...register('role')}
          options={[
            { value: 'ADMIN', label: 'Admin - เข้าถึงทั้งหมด' },
            { value: 'EDITOR', label: 'Editor - จัดการเว็บที่ได้รับมอบหมาย' },
            { value: 'VIEWER', label: 'Viewer - ดูอย่างเดียว' },
          ]}
          error={errors.role?.message}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          ยกเลิก
        </Button>
        <Button type="submit" isLoading={isLoading}>
          สร้างผู้ใช้
        </Button>
      </div>
    </form>
  );
}
