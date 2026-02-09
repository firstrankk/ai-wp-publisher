'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DOMPurify from 'dompurify';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Sparkles,
  Send,
  RefreshCw,
  ExternalLink,
  Trash2,
  Globe,
  Calendar,
  FileText,
  ChevronDown,
  AlertTriangle,
  ImageIcon,
  Pencil,
  RotateCcw,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { articlesApi } from '@/lib/api';
import {
  formatDate,
  STATUS_LABELS,
  TONE_LABELS,
  LENGTH_LABELS,
} from '@/lib/utils';

interface EditForm {
  keyword: string;
  tone: string;
  length: string;
  tags: string[];
  title: string;
  content: string;
}

export default function ArticleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: article, isLoading, error } = useQuery({
    queryKey: ['article', id],
    queryFn: () => articlesApi.get(id).then((res) => res.data),
    enabled: !!id,
  });

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<EditForm>({
    keyword: '',
    tone: '',
    length: '',
    tags: [],
    title: '',
    content: '',
  });
  const [tagInput, setTagInput] = useState('');

  // Regenerate dialog state
  const [regenerateDialog, setRegenerateDialog] = useState(false);

  // Delete dialog state
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    deleteFromWP: boolean;
  }>({ isOpen: false, deleteFromWP: false });

  const startEditing = () => {
    if (!article) return;
    setEditForm({
      keyword: article.keyword || '',
      tone: article.tone || 'FRIENDLY',
      length: article.length || 'MEDIUM',
      tags: article.tags || [],
      title: article.title || '',
      content: article.content || '',
    });
    setTagInput('');
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setTagInput('');
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !editForm.tags.includes(tag)) {
      setEditForm((prev) => ({ ...prev, tags: [...prev.tags, tag] }));
    }
    setTagInput('');
  };

  const removeTag = (tagToRemove: string) => {
    setEditForm((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tagToRemove),
    }));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const generateMutation = useMutation({
    mutationFn: () => articlesApi.generate(id),
    onSuccess: () => {
      toast.success('เริ่มสร้างบทความแล้ว');
      queryClient.invalidateQueries({ queryKey: ['article', id] });
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'สร้างบทความล้มเหลว');
    },
  });

  const regenerateMutation = useMutation({
    mutationFn: () => articlesApi.regenerate(id),
    onSuccess: () => {
      toast.success('เริ่มสร้างบทความใหม่แล้ว');
      queryClient.invalidateQueries({ queryKey: ['article', id] });
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'สร้างบทความใหม่ล้มเหลว');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<EditForm>) => articlesApi.update(id, data),
    onSuccess: () => {
      toast.success('บันทึกการแก้ไขแล้ว');
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['article', id] });
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'บันทึกล้มเหลว');
    },
  });

  const publishMutation = useMutation({
    mutationFn: (status: 'draft' | 'publish') => articlesApi.publish(id, status),
    onSuccess: (_, status) => {
      toast.success(status === 'publish' ? 'เผยแพร่บทความแล้ว!' : 'บันทึกเป็นแบบร่างแล้ว');
      queryClient.invalidateQueries({ queryKey: ['article', id] });
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'เผยแพร่ล้มเหลว');
    },
  });

  const retryMutation = useMutation({
    mutationFn: () => articlesApi.retry(id),
    onSuccess: () => {
      toast.success('กำลังลองใหม่...');
      queryClient.invalidateQueries({ queryKey: ['article', id] });
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'ลองใหม่ล้มเหลว');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (deleteFromWP: boolean) => articlesApi.delete(id, deleteFromWP),
    onSuccess: () => {
      toast.success('ลบบทความแล้ว');
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      router.push('/articles');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'ลบล้มเหลว');
    },
  });

  const handleSave = () => {
    updateMutation.mutate({
      keyword: editForm.keyword,
      tone: editForm.tone,
      length: editForm.length,
      tags: editForm.tags,
      title: editForm.title,
      content: editForm.content,
    });
  };

  // Publish dropdown
  const PublishDropdown = () => {
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

    return (
      <div className="relative" ref={dropdownRef}>
        <Button
          onClick={() => setIsOpen(!isOpen)}
          disabled={publishMutation.isPending}
        >
          <Send className="h-4 w-4 mr-2" />
          เผยแพร่
          <ChevronDown className="h-4 w-4 ml-1" />
        </Button>
        {isOpen && (
          <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10 overflow-hidden">
            <button
              onClick={() => { setIsOpen(false); publishMutation.mutate('publish'); }}
              className="w-full px-4 py-2.5 text-left text-sm font-medium text-green-600 hover:bg-gray-50 transition-colors"
            >
              Publish Now
            </button>
            <button
              onClick={() => { setIsOpen(false); publishMutation.mutate('draft'); }}
              className="w-full px-4 py-2.5 text-left text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Save as Draft
            </button>
          </div>
        )}
      </div>
    );
  };

  const getStatusBadge = (status: string) => {
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
      <Badge variant={colors[status] || 'default'}>
        {STATUS_LABELS[status as keyof typeof STATUS_LABELS] || status}
      </Badge>
    );
  };

  const canRegenerate = article && ['READY', 'PUBLISHED', 'FAILED'].includes(article.status);
  const canEdit = article && !['GENERATING', 'PUBLISHING'].includes(article.status);

  const toneOptions = Object.entries(TONE_LABELS).map(([value, label]) => ({ value, label }));
  const lengthOptions = Object.entries(LENGTH_LABELS).map(([value, label]) => ({ value, label }));

  if (isLoading) {
    return (
      <div>
        <Header
          title="บทความ"
          action={
            <Button variant="outline" onClick={() => router.push('/articles')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              กลับ
            </Button>
          }
        />
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-red-600 border-t-transparent" />
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div>
        <Header
          title="บทความ"
          action={
            <Button variant="outline" onClick={() => router.push('/articles')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              กลับ
            </Button>
          }
        />
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <FileText className="h-12 w-12 mb-4 text-gray-300" />
          <p>ไม่พบบทความ</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header
        title={article.title || article.keyword}
        description={article.title ? article.keyword : undefined}
        action={
          <Button variant="outline" onClick={() => router.push('/articles')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">กลับ</span>
          </Button>
        }
      />

      <div className="p-4 sm:p-6 space-y-6">
        {/* Status + Actions row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {getStatusBadge(article.status)}
            {article.status === 'FAILED' && article.errorMessage && (
              <span className="text-sm text-red-600 flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" />
                {article.errorMessage}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {canEdit && !isEditing && (
              <Button variant="outline" onClick={startEditing}>
                <Pencil className="h-4 w-4 mr-2" />
                แก้ไข
              </Button>
            )}
            {canRegenerate && (
              <Button
                variant="outline"
                onClick={() => setRegenerateDialog(true)}
                disabled={regenerateMutation.isPending}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                {regenerateMutation.isPending ? 'กำลังสร้างใหม่...' : 'สร้างใหม่'}
              </Button>
            )}
            {article.status === 'DRAFT' && (
              <Button
                onClick={() => generateMutation.mutate()}
                disabled={generateMutation.isPending}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {generateMutation.isPending ? 'กำลังสร้าง...' : 'สร้างบทความ'}
              </Button>
            )}
            {article.status === 'READY' && (
              <PublishDropdown />
            )}
            {article.status === 'FAILED' && (
              <Button
                variant="outline"
                onClick={() => retryMutation.mutate()}
                disabled={retryMutation.isPending}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {retryMutation.isPending ? 'กำลังลอง...' : 'ลองใหม่'}
              </Button>
            )}
            {article.wpPostUrl && (
              <a href={article.wpPostUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  ดูบน WordPress
                </Button>
              </a>
            )}
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ isOpen: true, deleteFromWP: false })}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              ลบ
            </Button>
          </div>
        </div>

        {/* Info card - View / Edit mode */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>ข้อมูลบทความ</CardTitle>
              {isEditing && (
                <span className="text-sm text-red-600 font-medium">กำลังแก้ไข</span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              /* ===== Edit Mode ===== */
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Keyword</label>
                    <Input
                      value={editForm.keyword}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, keyword: e.target.value }))}
                      placeholder="Keyword"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">เว็บไซต์</label>
                    <p className="mt-1 text-gray-900 flex items-center gap-1 h-11 px-1">
                      <Globe className="h-4 w-4 text-gray-400" />
                      {article.site?.name || '-'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">โทน</label>
                    <Select
                      options={toneOptions}
                      value={editForm.tone}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, tone: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">ความยาว</label>
                    <Select
                      options={lengthOptions}
                      value={editForm.length}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, length: e.target.value }))}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-500 mb-1">Tags</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {editForm.tags.map((tag) => (
                        <Badge key={tag} variant="info">
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-1.5 hover:text-red-600 transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleTagKeyDown}
                        placeholder="พิมพ์แล้วกด Enter เพื่อเพิ่ม tag"
                      />
                      <Button type="button" variant="outline" onClick={addTag} disabled={!tagInput.trim()}>
                        เพิ่ม
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Editable title */}
                {(article.title || article.status !== 'DRAFT') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">หัวข้อบทความ</label>
                    <Input
                      value={editForm.title}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="หัวข้อบทความ"
                    />
                  </div>
                )}

                {/* Editable content */}
                {(article.content || article.status !== 'DRAFT') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">เนื้อหาบทความ (HTML)</label>
                    <textarea
                      value={editForm.content}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, content: e.target.value }))}
                      placeholder="เนื้อหาบทความ..."
                      rows={12}
                      className="flex w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all duration-200 font-mono"
                      style={{
                        backgroundColor: '#ffffff',
                        color: '#1f2937',
                        borderColor: '#e5e7eb',
                      }}
                    />
                  </div>
                )}

                {/* Save / Cancel buttons */}
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={cancelEditing} disabled={updateMutation.isPending}>
                    ยกเลิก
                  </Button>
                  <Button onClick={handleSave} disabled={updateMutation.isPending || !editForm.keyword.trim()}>
                    {updateMutation.isPending ? 'กำลังบันทึก...' : 'บันทึก'}
                  </Button>
                </div>
              </div>
            ) : (
              /* ===== View Mode ===== */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Keyword</p>
                  <p className="mt-1 text-gray-900">{article.keyword}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">เว็บไซต์</p>
                  <p className="mt-1 text-gray-900 flex items-center gap-1">
                    <Globe className="h-4 w-4 text-gray-400" />
                    {article.site?.name || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">โทน</p>
                  <p className="mt-1 text-gray-900">
                    {TONE_LABELS[article.tone as keyof typeof TONE_LABELS] || article.tone}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">ความยาว</p>
                  <p className="mt-1 text-gray-900">
                    {LENGTH_LABELS[article.length as keyof typeof LENGTH_LABELS] || article.length}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">วันที่สร้าง</p>
                  <p className="mt-1 text-gray-900 flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    {formatDate(article.createdAt)}
                  </p>
                </div>
                {article.publishedAt && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">วันที่เผยแพร่</p>
                    <p className="mt-1 text-gray-900 flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      {formatDate(article.publishedAt)}
                    </p>
                  </div>
                )}
                {article.scheduledAt && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">ตั้งเวลาเผยแพร่</p>
                    <p className="mt-1 text-gray-900 flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      {formatDate(article.scheduledAt)}
                    </p>
                  </div>
                )}
                {article.tags && article.tags.length > 0 && (
                  <div className="sm:col-span-2 lg:col-span-3">
                    <p className="text-sm font-medium text-gray-500">Tags</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {article.tags.map((tag: string) => (
                        <Badge key={tag} variant="info">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Featured Image */}
        {!isEditing && article.featuredImage && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                ภาพปก
              </CardTitle>
            </CardHeader>
            <CardContent>
              <img
                src={article.featuredImage.startsWith('data:') ? article.featuredImage : `data:image/png;base64,${article.featuredImage}`}
                alt={article.title || 'Featured image'}
                className="max-w-full sm:max-w-lg rounded-lg border border-gray-200"
              />
            </CardContent>
          </Card>
        )}

        {/* Content preview */}
        {!isEditing && article.content && (
          <Card>
            <CardHeader>
              <CardTitle>เนื้อหาบทความ</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-red-600"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(article.content) }}
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Regenerate Confirmation Dialog */}
      <Modal
        isOpen={regenerateDialog}
        onClose={() => setRegenerateDialog(false)}
        title="สร้างบทความใหม่"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
            <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-gray-900">เนื้อหาเดิมจะถูกเขียนทับ</p>
              <p className="text-sm text-gray-600 mt-1">
                ระบบจะสร้างบทความใหม่จาก keyword และค่าที่ตั้งไว้ เนื้อหาเดิมทั้งหมดจะหายไป
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setRegenerateDialog(false)}>
              ยกเลิก
            </Button>
            <Button
              onClick={() => {
                regenerateMutation.mutate();
                setRegenerateDialog(false);
              }}
              disabled={regenerateMutation.isPending}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              ยืนยัน สร้างใหม่
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <Modal
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, deleteFromWP: false })}
        title="ลบบทความ"
        size="sm"
      >
        <div className="space-y-4">
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

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ isOpen: false, deleteFromWP: false })}
            >
              ยกเลิก
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                deleteMutation.mutate(deleteDialog.deleteFromWP);
                setDeleteDialog({ isOpen: false, deleteFromWP: false });
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'กำลังลบ...' : 'ลบ'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
