'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Globe,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  FilePlus,
  FileStack,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { dashboardApi } from '@/lib/api';
import { formatNumber } from '@/lib/utils';

const CHART_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
];

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardApi.getStats().then((res) => res.data),
  });

  const { data: postsReport } = useQuery({
    queryKey: ['posts-report'],
    queryFn: () => dashboardApi.getPostsReport().then((res) => res.data),
  });

  const statCards = [
    {
      title: 'เว็บไซต์ทั้งหมด',
      value: stats?.totalSites || 0,
      icon: Globe,
      gradient: 'from-neon-500 to-neon-600',
      glow: 'shadow-[0_0_20px_rgba(37,99,235,0.3)]',
    },
    {
      title: 'เว็บไซต์ Active',
      value: stats?.activeSites || 0,
      icon: CheckCircle,
      gradient: 'from-success-500 to-success-600',
      glow: 'shadow-[0_0_20px_rgba(34,197,94,0.3)]',
    },
    {
      title: 'โพสวันนี้',
      value: stats?.todayPosts || 0,
      icon: FileText,
      gradient: 'from-warning-500 to-warning-600',
      glow: 'shadow-[0_0_20px_rgba(249,115,22,0.3)]',
    },
    {
      title: 'สัปดาห์นี้',
      value: stats?.weekPosts || 0,
      icon: Clock,
      gradient: 'from-blue-500 to-blue-600',
      glow: 'shadow-[0_0_20px_rgba(59,130,246,0.3)]',
    },
    {
      title: 'รอดำเนินการ',
      value: stats?.queueCount || 0,
      icon: Clock,
      gradient: 'from-amber-500 to-amber-600',
      glow: 'shadow-[0_0_20px_rgba(245,158,11,0.3)]',
    },
    {
      title: 'ข้อผิดพลาด',
      value: stats?.errorCount || 0,
      icon: AlertCircle,
      gradient: 'from-error-500 to-error-600',
      glow: 'shadow-[0_0_20px_rgba(239,68,68,0.3)]',
    },
  ];

  const quickActions = [
    {
      title: 'สร้างบทความใหม่',
      description: 'เขียนและเผยแพร่บทความ',
      href: '/dashboard/articles/new',
      icon: FilePlus,
      gradient: 'from-neon-500 to-neon-600',
    },
    {
      title: 'Bulk Create',
      description: 'สร้างบทความจำนวนมาก',
      href: '/dashboard/bulk-create',
      icon: FileStack,
      gradient: 'from-warning-500 to-warning-600',
    },
    {
      title: 'เพิ่มเว็บไซต์',
      description: 'เชื่อมต่อเว็บไซต์ใหม่',
      href: '/dashboard/sites',
      icon: Globe,
      gradient: 'from-success-500 to-success-600',
    },
  ];

  const bySite = postsReport?.bySite || [];
  const summary = postsReport?.summary;

  return (
    <div>
      <Header
        title="Dashboard"
        description="ภาพรวมการเผยแพร่บทความ"
      />

      <div className="p-8 space-y-8">
        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="group hover:scale-[1.02] transition-transform duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#6b7280' }}>{stat.title}</p>
                      <p className="mt-2 text-3xl font-bold" style={{ color: '#1f2937' }}>
                        {statsLoading ? '-' : formatNumber(stat.value)}
                      </p>
                    </div>
                    <div className={`relative rounded-xl bg-gradient-to-br ${stat.gradient} p-3 ${stat.glow}`}>
                      <Icon className="h-6 w-6" style={{ color: '#ffffff' }} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions + Posts Chart */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>ทางลัด</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link key={action.href} href={action.href}>
                    <div className="flex items-center gap-4 rounded-lg border p-4 hover:bg-gray-50 transition-colors" style={{ borderColor: '#e5e7eb' }}>
                      <div className={`rounded-lg bg-gradient-to-br ${action.gradient} p-2.5`}>
                        <Icon className="h-5 w-5" style={{ color: '#ffffff' }} />
                      </div>
                      <div>
                        <p className="font-medium text-sm" style={{ color: '#1f2937' }}>{action.title}</p>
                        <p className="text-xs" style={{ color: '#6b7280' }}>{action.description}</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </CardContent>
          </Card>

          {/* Posts Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>บทความแยกตามเว็บไซต์</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Summary mini stats */}
              {summary && (
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="rounded-lg p-3 text-center" style={{ backgroundColor: '#f0fdf4' }}>
                    <p className="text-xs font-medium" style={{ color: '#16a34a' }}>เผยแพร่แล้ว</p>
                    <p className="text-xl font-bold" style={{ color: '#15803d' }}>{formatNumber(summary.published)}</p>
                  </div>
                  <div className="rounded-lg p-3 text-center" style={{ backgroundColor: '#fffbeb' }}>
                    <p className="text-xs font-medium" style={{ color: '#d97706' }}>รอดำเนินการ</p>
                    <p className="text-xl font-bold" style={{ color: '#b45309' }}>{formatNumber(summary.pending)}</p>
                  </div>
                  <div className="rounded-lg p-3 text-center" style={{ backgroundColor: '#fef2f2' }}>
                    <p className="text-xs font-medium" style={{ color: '#dc2626' }}>ล้มเหลว</p>
                    <p className="text-xl font-bold" style={{ color: '#b91c1c' }}>{formatNumber(summary.failed)}</p>
                  </div>
                </div>
              )}

              {/* Bar Chart */}
              {bySite.length > 0 ? (
                <ResponsiveContainer width="100%" height={bySite.length * 50 + 20} minHeight={150}>
                  <BarChart data={bySite} layout="vertical" margin={{ left: 0, right: 20, top: 5, bottom: 5 }}>
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                    <YAxis
                      type="category"
                      dataKey="siteName"
                      width={120}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                      formatter={(value: number) => [value, 'บทความ']}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                    />
                    <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={24}>
                      {bySite.map((_: any, index: number) => (
                        <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[150px]" style={{ color: '#9ca3af' }}>
                  <p className="text-sm">ยังไม่มีข้อมูลบทความ</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
