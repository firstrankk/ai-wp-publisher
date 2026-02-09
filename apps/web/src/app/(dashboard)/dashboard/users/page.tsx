'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Users, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { usersApi } from '@/lib/api';
import { formatDate, ROLE_LABELS } from '@/lib/utils';
import { AddUserForm } from './add-user-form';

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['users', search],
    queryFn: () => usersApi.list({ search, limit: 50 }).then((res) => res.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: () => {
      toast.success('User deleted');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Delete failed');
    },
  });

  const getRoleBadge = (role: string) => {
    const colors: Record<string, 'success' | 'info' | 'default'> = {
      ADMIN: 'success',
      EDITOR: 'info',
      VIEWER: 'default',
    };
    return (
      <Badge variant={colors[role] || 'default'}>
        {ROLE_LABELS[role as keyof typeof ROLE_LABELS] || role}
      </Badge>
    );
  };

  return (
    <div>
      <Header
        title="ผู้ใช้งาน"
        description="จัดการผู้ใช้งานระบบ"
        action={
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            เพิ่มผู้ใช้
          </Button>
        }
      />

      <div className="p-6">
        {/* Search */}
        <div className="mb-6 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="ค้นหาผู้ใช้..."
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
                <TableHead>ผู้ใช้</TableHead>
                <TableHead>สิทธิ์</TableHead>
                <TableHead>เว็บไซต์</TableHead>
                <TableHead>บทความ</TableHead>
                <TableHead>วันที่สร้าง</TableHead>
                <TableHead className="w-[80px]">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : data?.data?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    ไม่พบผู้ใช้
                  </TableCell>
                </TableRow>
              ) : (
                data?.data?.map((user: any) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-700 font-medium">
                          {user.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>{user._count?.sites || 0}</TableCell>
                    <TableCell>{user._count?.articles || 0}</TableCell>
                    <TableCell className="text-gray-500">
                      {formatDate(user.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteUserId(user.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Add User Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="เพิ่มผู้ใช้ใหม่"
      >
        <AddUserForm
          onSuccess={() => {
            setIsAddModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ['users'] });
          }}
          onCancel={() => setIsAddModalOpen(false)}
        />
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteUserId}
        onClose={() => setDeleteUserId(null)}
        onConfirm={() => {
          if (deleteUserId) {
            deleteMutation.mutate(deleteUserId);
            setDeleteUserId(null);
          }
        }}
        title="ลบผู้ใช้"
        message="คุณต้องการลบผู้ใช้นี้หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้"
        confirmText="ลบ"
        cancelText="ยกเลิก"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
