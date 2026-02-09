'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { signIn } from 'next-auth/react';
import { User, Mail, Lock, ShieldCheck, Newspaper } from 'lucide-react';
import { authApi } from '@/lib/api';

const registerSchema = z.object({
  name: z.string().min(2, 'ชื่อต้องมีอย่างน้อย 2 ตัวอักษร'),
  email: z.string().email('อีเมลไม่ถูกต้อง'),
  password: z.string().min(8, 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'รหัสผ่านไม่ตรงกัน',
  path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      // Step 1: Register via API
      await authApi.register({
        name: data.name,
        email: data.email,
        password: data.password,
      });

      // Step 2: Auto-login with NextAuth
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        toast.success('สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ');
        router.push('/login');
      } else {
        toast.success('สมัครสมาชิกสำเร็จ!');
        router.push('/dashboard');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'สมัครสมาชิกล้มเหลว');
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass =
    'w-full h-12 pl-11 pr-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all';

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Top gradient section */}
      <div className="relative flex flex-col items-center justify-center px-4 pt-20 pb-36 bg-gradient-to-br from-red-500 via-red-600 to-rose-700">
        {/* Decorative circles */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-white/5 rounded-full" />
        <div className="absolute bottom-8 right-12 w-24 h-24 bg-white/5 rounded-full" />
        <div className="absolute top-20 right-1/4 w-16 h-16 bg-white/5 rounded-full" />

        <div className="relative z-10 flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-lg">
            <Newspaper className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">AI Publisher</h1>
          <p className="text-white/60 text-sm">ระบบจัดการบทความอัจฉริยะ</p>
        </div>
      </div>

      {/* White card overlapping gradient */}
      <div className="relative -mt-20 mx-auto w-full max-w-md px-4 pb-8">
        <div className="bg-white rounded-3xl shadow-xl px-8 pt-10 pb-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">สร้างบัญชีใหม่</h2>
            <p className="text-gray-500 mt-1">เริ่มต้นใช้งานฟรี</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 ml-1">
                ชื่อ
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="ชื่อของคุณ"
                  className={inputClass}
                  {...register('name')}
                />
              </div>
              {errors.name && (
                <p className="mt-1.5 text-xs text-red-500 ml-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 ml-1">
                อีเมล
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  placeholder="you@example.com"
                  className={inputClass}
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-500 ml-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 ml-1">
                รหัสผ่าน
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  placeholder="อย่างน้อย 8 ตัวอักษร"
                  className={inputClass}
                  {...register('password')}
                />
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-500 ml-1">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 ml-1">
                ยืนยันรหัสผ่าน
              </label>
              <div className="relative">
                <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  placeholder="ระบุรหัสผ่านอีกครั้ง"
                  className={inputClass}
                  {...register('confirmPassword')}
                />
              </div>
              {errors.confirmPassword && (
                <p className="mt-1.5 text-xs text-red-500 ml-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 text-white font-semibold text-sm shadow-md shadow-red-500/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  กำลังสร้างบัญชี...
                </>
              ) : (
                'สมัครสมาชิก'
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            มีบัญชีอยู่แล้ว?{' '}
            <Link href="/login" className="text-red-600 font-medium hover:text-red-500 transition-colors">
              เข้าสู่ระบบ
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
