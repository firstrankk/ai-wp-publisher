'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, MoreVertical, Globe, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { sitesApi } from '@/lib/api';
import { formatDate, STATUS_COLORS, STATUS_LABELS } from '@/lib/utils';
import { AddSiteForm } from './add-site-form';

export default function SitesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [testingSite, setTestingSite] = useState<string | null>(null);
  const [deleteSiteId, setDeleteSiteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['sites', search],
    queryFn: () => sitesApi.list({ search, limit: 50 }).then((res) => res.data),
  });

  const testMutation = useMutation({
    mutationFn: (id: string) => sitesApi.testConnection(id),
    onSuccess: (res, id) => {
      if (res.data.success) {
        toast.success(res.data.message);
      } else {
        toast.error(res.data.message);
      }
      queryClient.invalidateQueries({ queryKey: ['sites'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Connection test failed');
    },
    onSettled: () => {
      setTestingSite(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => sitesApi.delete(id),
    onSuccess: () => {
      toast.success('Site deleted');
      queryClient.invalidateQueries({ queryKey: ['sites'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Delete failed');
    },
  });

  const handleTest = (id: string) => {
    setTestingSite(id);
    testMutation.mutate(id);
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
      ACTIVE: 'success',
      INACTIVE: 'default',
      ERROR: 'danger',
      PENDING: 'warning',
    };
    return (
      <Badge variant={colors[status] || 'default'}>
        {STATUS_LABELS[status as keyof typeof STATUS_LABELS] || status}
      </Badge>
    );
  };

  return (
    <div>
      <Header
        title="Sites"
        description="Manage your WordPress sites"
        action={
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Site
          </Button>
        }
      />

      <div className="p-8">
        {/* Search */}
        <div className="mb-6 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: '#9ca3af' }} />
            <Input
              placeholder="Search sites..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Table */}
        <div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Site</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Articles</TableHead>
                <TableHead>Schedules</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-t-transparent" style={{ borderColor: '#2563eb', borderTopColor: 'transparent' }} />
                    </div>
                  </TableCell>
                </TableRow>
              ) : data?.data?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8" style={{ color: '#9ca3af' }}>
                    No sites found
                  </TableCell>
                </TableRow>
              ) : (
                data?.data?.map((site: any) => (
                  <TableRow key={site.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: '#eff6ff', border: '1px solid #dbeafe' }}>
                          <Globe className="h-5 w-5" style={{ color: '#2563eb' }} />
                        </div>
                        <div>
                          <p className="font-medium" style={{ color: '#1f2937' }}>{site.name}</p>
                          <p className="text-sm" style={{ color: '#6b7280' }}>{site.url}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(site.status)}</TableCell>
                    <TableCell style={{ color: '#4b5563' }}>{site._count?.articles || 0}</TableCell>
                    <TableCell style={{ color: '#4b5563' }}>{site._count?.schedules || 0}</TableCell>
                    <TableCell style={{ color: '#6b7280' }}>
                      {formatDate(site.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTest(site.id)}
                          disabled={testingSite === site.id}
                        >
                          {testingSite === site.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Test'
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteSiteId(site.id)}
                        >
                          <XCircle className="h-4 w-4" style={{ color: '#ef4444' }} />
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

      {/* Add Site Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Site"
        size="lg"
      >
        <AddSiteForm
          onSuccess={() => {
            setIsAddModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ['sites'] });
          }}
          onCancel={() => setIsAddModalOpen(false)}
        />
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteSiteId}
        onClose={() => setDeleteSiteId(null)}
        onConfirm={() => {
          if (deleteSiteId) {
            deleteMutation.mutate(deleteSiteId);
            setDeleteSiteId(null);
          }
        }}
        title="ลบเว็บไซต์"
        message="คุณต้องการลบเว็บไซต์นี้หรือไม่? บทความและตารางเวลาที่เกี่ยวข้องจะถูกลบด้วย"
        confirmText="ลบ"
        cancelText="ยกเลิก"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
