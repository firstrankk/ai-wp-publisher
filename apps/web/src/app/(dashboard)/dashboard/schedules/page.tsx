'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Calendar, Play, Pause, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { schedulesApi } from '@/lib/api';
import { formatDate, DAY_LABELS, TONE_LABELS } from '@/lib/utils';
import { AddScheduleForm } from './add-schedule-form';

export default function SchedulesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteScheduleId, setDeleteScheduleId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['schedules', search],
    queryFn: () => schedulesApi.list({ search, limit: 50 }).then((res) => res.data),
  });

  const pauseMutation = useMutation({
    mutationFn: (id: string) => schedulesApi.pause(id),
    onSuccess: () => {
      toast.success('Schedule paused');
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
  });

  const resumeMutation = useMutation({
    mutationFn: (id: string) => schedulesApi.resume(id),
    onSuccess: () => {
      toast.success('Schedule resumed');
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
  });

  const runMutation = useMutation({
    mutationFn: (id: string) => schedulesApi.run(id),
    onSuccess: () => {
      toast.success('Schedule triggered');
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Run failed');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => schedulesApi.delete(id),
    onSuccess: () => {
      toast.success('Schedule deleted');
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
  });

  const formatDays = (days: number[]) => {
    return days.map((d) => DAY_LABELS[d]).join(', ');
  };

  return (
    <div>
      <Header
        title="Schedules"
        description="Automate article publishing"
        action={
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Schedule
          </Button>
        }
      />

      <div className="p-6">
        {/* Search */}
        <div className="mb-6 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search schedules..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Table */}
        <div className="rounded-lg border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Schedule</TableHead>
                <TableHead>Site</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Days</TableHead>
                <TableHead>Keywords</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[150px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : data?.data?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    No schedules found
                  </TableCell>
                </TableRow>
              ) : (
                data?.data?.map((schedule: any) => (
                  <TableRow key={schedule.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                          <Calendar className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium">{schedule.name}</p>
                          <p className="text-sm text-gray-500">
                            {schedule.timeStart} - {schedule.timeEnd}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{schedule.site?.name}</TableCell>
                    <TableCell>{schedule.frequency} posts/week</TableCell>
                    <TableCell>
                      <span className="text-sm">{formatDays(schedule.days)}</span>
                    </TableCell>
                    <TableCell>{schedule._count?.keywords || 0}</TableCell>
                    <TableCell>
                      <Badge variant={schedule.isActive ? 'success' : 'default'}>
                        {schedule.isActive ? 'Active' : 'Paused'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {schedule.isActive ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => pauseMutation.mutate(schedule.id)}
                            title="Pause"
                          >
                            <Pause className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => resumeMutation.mutate(schedule.id)}
                            title="Resume"
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => runMutation.mutate(schedule.id)}
                          title="Run now"
                        >
                          <Play className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteScheduleId(schedule.id)}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Add Schedule Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Create Schedule"
        size="lg"
      >
        <AddScheduleForm
          onSuccess={() => {
            setIsAddModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ['schedules'] });
          }}
          onCancel={() => setIsAddModalOpen(false)}
        />
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteScheduleId}
        onClose={() => setDeleteScheduleId(null)}
        onConfirm={() => {
          if (deleteScheduleId) {
            deleteMutation.mutate(deleteScheduleId);
            setDeleteScheduleId(null);
          }
        }}
        title="ลบตารางเวลา"
        message="คุณต้องการลบตารางเวลานี้หรือไม่? บทความที่สร้างไปแล้วจะไม่ถูกลบ"
        confirmText="ลบ"
        cancelText="ยกเลิก"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
