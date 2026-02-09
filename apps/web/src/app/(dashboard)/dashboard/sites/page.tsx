'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Globe, XCircle, Loader2, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { sitesApi } from '@/lib/api';
import { formatDate, STATUS_LABELS } from '@/lib/utils';
import { AddSiteForm } from './add-site-form';
import { BulkImportForm } from './bulk-import-form';

export default function SitesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
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
        title="เว็บไซต์"
        description="จัดการเว็บไซต์ WordPress ทั้งหมด"
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsBulkImportOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              นำเข้าหลายเว็บ
            </Button>
            <Button onClick={() => setIsAddModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              เพิ่มเว็บไซต์
            </Button>
          </div>
        }
      />

      <div className="p-4 sm:p-6">
        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="ค้นหาเว็บไซต์..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 w-full max-w-md"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    เว็บไซต์
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    สถานะ
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    บทความ
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    วันที่สร้าง
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    จัดการ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent" />
                      </div>
                    </td>
                  </tr>
                ) : data?.data?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                      ไม่พบเว็บไซต์
                    </td>
                  </tr>
                ) : (
                  data?.data?.map((site: any) => (
                    <tr key={site.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 h-9 w-9 flex items-center justify-center rounded-lg bg-blue-50 border border-blue-100">
                            <Globe className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900">{site.name}</p>
                            <p className="text-xs text-gray-500 truncate">{site.url}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(site.status)}</td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600">{site._count?.articles || 0}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-500">{formatDate(site.createdAt)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
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
                            size="icon"
                            onClick={() => setDeleteSiteId(site.id)}
                            title="Delete"
                          >
                            <XCircle className="h-4 w-4 text-red-400 hover:text-red-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer info */}
        {data?.data?.length > 0 && (
          <div className="mt-3 text-sm text-gray-500">
            ทั้งหมด {data.data.length} เว็บไซต์
          </div>
        )}
      </div>

      {/* Add Site Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="เพิ่มเว็บไซต์ใหม่"
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

      {/* Bulk Import Modal */}
      <Modal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        title="Bulk Import เว็บไซต์"
        size="xl"
      >
        <BulkImportForm
          onSuccess={() => {
            setIsBulkImportOpen(false);
            queryClient.invalidateQueries({ queryKey: ['sites'] });
          }}
          onCancel={() => setIsBulkImportOpen(false)}
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
