'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Plus,
  Search,
  FileText,
  ExternalLink,
  RefreshCw,
  Trash2,
  Sparkles,
  Send,
  ChevronDown,
  CheckSquare,
  Square,
  MinusSquare,
  MoreVertical,
  Globe,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { articlesApi, sitesApi } from '@/lib/api';
import { formatDate, STATUS_LABELS, TONE_LABELS } from '@/lib/utils';

export default function ArticlesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [siteFilter, setSiteFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Delete confirmation dialog state
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    articleId?: string;
    isBulk: boolean;
  }>({ isOpen: false, isBulk: false });

  const { data: articles, isLoading } = useQuery({
    queryKey: ['articles', search, statusFilter, siteFilter],
    queryFn: () =>
      articlesApi
        .list({ search, status: statusFilter || undefined, siteId: siteFilter || undefined, limit: 50 })
        .then((res) => res.data),
  });

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
      toast.success(variables.status === 'publish' ? 'Article published!' : 'Article saved as draft');
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Publish failed');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => articlesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      for (const id of ids) {
        await articlesApi.delete(id);
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
    setDeleteDialog({ isOpen: true, isBulk: true });
  };

  const handleDeleteConfirm = () => {
    if (deleteDialog.isBulk) {
      bulkDeleteMutation.mutate(Array.from(selectedIds));
    } else if (deleteDialog.articleId) {
      deleteMutation.mutate(deleteDialog.articleId);
    }
    setDeleteDialog({ isOpen: false, isBulk: false });
  };

  const openDeleteDialog = (articleId: string) => {
    setDeleteDialog({ isOpen: true, articleId, isBulk: false });
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
          title="Publish"
          className="flex items-center"
        >
          <Send className="h-4 w-4" />
          <ChevronDown className="h-3 w-3 ml-0.5" />
        </Button>
        {isOpen && (
          <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10 overflow-hidden">
            <button
              onClick={() => handlePublish('publish')}
              className="w-full px-4 py-2.5 text-left text-sm font-medium text-green-600 hover:bg-gray-50 transition-colors"
            >
              Publish Now
            </button>
            <button
              onClick={() => handlePublish('draft')}
              className="w-full px-4 py-2.5 text-left text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Save as Draft
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
          <span className="text-xs text-blue-600">
            {formatDate(scheduledAt)}
          </span>
        )}
      </div>
    );
  };

  // Mobile card component
  const ArticleCard = ({ article }: { article: any }) => (
    <div
      className={`p-4 border-b border-gray-100 last:border-b-0 ${
        selectedIds.has(article.id) ? 'bg-blue-50' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={() => toggleSelect(article.id)}
          className="mt-1 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
        >
          {selectedIds.has(article.id) ? (
            <CheckSquare className="h-5 w-5 text-blue-600" />
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

          <div className="flex items-center gap-1 mt-3">
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
                  <ExternalLink className="h-3 w-3 mr-1 text-blue-500" />
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
          <Link href="/dashboard/articles/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">New Article</span>
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
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 w-full"
            />
          </div>

          {/* Filters row */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-full sm:w-auto">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: '', label: 'All Status' },
                  { value: 'DRAFT', label: 'Draft' },
                  { value: 'GENERATING', label: 'Generating' },
                  { value: 'READY', label: 'Ready' },
                  { value: 'PUBLISHING', label: 'Publishing' },
                  { value: 'PUBLISHED', label: 'Published' },
                  { value: 'SCHEDULED', label: 'Scheduled' },
                  { value: 'FAILED', label: 'Failed' },
                ]}
                className="w-full sm:w-36"
              />
            </div>
            <div className="w-full sm:w-auto">
              <Select
                value={siteFilter}
                onChange={(e) => setSiteFilter(e.target.value)}
                options={[
                  { value: '', label: 'All Sites' },
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
                        <CheckSquare className="h-5 w-5 text-blue-600" />
                      ) : isSomeSelected ? (
                        <MinusSquare className="h-5 w-5 text-blue-600" />
                      ) : (
                        <Square className="h-5 w-5" />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Article
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Site
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Tone
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent" />
                      </div>
                    </td>
                  </tr>
                ) : articleList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                      No articles found
                    </td>
                  </tr>
                ) : (
                  articleList.map((article: any) => (
                    <tr
                      key={article.id}
                      className={`hover:bg-gray-50 transition-colors ${selectedIds.has(article.id) ? 'bg-blue-50' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleSelect(article.id)}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {selectedIds.has(article.id) ? (
                            <CheckSquare className="h-5 w-5 text-blue-600" />
                          ) : (
                            <Square className="h-5 w-5" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 h-9 w-9 flex items-center justify-center rounded-lg bg-blue-50 border border-blue-100">
                            <FileText className="h-4 w-4 text-blue-600" />
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
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          {article.status === 'DRAFT' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => generateMutation.mutate(article.id)}
                              disabled={generateMutation.isPending}
                              title="Generate"
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
                              title="Retry"
                            >
                              <RefreshCw className="h-4 w-4 text-orange-500" />
                            </Button>
                          )}
                          {article.wpPostUrl && (
                            <a href={article.wpPostUrl} target="_blank" rel="noopener noreferrer">
                              <Button variant="ghost" size="icon" title="View on site">
                                <ExternalLink className="h-4 w-4 text-blue-500" />
                              </Button>
                            </a>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteDialog(article.id)}
                            title="Delete"
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
                  <CheckSquare className="h-5 w-5 text-blue-600" />
                ) : isSomeSelected ? (
                  <MinusSquare className="h-5 w-5 text-blue-600" />
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
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent" />
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

        {/* Footer info */}
        {articleList.length > 0 && (
          <div className="mt-3 text-sm text-gray-500 hidden md:block">
            Showing {articleList.length} article{articleList.length !== 1 ? 's' : ''}
            {articles?.total > articleList.length && ` of ${articles.total}`}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, isBulk: false })}
        onConfirm={handleDeleteConfirm}
        title={deleteDialog.isBulk ? 'ลบบทความที่เลือก' : 'ลบบทความ'}
        message={
          deleteDialog.isBulk
            ? `คุณต้องการลบบทความที่เลือกทั้ง ${selectedIds.size} รายการหรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้`
            : 'คุณต้องการลบบทความนี้หรือไม่? หากโพสต์ไปแล้วจะถูกลบจาก WordPress ด้วย'
        }
        confirmText="ลบ"
        cancelText="ยกเลิก"
        variant="danger"
        isLoading={deleteMutation.isPending || bulkDeleteMutation.isPending}
      />
    </div>
  );
}
