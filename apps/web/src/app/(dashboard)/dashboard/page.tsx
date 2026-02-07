'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Globe,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Card, CardContent } from '@/components/ui/card';
import { dashboardApi } from '@/lib/api';
import { formatNumber } from '@/lib/utils';

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardApi.getStats().then((res) => res.data),
  });

  const statCards = [
    {
      title: 'Total Sites',
      value: stats?.totalSites || 0,
      icon: Globe,
      gradient: 'from-neon-500 to-neon-600',
      glow: 'shadow-[0_0_20px_rgba(37,99,235,0.3)]',
    },
    {
      title: 'Active Sites',
      value: stats?.activeSites || 0,
      icon: CheckCircle,
      gradient: 'from-success-500 to-success-600',
      glow: 'shadow-[0_0_20px_rgba(34,197,94,0.3)]',
    },
    {
      title: 'Today\'s Posts',
      value: stats?.todayPosts || 0,
      icon: FileText,
      gradient: 'from-warning-500 to-warning-600',
      glow: 'shadow-[0_0_20px_rgba(249,115,22,0.3)]',
    },
    {
      title: 'This Week',
      value: stats?.weekPosts || 0,
      icon: Clock,
      gradient: 'from-blue-500 to-blue-600',
      glow: 'shadow-[0_0_20px_rgba(59,130,246,0.3)]',
    },
    {
      title: 'In Queue',
      value: stats?.queueCount || 0,
      icon: Clock,
      gradient: 'from-amber-500 to-amber-600',
      glow: 'shadow-[0_0_20px_rgba(245,158,11,0.3)]',
    },
    {
      title: 'Errors',
      value: stats?.errorCount || 0,
      icon: AlertCircle,
      gradient: 'from-error-500 to-error-600',
      glow: 'shadow-[0_0_20px_rgba(239,68,68,0.3)]',
    },
  ];

  return (
    <div>
      <Header
        title="Dashboard"
        description="Overview of your publishing activity"
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

      </div>
    </div>
  );
}
