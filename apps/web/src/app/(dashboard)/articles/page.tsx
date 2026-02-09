'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  FileText,
  ExternalLink,
  RefreshCw,
  Trash2,
  Sparkles,
  Send,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Square,
  MinusSquare,
  MoreVertical,
  Globe,
  AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { articlesApi, sitesApi } from '@/lib/api';
import { formatDate, STATUS_LABELS, TONE_LABELS } from '@/lib/utils';

export default function ArticlesPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [siteFilter, setSiteFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Delete confirmation dialog state
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    articleId?: string;
    isBulk: boolean;
    deleteFromWP: boolean;
  }>({ isOpen: false, isBulk: false, deleteFromWP: false });

  // Reset page when filters change
  const handleSearch = (value: string) => { setSearch(value); setPage(1); };
  const handleStatusFilter = (value: string) => { setStatusFilter(value); setPage(1); };
  const handleSiteFilter = (value: string) => { setSiteFilter(value); setPage(1); };

  const { data: articles, isLoading } = useQuery({
    queryKey: ['articles', search, statusFilter, siteFilter, page],
    queryFn: () =>
      articlesApi
        .list({ search, status: statusFilter || undefined, siteId: siteFilter || undefined, limit: 50, page })
        .then((res) => res.data),
  });

  const totalPages = articles?.totalPages || 1;

  const { data: sites } = useQuery({
    queryKey: ['sites-list'],
    queryFn: () => sitesApi.list({ limit: 100 }).then((res) => res.data),
  });

  const articleList = articles?.data || [];

  // Selection handlers
  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === articleList.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(articleList.map((a: any) => a.id)));
    }
  };

  const isAllSelected = articleList.length > 0 && selectedIds.size === articleList.length;
  const isSomeSelected = selectedIds.size > 0 && selectedIds.size < articleList.length;

  const generateMutation = useMutation({
    mutationFn: (id: string) => articlesApi.generate(id),
    onSuccess: () => {
      toast.success('Article generated');
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Generation failed');
    },
  });

  const publishMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'draft' | 'publish' }) =>
      articlesApi.publish(id, status),
    onSuccess: (_, variables) => {
      toast.success(variables.status === 'publish' ? 'เผยแพร่บทความแล้ว!' : 'บันทึกเป็นแบบร่างแล้ว');
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'เผยแพร่ล้มเหลว');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: ({ id, deleteFromWP }: { id: string; deleteFromWP: boolean }) =>
      articlesApi.delete(id, deleteFromWP),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async ({ ids, deleteFromWP }: { ids: string[]; deleteFromWP: boolean }) => {
      for (const id of ids) {
        await articlesApi.delete(id, deleteFromWP);
      }
    },
    onSuccess: () => {
      toast.success(`Deleted ${selectedIds.size} articles`);
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
    onError: () => {
      toast.error('Failed to delete some articles');
    },
  });

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    setDeleteDialog({ isOpen: true, isBulk: true, deleteFromWP: false });
  };

  const handleDeleteConfirm = () => {
    if (deleteDialog.isBulk) {
      bulkDeleteMutation.mutate({ ids: Array.from(selectedIds), deleteFromWP: deleteDialog.deleteFromWP });
    } else if (deleteDialog.articleId) {
      deleteMutation.mutate({ id: deleteDialog.articleId, deleteFromWP: deleteDialog.deleteFromWP });
    }
    setDeleteDialog({ isOpen: false, isBulk: false, deleteFromWP: false });
  };

  const openDeleteDialog = (articleId: string) => {
    setDeleteDialog({ isOpen: true, articleId, isBulk: false, deleteFromWP: false });
  };

  // Publish dropdown component
  const PublishDropdown = ({ articleId }: { articleId: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handlePublish = (status: 'draft' | 'publish') => {
      setIsOpen(false);
      publishMutation.mutate({ id: articleId, status });
    };

    return (
      <div className="relative" ref={dropdownRef}>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          disabled={publishMutation.isPending}
          title="เผยแพร่"
        >
          <Send className="h-4 w-4 text-emerald-500" />
        </Button>
        {isOpen && (
          <div className="absolute right-0 mt-1 w-44 bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden py-1">
            <button
              onClick={() => handlePublish('publish')}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <Send className="h-3.5 w-3.5 text-emerald-500" />
              เผยแพร่ทันที
            </button>
            <button
              onClick={() => handlePublish('draft')}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <FileText className="h-3.5 w-3.5 text-gray-400" />
              บันทึกแบบร่าง
            </button>
          </div>
        )}
      </div>
    );
  };

  const getStatusBadge = (status: string, scheduledAt?: string) => {
    const colors: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
      DRAFT: 'default',
      GENERATING: 'info',
      READY: 'warning',
      PUBLISHING: 'info',
      PUBLISHED: 'success',
      SCHEDULED: 'info',
      FAILED: 'danger',
    };
    return (
      <div className="flex flex-col items-start gap-0.5">
        <Badge variant={colors[status] || 'default'}>
          {STATUS_LABELS[status as keyof typeof STATUS_LABELS] || status}
        </Badge>
        {status === 'SCHEDULED' && scheduledAt && (
          <span className="text-xs text-gray-600">
            {formatDate(scheduledAt)}
          </span>
        )}
      </div>
    );
  };

  // Mobile card component
  const ArticleCard = ({ article }: { article: any }) => (
    <div
      onClick={() => router.push(`/articles/${article.id}`)}
      className={`p-4 border-b border-gray-100 last:border-b-0 cursor-pointer hover:bg-gray-50 transition-colors ${
        selectedIds.has(article.id) ? 'bg-red-50' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={(e) => { e.stopPropagation(); toggleSelect(article.id); }}
          className="mt-1 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
        >
          {selectedIds.has(article.id) ? (
            <CheckSquare className="h-5 w-5 text-red-600" />
          ) : (
            <Square className="h-5 w-5" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-gray-900 line-clamp-2">
                {article.title || article.keyword}
              </p>
              {article.title && (
                <p className="text-xs text-gray-500 mt-0.5 truncate">
                  {article.keyword}
                </p>
              )}
            </div>
            {getStatusBadge(article.status, article.scheduledAt)}
          </div>

          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Globe className="h-3 w-3" />
              {article.site?.name}
            </span>
            <span>{TONE_LABELS[article.tone as keyof typeof TONE_LABELS]}</span>
            <span>{formatDate(article.createdAt)}</span>
          </div>

          <div className="flex items-center gap-1 mt-3" onClick={(e) => e.stopPropagation()}>
            {article.status === 'DRAFT' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => generateMutation.mutate(article.id)}
                disabled={generateMutation.isPending}
                className="h-8 text-xs"
              >
                <Sparkles className="h-3 w-3 mr-1 text-purple-500" />
                Generate
              </Button>
            )}
            {article.status === 'READY' && (
              <PublishDropdown articleId={article.id} />
            )}
            {article.status === 'FAILED' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => articlesApi.retry(article.id)}
                className="h-8 text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1 text-orange-500" />
                Retry
              </Button>
            )}
            {article.wpPostUrl && (
              <a href={article.wpPostUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="h-8 text-xs">
                  <ExternalLink className="h-3 w-3 mr-1 text-red-500" />
                  View
                </Button>
              </a>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openDeleteDialog(article.id)}
              className="h-8 text-xs ml-auto"
            >
              <Trash2 className="h-3 w-3 text-red-400" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <Header
        title="Articles"
        description="จัดการและเผยแพร่บทความ"
        action={
          <Link href="/articles/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">สร้างบทความ</span>
              <span className="sm:hidden">New</span>
            </Button>
          </Link>
        }
      />

      <div className="p-4 sm:p-6">
        {/* Filters */}
        <div className="mb-4 space-y-3">
          {/* Search - full width on mobile */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search articles..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 w-full"
            />
          </div>

          {/* Filters row */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-full sm:w-auto">
              <Select
                value={statusFilter}
                onChange={(e) => handleStatusFilter(e.target.value)}
                options={[
                  { value: '', label: 'ทุกสถานะ' },
                  { value: 'DRAFT', label: 'แบบร่าง' },
                  { value: 'GENERATING', label: 'กำลังสร้าง' },
                  { value: 'READY', label: 'พร้อมโพสต์' },
                  { value: 'PUBLISHING', label: 'กำลังเผยแพร่' },
                  { value: 'PUBLISHED', label: 'เผยแพร่แล้ว' },
                  { value: 'SCHEDULED', label: 'ตั้งเวลา' },
                  { value: 'FAILED', label: 'ล้มเหลว' },
                ]}
                className="w-full sm:w-36"
              />
            </div>
            <div className="w-full sm:w-auto">
              <Select
                value={siteFilter}
                onChange={(e) => handleSiteFilter(e.target.value)}
                options={[
                  { value: '', label: 'ทุกเว็บไซต์' },
                  ...(sites?.data?.map((site: any) => ({
                    value: site.id,
                    label: site.name,
                  })) || []),
                ]}
                className="w-full sm:w-40"
              />
            </div>

            {selectedIds.size > 0 && (
              <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-200">
                <span className="text-sm text-gray-500">
                  {selectedIds.size} selected
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkDelete}
                  disabled={bulkDeleteMutation.isPending}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Table - hidden on mobile */}
        <div className="hidden md:block bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="w-12 px-4 py-3">
                    <button
                      onClick={toggleSelectAll}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {isAllSelected ? (
                        <CheckSquare className="h-5 w-5 text-red-600" />
                      ) : isSomeSelected ? (
                        <MinusSquare className="h-5 w-5 text-red-600" />
                      ) : (
                        <Square className="h-5 w-5" />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 tracking-wider">
                    บทความ
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 tracking-wider">
                    เว็บไซต์
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 tracking-wider">
                    สถานะ
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 tracking-wider">
                    โทน
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 tracking-wider">
                    วันที่สร้าง
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 tracking-wider">
                    จัดการ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-red-600 border-t-transparent" />
                      </div>
                    </td>
                  </tr>
                ) : articleList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                      ไม่พบบทความ
                    </td>
                  </tr>
                ) : (
                  articleList.map((article: any) => (
                    <tr
                      key={article.id}
                      onClick={() => router.push(`/articles/${article.id}`)}
                      className={`hover:bg-gray-50 transition-colors cursor-pointer ${selectedIds.has(article.id) ? 'bg-red-50' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleSelect(article.id); }}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {selectedIds.has(article.id) ? (
                            <CheckSquare className="h-5 w-5 text-red-600" />
                          ) : (
                            <Square className="h-5 w-5" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 h-9 w-9 flex items-center justify-center rounded-lg bg-red-50 border border-red-100">
                            <FileText className="h-4 w-4 text-red-600" />
                          </div>
                          <div className="min-w-0 max-w-[280px]">
                            <p className="font-medium text-gray-900 truncate">
                              {article.title || article.keyword}
                            </p>
                            {article.title && (
                              <p className="text-xs text-gray-500 truncate">
                                {article.keyword}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600">{article.site?.name}</span>
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(article.status, article.scheduledAt)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-500">
                          {TONE_LABELS[article.tone as keyof typeof TONE_LABELS]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-500">
                          {formatDate(article.createdAt)}
                        </span>
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-1">
                          {article.status === 'DRAFT' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => generateMutation.mutate(article.id)}
                              disabled={generateMutation.isPending}
                              title="สร้างบทความ"
                            >
                              <Sparkles className="h-4 w-4 text-purple-500" />
                            </Button>
                          )}
                          {article.status === 'READY' && (
                            <PublishDropdown articleId={article.id} />
                          )}
                          {article.status === 'FAILED' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => articlesApi.retry(article.id)}
                              title="ลองใหม่"
                            >
                              <RefreshCw className="h-4 w-4 text-orange-500" />
                            </Button>
                          )}
                          {article.wpPostUrl && (
                            <a href={article.wpPostUrl} target="_blank" rel="noopener noreferrer">
                              <Button variant="ghost" size="icon" title="ดูบนเว็บไซต์">
                                <ExternalLink className="h-4 w-4 text-red-500" />
                              </Button>
                            </a>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteDialog(article.id)}
                            title="ลบ"
                          >
                            <Trash2 className="h-4 w-4 text-red-400 hover:text-red-600" />
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

        {/* Mobile Cards - hidden on desktop */}
        <div className="md:hidden bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Mobile select all header */}
          {articleList.length > 0 && (
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-2 text-sm text-gray-600"
              >
                {isAllSelected ? (
                  <CheckSquare className="h-5 w-5 text-red-600" />
                ) : isSomeSelected ? (
                  <MinusSquare className="h-5 w-5 text-red-600" />
                ) : (
                  <Square className="h-5 w-5 text-gray-400" />
                )}
                Select All
              </button>
              <span className="text-xs text-gray-500">
                {articleList.length} articles
              </span>
            </div>
          )}

          {isLoading ? (
            <div className="px-4 py-12 text-center">
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-red-600 border-t-transparent" />
              </div>
            </div>
          ) : articleList.length === 0 ? (
            <div className="px-4 py-12 text-center text-gray-400">
              No articles found
            </div>
          ) : (
            articleList.map((article: any) => (
              <ArticleCard key={article.id} article={article} />
            ))
          )}
        </div>

        {/* Pagination */}
        {articleList.length > 0 && (
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-sm text-gray-500">
              Showing {articleList.length} article{articleList.length !== 1 ? 's' : ''}
              {articles?.total > articleList.length && ` of ${articles.total}`}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                ก่อนหน้า
              </Button>
              <span className="text-sm text-gray-600 px-2">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                ถัดไป
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Modal
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, isBulk: false, deleteFromWP: false })}
        title={deleteDialog.isBulk ? `ลบบทความ ${selectedIds.size} รายการ` : 'ลบบทความ'}
        size="sm"
      >
        <div className="space-y-4">
          {/* Radio: DB only */}
          <label
            className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
              !deleteDialog.deleteFromWP
                ? 'border-red-500 bg-red-50'
                : 'border-gray-200 hover:bg-gray-50'
            }`}
            onClick={() => setDeleteDialog((prev) => ({ ...prev, deleteFromWP: false }))}
          >
            <input
              type="radio"
              name="deleteMode"
              checked={!deleteDialog.deleteFromWP}
              onChange={() => setDeleteDialog((prev) => ({ ...prev, deleteFromWP: false }))}
              className="mt-0.5"
            />
            <div>
              <p className="font-medium text-gray-900">ลบเฉพาะในระบบ</p>
              <p className="text-sm text-gray-500">บทความบน WordPress ยังคงอยู่</p>
            </div>
          </label>

          {/* Radio: DB + WordPress */}
          <label
            className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
              deleteDialog.deleteFromWP
                ? 'border-red-500 bg-red-50'
                : 'border-gray-200 hover:bg-gray-50'
            }`}
            onClick={() => setDeleteDialog((prev) => ({ ...prev, deleteFromWP: true }))}
          >
            <input
              type="radio"
              name="deleteMode"
              checked={deleteDialog.deleteFromWP}
              onChange={() => setDeleteDialog((prev) => ({ ...prev, deleteFromWP: true }))}
              className="mt-0.5"
            />
            <div>
              <p className="font-medium text-gray-900">ลบทั้งในระบบและ WordPress</p>
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" />
                บทความจะถูกลบถาวรจาก WordPress
              </p>
            </div>
          </label>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ isOpen: false, isBulk: false, deleteFromWP: false })}
            >
              ยกเลิก
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending || bulkDeleteMutation.isPending}
            >
              {(deleteMutation.isPending || bulkDeleteMutation.isPending) ? 'กำลังลบ...' : 'ลบ'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
