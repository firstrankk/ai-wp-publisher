'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Zap,
  Plus,
  X,
  Calendar,
  Clock,
  Link2,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  FileStack,
  Image as ImageIcon
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { sitesApi, articlesApi } from '@/lib/api';
import { TONE_LABELS, LENGTH_LABELS } from '@/lib/utils';

type ScheduleMode = 'immediate' | 'auto' | 'manual';
type IntervalUnit = 'minutes' | 'hours' | 'days';

interface ArticleItem {
  keyword: string;
  status: 'pending' | 'creating' | 'generating' | 'scheduling' | 'done' | 'error';
  error?: string;
  scheduledAt?: Date;
  articleId?: string;
  wpPostUrl?: string;
}

interface SEOLink {
  keyword: string;
  url: string;
  maxCount: number;
}

// Image background presets
const SOLID_PRESETS = [
  { id: 'modern', name: 'Modern', bg: '#1a1a2e', text: '#ffffff' },
  { id: 'classic', name: 'Classic', bg: '#2c3e50', text: '#ecf0f1' },
  { id: 'vibrant', name: 'Vibrant', bg: '#e74c3c', text: '#ffffff' },
  { id: 'minimal', name: 'Minimal', bg: '#ffffff', text: '#2c3e50' },
];

const GRADIENT_PRESETS = [
  { id: 'sunset', name: 'Sunset', gradient: { type: 'linear' as const, colors: ['#f093fb', '#f5576c'], angle: 135 }, text: '#ffffff' },
  { id: 'ocean', name: 'Ocean', gradient: { type: 'linear' as const, colors: ['#4facfe', '#00f2fe'], angle: 135 }, text: '#ffffff' },
  { id: 'forest', name: 'Forest', gradient: { type: 'linear' as const, colors: ['#11998e', '#38ef7d'], angle: 135 }, text: '#ffffff' },
  { id: 'purple', name: 'Purple', gradient: { type: 'linear' as const, colors: ['#667eea', '#764ba2'], angle: 135 }, text: '#ffffff' },
  { id: 'fire', name: 'Fire', gradient: { type: 'linear' as const, colors: ['#f12711', '#f5af19'], angle: 135 }, text: '#ffffff' },
  { id: 'night', name: 'Night', gradient: { type: 'linear' as const, colors: ['#0f0c29', '#302b63', '#24243e'], angle: 135 }, text: '#ffffff' },
  { id: 'candy', name: 'Candy', gradient: { type: 'linear' as const, colors: ['#ff6a88', '#ff99ac'], angle: 135 }, text: '#ffffff' },
  { id: 'mint', name: 'Mint', gradient: { type: 'linear' as const, colors: ['#00b09b', '#96c93d'], angle: 135 }, text: '#ffffff' },
  { id: 'royal', name: 'Royal', gradient: { type: 'linear' as const, colors: ['#141e30', '#243b55'], angle: 135 }, text: '#ffffff' },
  { id: 'peach', name: 'Peach', gradient: { type: 'linear' as const, colors: ['#ed6ea0', '#ec8c69'], angle: 135 }, text: '#ffffff' },
  { id: 'aurora', name: 'Aurora', gradient: { type: 'linear' as const, colors: ['#00c6ff', '#0072ff'], angle: 135 }, text: '#ffffff' },
  { id: 'berry', name: 'Berry', gradient: { type: 'linear' as const, colors: ['#8e2de2', '#4a00e0'], angle: 135 }, text: '#ffffff' },
  { id: 'mojito', name: 'Mojito', gradient: { type: 'linear' as const, colors: ['#1d976c', '#93f9b9'], angle: 135 }, text: '#ffffff' },
  { id: 'rose', name: 'Rose', gradient: { type: 'linear' as const, colors: ['#f953c6', '#b91d73'], angle: 135 }, text: '#ffffff' },
  { id: 'golden', name: 'Golden', gradient: { type: 'linear' as const, colors: ['#f7971e', '#ffd200'], angle: 135 }, text: '#1a1a2e' },
  { id: 'cosmic', name: 'Cosmic', gradient: { type: 'linear' as const, colors: ['#ff00cc', '#333399'], angle: 135 }, text: '#ffffff' },
  { id: 'reef', name: 'Reef', gradient: { type: 'linear' as const, colors: ['#00d2ff', '#3a7bd5'], angle: 135 }, text: '#ffffff' },
  { id: 'lemon', name: 'Lemon', gradient: { type: 'linear' as const, colors: ['#f7ff00', '#db36a4'], angle: 135 }, text: '#1a1a2e' },
];

const TEXT_COLOR_PRESETS = [
  { id: 'white', name: 'ขาว', color: '#ffffff' },
  { id: 'black', name: 'ดำ', color: '#000000' },
  { id: 'yellow', name: 'เหลือง', color: '#fbbf24' },
  { id: 'cyan', name: 'ฟ้า', color: '#22d3ee' },
  { id: 'pink', name: 'ชมพู', color: '#f472b6' },
  { id: 'lime', name: 'เขียว', color: '#a3e635' },
];

type PresetType = {
  id: string;
  name: string;
  bg?: string;
  text: string;
  gradient?: { type: 'linear' | 'radial'; colors: string[]; angle?: number };
};

export default function BulkCreatePage() {

  // Form state
  const [siteId, setSiteId] = useState('');
  const [tone, setTone] = useState('FRIENDLY');
  const [length, setLength] = useState('MEDIUM');
  const [keywordsText, setKeywordsText] = useState('');

  // Tags state
  const [tagMode, setTagMode] = useState<'ai' | 'manual' | 'none'>('ai');
  const [manualTags, setManualTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Categories state
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // SEO Links state
  const [seoLinks, setSeoLinks] = useState<SEOLink[]>([]);
  const [linkKeyword, setLinkKeyword] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkMaxCount, setLinkMaxCount] = useState(3);
  const [suggestedLinkMaxCount, setSuggestedLinkMaxCount] = useState(3);

  // Schedule state
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>('immediate');
  const [firstArticleNow, setFirstArticleNow] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [interval, setInterval] = useState(2);
  const [intervalUnit, setIntervalUnit] = useState<IntervalUnit>('hours');

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [showPreview, setShowPreview] = useState(true);

  // Image settings state
  const [generateImage, setGenerateImage] = useState(true);
  const [backgroundType, setBackgroundType] = useState<'solid' | 'gradient' | 'custom'>('solid');
  const [selectedPreset, setSelectedPreset] = useState<PresetType>(SOLID_PRESETS[0]);
  const [textColor, setTextColor] = useState('#ffffff');
  const [customBgImage, setCustomBgImage] = useState<string | null>(null);

  // Fetch sites
  const { data: sites } = useQuery({
    queryKey: ['sites-list'],
    queryFn: () => sitesApi.list({ limit: 100 }).then((res) => res.data),
  });

  // Fetch categories when site is selected
  const { data: siteCategories } = useQuery({
    queryKey: ['site-categories', siteId],
    queryFn: () => sitesApi.getCategories(siteId).then((res) => res.data),
    enabled: !!siteId,
  });

  // Parse keywords from text
  const keywords = useMemo(() => {
    return keywordsText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
  }, [keywordsText]);

  // Calculate scheduled times
  const scheduledTimes = useMemo(() => {
    if (keywords.length === 0) return [];

    const times: (Date | null)[] = [];
    let baseTime: Date;

    if (scheduleMode === 'immediate') {
      return keywords.map(() => null); // null means immediate
    }

    if (scheduleMode === 'auto') {
      if (firstArticleNow) {
        baseTime = new Date();
      } else if (startDate && startTime) {
        baseTime = new Date(`${startDate}T${startTime}`);
      } else {
        baseTime = new Date();
      }

      const intervalMs = interval * (
        intervalUnit === 'minutes' ? 60 * 1000 :
        intervalUnit === 'hours' ? 60 * 60 * 1000 :
        24 * 60 * 60 * 1000
      );

      for (let i = 0; i < keywords.length; i++) {
        if (i === 0 && firstArticleNow) {
          times.push(null); // immediate
        } else {
          const offset = firstArticleNow ? i : i + 1;
          times.push(new Date(baseTime.getTime() + (offset - (firstArticleNow ? 1 : 0)) * intervalMs));
        }
      }
    }

    return times;
  }, [keywords, scheduleMode, firstArticleNow, startDate, startTime, interval, intervalUnit]);

  // Add manual tag
  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !manualTags.includes(tag)) {
      setManualTags([...manualTags, tag]);
      setTagInput('');
    }
  };

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomBgImage(reader.result as string);
        setBackgroundType('custom');
      };
      reader.readAsDataURL(file);
    }
  };

  // Add SEO link
  const handleAddSeoLink = () => {
    const keyword = linkKeyword.trim();
    const url = linkUrl.trim();
    if (keyword && url) {
      if (!seoLinks.some(l => l.keyword.toLowerCase() === keyword.toLowerCase())) {
        setSeoLinks([...seoLinks, { keyword, url, maxCount: linkMaxCount }]);
        setLinkKeyword('');
        setLinkUrl('');
        setLinkMaxCount(3);
      }
    }
  };

  // Format date for display
  const formatScheduleTime = (date: Date | null) => {
    if (!date) return 'โพสทันที';
    return date.toLocaleString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Start processing
  const handleStart = async () => {
    if (!siteId) {
      toast.error('กรุณาเลือกเว็บไซต์');
      return;
    }
    if (keywords.length === 0) {
      toast.error('กรุณาใส่ Keyword อย่างน้อย 1 รายการ');
      return;
    }

    setIsProcessing(true);

    // Initialize article items
    const initialArticles: ArticleItem[] = keywords.map((keyword, index) => ({
      keyword,
      status: 'pending',
      scheduledAt: scheduledTimes[index] || undefined,
    }));
    setArticles(initialArticles);

    // Track success count
    let successCount = 0;
    const totalCount = initialArticles.length;

    // Process each article sequentially
    for (let i = 0; i < initialArticles.length; i++) {
      const article = initialArticles[i];

      try {
        // Update status to creating
        setArticles(prev => prev.map((a, idx) =>
          idx === i ? { ...a, status: 'creating' } : a
        ));

        // Create article
        const createRes = await articlesApi.create({
          keyword: article.keyword,
          siteId,
          tone,
          length,
          tags: tagMode === 'manual' ? manualTags : [],
          categories: selectedCategories,
          generateTags: tagMode === 'ai',
          seoLinks: seoLinks.length > 0 ? seoLinks : undefined,
        });

        const articleId = createRes.data.id;

        // Update status to generating
        setArticles(prev => prev.map((a, idx) =>
          idx === i ? { ...a, status: 'generating', articleId } : a
        ));

        // Generate article
        await articlesApi.generate(articleId);

        // Generate featured image if enabled
        if (generateImage) {
          const imageOptions: any = {
            textColor: textColor,
          };

          if (backgroundType === 'custom' && customBgImage) {
            imageOptions.backgroundImage = customBgImage;
          } else if (backgroundType === 'gradient' && selectedPreset.gradient) {
            imageOptions.gradient = selectedPreset.gradient;
          } else {
            imageOptions.backgroundColor = selectedPreset.bg;
          }

          await articlesApi.generateImage(articleId, imageOptions);
        }

        // Update status to scheduling/publishing
        setArticles(prev => prev.map((a, idx) =>
          idx === i ? { ...a, status: 'scheduling' } : a
        ));

        // Publish or schedule
        let wpPostUrl: string | undefined;
        console.log('Article scheduledAt:', article.scheduledAt);
        console.log('Schedule mode:', scheduleMode);
        console.log('First article now:', firstArticleNow);
        if (!article.scheduledAt) {
          // Publish immediately
          console.log('Publishing immediately...');
          const publishRes = await articlesApi.publish(articleId, 'publish');
          wpPostUrl = publishRes.data?.wpPostUrl;
        } else {
          // Schedule for later - publish to WordPress with 'future' status
          console.log('Scheduling for:', article.scheduledAt.toISOString());
          const publishRes = await articlesApi.publish(articleId, 'future', article.scheduledAt.toISOString());
          wpPostUrl = publishRes.data?.wpPostUrl;
        }

        // Mark as done
        setArticles(prev => prev.map((a, idx) =>
          idx === i ? { ...a, status: 'done', wpPostUrl } : a
        ));
        successCount++;

      } catch (error: any) {
        setArticles(prev => prev.map((a, idx) =>
          idx === i ? {
            ...a,
            status: 'error',
            error: error.response?.data?.error || error.message
          } : a
        ));
      }
    }

    setIsProcessing(false);
    toast.success(`สร้างเสร็จแล้ว ${successCount}/${totalCount} บทความ`);
  };

  // Get status icon
  const getStatusIcon = (status: ArticleItem['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" style={{ color: '#9ca3af' }} />;
      case 'creating':
      case 'generating':
      case 'scheduling':
        return <Loader2 className="h-4 w-4 animate-spin" style={{ color: '#2563eb' }} />;
      case 'done':
        return <CheckCircle className="h-4 w-4" style={{ color: '#22c55e' }} />;
      case 'error':
        return <XCircle className="h-4 w-4" style={{ color: '#ef4444' }} />;
    }
  };

  // Get status text
  const getStatusText = (status: ArticleItem['status']) => {
    switch (status) {
      case 'pending': return 'รอคิว';
      case 'creating': return 'กำลังสร้าง...';
      case 'generating': return 'กำลังเขียนบทความ...';
      case 'scheduling': return 'กำลังตั้งเวลา...';
      case 'done': return 'สำเร็จ';
      case 'error': return 'ผิดพลาด';
    }
  };

  return (
    <div>
      <Header
        title="Bulk Create"
        description="สร้างและโพสบทความหลายรายการพร้อมกัน"
      />

      <div className="p-8">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Settings Panel */}
          <div className="space-y-6">
            {/* Basic Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" style={{ color: '#f59e0b' }} />
                  ตั้งค่าพื้นฐาน
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>
                    เว็บไซต์
                  </label>
                  <Select
                    value={siteId}
                    onChange={(e) => setSiteId(e.target.value)}
                    placeholder="เลือกเว็บไซต์"
                    options={(sites?.data || []).map((site: any) => ({
                      value: site.id,
                      label: site.name,
                    }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>
                      โทนเสียง
                    </label>
                    <Select
                      value={tone}
                      onChange={(e) => setTone(e.target.value)}
                      options={Object.entries(TONE_LABELS).map(([value, label]) => ({
                        value,
                        label,
                      }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>
                      ความยาว
                    </label>
                    <Select
                      value={length}
                      onChange={(e) => setLength(e.target.value)}
                      options={Object.entries(LENGTH_LABELS).map(([value, label]) => ({
                        value,
                        label,
                      }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tags & Categories */}
            <Card>
              <CardHeader>
                <CardTitle>Tags & Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                    Tags
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="tagMode"
                        checked={tagMode === 'ai'}
                        onChange={() => setTagMode('ai')}
                        className="text-blue-600"
                      />
                      <span className="text-sm">AI Generate อัตโนมัติ (แนะนำ)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="tagMode"
                        checked={tagMode === 'manual'}
                        onChange={() => setTagMode('manual')}
                        className="text-blue-600"
                      />
                      <span className="text-sm">กำหนดเอง</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="tagMode"
                        checked={tagMode === 'none'}
                        onChange={() => setTagMode('none')}
                        className="text-blue-600"
                      />
                      <span className="text-sm">ไม่ใส่ Tags</span>
                    </label>
                  </div>

                  {tagMode === 'manual' && (
                    <div className="mt-3">
                      <div className="flex gap-2">
                        <Input
                          placeholder="พิมพ์ tag แล้วกด Enter"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddTag();
                            }
                          }}
                        />
                        <Button type="button" variant="outline" onClick={handleAddTag}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      {manualTags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {manualTags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                              style={{ backgroundColor: '#dbeafe', color: '#1e40af' }}
                            >
                              {tag}
                              <button onClick={() => setManualTags(manualTags.filter(t => t !== tag))}>
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Categories */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                    Categories
                  </label>
                  {siteCategories && siteCategories.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {siteCategories.map((cat: any) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            if (selectedCategories.includes(cat.name)) {
                              setSelectedCategories(selectedCategories.filter(c => c !== cat.name));
                            } else {
                              setSelectedCategories([...selectedCategories, cat.name]);
                            }
                          }}
                          className="px-3 py-1.5 text-sm rounded-full border transition-colors"
                          style={{
                            backgroundColor: selectedCategories.includes(cat.name) ? '#dcfce7' : 'transparent',
                            borderColor: selectedCategories.includes(cat.name) ? '#22c55e' : '#d1d5db',
                            color: selectedCategories.includes(cat.name) ? '#166534' : '#4b5563',
                          }}
                        >
                          {selectedCategories.includes(cat.name) ? '✓ ' : ''}{cat.name}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm" style={{ color: '#9ca3af' }}>
                      {siteId ? 'ไม่พบ Categories' : 'เลือก Site ก่อน'}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* SEO Links */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link2 className="h-5 w-5" style={{ color: '#2563eb' }} />
                  SEO Link (ใช้ร่วมกันทุกบทความ)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Suggested SEO Link from selected site */}
                {siteId && (() => {
                  const selectedSite = sites?.data?.find((s: any) => s.id === siteId);
                  if (!selectedSite) return null;
                  const isAlreadyAdded = seoLinks.some(l => l.url === selectedSite.url);
                  if (isAlreadyAdded) return null;
                  return (
                    <div
                      className="p-3 rounded-lg border-2 border-dashed"
                      style={{ borderColor: '#a5b4fc', backgroundColor: '#eef2ff' }}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium mb-1" style={{ color: '#6366f1' }}>
                            แนะนำ
                          </p>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium" style={{ color: '#4338ca' }}>{selectedSite.name}</span>
                            <span style={{ color: '#9ca3af' }}>→</span>
                            <span className="text-xs truncate max-w-[150px]" style={{ color: '#6b7280' }}>{selectedSite.url}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-14">
                            <Input
                              type="number"
                              min={1}
                              max={99}
                              value={suggestedLinkMaxCount}
                              onChange={(e) => setSuggestedLinkMaxCount(parseInt(e.target.value) || 1)}
                              className="text-center text-sm"
                              title="จำนวนครั้ง"
                            />
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => {
                              setSeoLinks([...seoLinks, {
                                keyword: selectedSite.name,
                                url: selectedSite.url,
                                maxCount: suggestedLinkMaxCount
                              }]);
                            }}
                            style={{ backgroundColor: '#6366f1' }}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            เพิ่ม
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                <div className="flex gap-2">
                  <Input
                    placeholder="Keyword"
                    value={linkKeyword}
                    onChange={(e) => setLinkKeyword(e.target.value)}
                    className="flex-1"
                  />
                  <div className="w-16">
                    <Input
                      type="number"
                      min={1}
                      max={99}
                      value={linkMaxCount}
                      onChange={(e) => setLinkMaxCount(parseInt(e.target.value) || 1)}
                      title="จำนวนครั้ง"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="URL"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSeoLink();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddSeoLink}
                    disabled={!linkKeyword.trim() || !linkUrl.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {seoLinks.length > 0 && (
                  <div className="space-y-2 mt-3">
                    {seoLinks.map((link, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 rounded-lg text-sm"
                        style={{ backgroundColor: '#f0f9ff', border: '1px solid #bae6fd' }}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium" style={{ color: '#0369a1' }}>{link.keyword}</span>
                          <span className="px-1.5 py-0.5 rounded text-xs" style={{ backgroundColor: '#dbeafe', color: '#1d4ed8' }}>
                            x{link.maxCount}
                          </span>
                          <span style={{ color: '#9ca3af' }}>→</span>
                          <span className="text-xs truncate max-w-[150px]" style={{ color: '#6b7280' }}>{link.url}</span>
                        </div>
                        <button onClick={() => setSeoLinks(seoLinks.filter((_, i) => i !== index))}>
                          <X className="h-4 w-4" style={{ color: '#ef4444' }} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Schedule */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" style={{ color: '#8b5cf6' }} />
                  ตั้งเวลาโพส
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="scheduleMode"
                      checked={scheduleMode === 'immediate'}
                      onChange={() => setScheduleMode('immediate')}
                      className="text-blue-600"
                    />
                    <span className="text-sm">โพสทั้งหมดทันที</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="scheduleMode"
                      checked={scheduleMode === 'auto'}
                      onChange={() => setScheduleMode('auto')}
                      className="text-blue-600"
                    />
                    <span className="text-sm">ตั้งเวลาอัตโนมัติ (กระจายเวลาเอง)</span>
                  </label>
                </div>

                {scheduleMode === 'auto' && (
                  <div className="space-y-3 pl-6 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={firstArticleNow}
                        onChange={(e) => setFirstArticleNow(e.target.checked)}
                        className="text-blue-600"
                      />
                      <span className="text-sm">บทความแรกโพสทันที</span>
                    </label>

                    {!firstArticleNow && (
                      <div className="flex gap-2">
                        <Input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="flex-1"
                        />
                        <Input
                          type="time"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          className="w-32"
                        />
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <span className="text-sm" style={{ color: '#6b7280' }}>ระยะห่าง:</span>
                      <Input
                        type="number"
                        min={1}
                        value={interval}
                        onChange={(e) => setInterval(parseInt(e.target.value) || 1)}
                        className="w-20"
                      />
                      <Select
                        value={intervalUnit}
                        onChange={(e) => setIntervalUnit(e.target.value as IntervalUnit)}
                        options={[
                          { value: 'minutes', label: 'นาที' },
                          { value: 'hours', label: 'ชั่วโมง' },
                          { value: 'days', label: 'วัน' },
                        ]}
                        className="w-28"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Featured Image Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" style={{ color: '#ec4899' }} />
                  ตั้งค่าภาพหน้าปก
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Enable/Disable */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={generateImage}
                    onChange={(e) => setGenerateImage(e.target.checked)}
                    className="text-blue-600"
                  />
                  <span className="text-sm">สร้างภาพหน้าปกอัตโนมัติ</span>
                </label>

                {generateImage && (
                  <>
                    {/* Background Type Tabs */}
                    <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: '#f3f4f6' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setBackgroundType('solid');
                          setSelectedPreset(SOLID_PRESETS[0]);
                        }}
                        className="flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-all"
                        style={{
                          backgroundColor: backgroundType === 'solid' ? '#2563eb' : 'transparent',
                          color: backgroundType === 'solid' ? '#ffffff' : '#6b7280'
                        }}
                      >
                        สีพื้น
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setBackgroundType('gradient');
                          setSelectedPreset(GRADIENT_PRESETS[0]);
                        }}
                        className="flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-all"
                        style={{
                          backgroundColor: backgroundType === 'gradient' ? '#2563eb' : 'transparent',
                          color: backgroundType === 'gradient' ? '#ffffff' : '#6b7280'
                        }}
                      >
                        ไล่สี
                      </button>
                      <button
                        type="button"
                        onClick={() => setBackgroundType('custom')}
                        className="flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-all"
                        style={{
                          backgroundColor: backgroundType === 'custom' ? '#2563eb' : 'transparent',
                          color: backgroundType === 'custom' ? '#ffffff' : '#6b7280'
                        }}
                      >
                        อัพโหลด
                      </button>
                    </div>

                    {/* Solid Colors */}
                    {backgroundType === 'solid' && (
                      <div className="grid grid-cols-4 gap-2">
                        {SOLID_PRESETS.map((preset) => (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => setSelectedPreset(preset)}
                            className="relative p-3 rounded-xl border-2 transition-all"
                            style={{
                              backgroundColor: preset.bg,
                              borderColor: selectedPreset.id === preset.id ? '#2563eb' : '#e5e7eb',
                              boxShadow: selectedPreset.id === preset.id ? '0 0 0 2px rgba(37, 99, 235, 0.2)' : 'none'
                            }}
                            title={preset.name}
                          >
                            <span className="text-xs font-medium" style={{ color: preset.text }}>
                              {preset.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Gradients */}
                    {backgroundType === 'gradient' && (
                      <div className="grid grid-cols-6 gap-2">
                        {GRADIENT_PRESETS.map((preset) => (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => setSelectedPreset(preset)}
                            className="relative p-3 rounded-xl border-2 transition-all"
                            style={{
                              background: `linear-gradient(${preset.gradient.angle || 135}deg, ${preset.gradient.colors.join(', ')})`,
                              borderColor: selectedPreset.id === preset.id ? '#2563eb' : '#e5e7eb',
                              boxShadow: selectedPreset.id === preset.id ? '0 0 0 2px rgba(37, 99, 235, 0.2)' : 'none'
                            }}
                            title={preset.name}
                          >
                            <span className="text-xs font-medium" style={{ color: preset.text }}>
                              {preset.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Custom Upload */}
                    {backgroundType === 'custom' && (
                      <div>
                        <label className="block cursor-pointer">
                          <div
                            className="relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl transition-all"
                            style={{
                              borderColor: customBgImage ? '#22c55e' : '#d1d5db',
                              backgroundColor: customBgImage ? 'rgba(34, 197, 94, 0.1)' : '#f9fafb'
                            }}
                          >
                            {customBgImage ? (
                              <div className="relative w-full">
                                <img
                                  src={customBgImage}
                                  alt="Background preview"
                                  className="w-full h-24 object-cover rounded-lg"
                                />
                                <p className="mt-2 text-xs text-center" style={{ color: '#22c55e' }}>
                                  คลิกเพื่อเปลี่ยนรูป
                                </p>
                              </div>
                            ) : (
                              <>
                                <ImageIcon className="h-8 w-8 mb-2" style={{ color: '#9ca3af' }} />
                                <p className="text-sm" style={{ color: '#4b5563' }}>คลิกเพื่ออัพโหลดภาพพื้นหลัง</p>
                                <p className="text-xs mt-1" style={{ color: '#6b7280' }}>PNG, JPG ไม่เกิน 5MB</p>
                              </>
                            )}
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                    )}

                    {/* Text Color */}
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                        สีตัวหนังสือ
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {TEXT_COLOR_PRESETS.map((preset) => (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => setTextColor(preset.color)}
                            className="relative w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center"
                            style={{
                              backgroundColor: preset.color,
                              borderColor: textColor === preset.color ? '#2563eb' : '#d1d5db',
                              boxShadow: textColor === preset.color ? '0 0 0 2px rgba(37, 99, 235, 0.3)' : 'none'
                            }}
                            title={preset.name}
                          >
                            {textColor === preset.color && (
                              <span style={{ color: preset.color === '#ffffff' || preset.color === '#fbbf24' || preset.color === '#a3e635' ? '#000' : '#fff' }}>✓</span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Preview */}
                    <div
                      className="p-4 rounded-lg flex items-center justify-center h-20 relative overflow-hidden"
                      style={{
                        background: backgroundType === 'custom' && customBgImage
                          ? 'transparent'
                          : backgroundType === 'gradient' && selectedPreset.gradient
                            ? `linear-gradient(${selectedPreset.gradient.angle || 135}deg, ${selectedPreset.gradient.colors.join(', ')})`
                            : selectedPreset.bg || '#1a1a2e'
                      }}
                    >
                      {backgroundType === 'custom' && customBgImage && (
                        <img
                          src={customBgImage}
                          alt="Background"
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      )}
                      <span className="font-bold text-sm relative z-10" style={{ color: textColor, textShadow: backgroundType === 'custom' ? '0 1px 2px rgba(0,0,0,0.5)' : 'none' }}>
                        ตัวอย่างหน้าปก
                      </span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Keywords Input */}
            <Card>
              <CardHeader>
                <CardTitle>Keywords (1 บรรทัด = 1 บทความ)</CardTitle>
              </CardHeader>
              <CardContent>
                <textarea
                  value={keywordsText}
                  onChange={(e) => setKeywordsText(e.target.value)}
                  placeholder="วิธีลดน้ำหนัก&#10;อาหารคลีน&#10;ออกกำลังกายที่บ้าน"
                  className="w-full h-40 p-3 border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ borderColor: '#d1d5db' }}
                  disabled={isProcessing}
                />
                <p className="text-xs mt-2" style={{ color: '#6b7280' }}>
                  จำนวน: {keywords.length} บทความ
                </p>
              </CardContent>
            </Card>

            {/* Start Button */}
            <Button
              onClick={handleStart}
              disabled={isProcessing || keywords.length === 0 || !siteId}
              className="w-full py-6 text-lg"
              style={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              }}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  กำลังสร้าง...
                </>
              ) : (
                <>
                  <Zap className="h-5 w-5 mr-2" />
                  สร้าง {keywords.length} บทความ
                </>
              )}
            </Button>
          </div>

          {/* Preview Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setShowPreview(!showPreview)}
                >
                  <span>ตัวอย่าง ({keywords.length} บทความ)</span>
                  {showPreview ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </CardTitle>
              </CardHeader>
              {showPreview && (
                <CardContent>
                  {keywords.length === 0 ? (
                    <div className="text-center py-8" style={{ color: '#9ca3af' }}>
                      <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>ใส่ keyword เพื่อดู preview</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[600px] overflow-y-auto">
                      {keywords.map((keyword, index) => {
                        const articleItem = articles[index];
                        const scheduledTime = scheduledTimes[index];

                        return (
                          <div
                            key={index}
                            className="p-4 rounded-lg border"
                            style={{
                              backgroundColor: articleItem?.status === 'error' ? '#fef2f2' :
                                             articleItem?.status === 'done' ? '#f0fdf4' : '#f9fafb',
                              borderColor: articleItem?.status === 'error' ? '#fecaca' :
                                          articleItem?.status === 'done' ? '#bbf7d0' : '#e5e7eb'
                            }}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: '#e5e7eb', color: '#374151' }}>
                                    #{index + 1}
                                  </span>
                                  <span className="font-medium truncate" style={{ color: '#1f2937' }}>
                                    {keyword}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-xs" style={{ color: '#6b7280' }}>
                                  <Calendar className="h-3 w-3" />
                                  <span>{formatScheduleTime(scheduledTime)}</span>
                                </div>
                                {articleItem?.wpPostUrl && (
                                  <a
                                    href={articleItem.wpPostUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-xs mt-1 hover:underline"
                                    style={{ color: '#2563eb' }}
                                  >
                                    <Link2 className="h-3 w-3" />
                                    <span className="truncate max-w-[200px]">{articleItem.wpPostUrl}</span>
                                  </a>
                                )}
                                {articleItem?.error && (
                                  <p className="text-xs mt-1" style={{ color: '#ef4444' }}>
                                    {articleItem.error}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {articleItem ? (
                                  <>
                                    {getStatusIcon(articleItem.status)}
                                    <span className="text-xs" style={{ color: '#6b7280' }}>
                                      {getStatusText(articleItem.status)}
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-xs" style={{ color: '#9ca3af' }}>พร้อมสร้าง</span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>

            {/* Settings Summary */}
            <Card>
              <CardHeader>
                <CardTitle>สรุปการตั้งค่า</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span style={{ color: '#6b7280' }}>เว็บไซต์:</span>
                    <span className="font-medium">{sites?.data?.find((s: any) => s.id === siteId)?.name || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: '#6b7280' }}>โทนเสียง:</span>
                    <span className="font-medium">{TONE_LABELS[tone as keyof typeof TONE_LABELS]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: '#6b7280' }}>ความยาว:</span>
                    <span className="font-medium">{LENGTH_LABELS[length as keyof typeof LENGTH_LABELS]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: '#6b7280' }}>Tags:</span>
                    <span className="font-medium">
                      {tagMode === 'ai' ? 'AI Generate' : tagMode === 'manual' ? `${manualTags.length} tags` : 'ไม่ใส่'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: '#6b7280' }}>Categories:</span>
                    <span className="font-medium">{selectedCategories.length > 0 ? selectedCategories.join(', ') : '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: '#6b7280' }}>SEO Link:</span>
                    <span className="font-medium">{seoLinks.length} links</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: '#6b7280' }}>ตารางโพส:</span>
                    <span className="font-medium">
                      {scheduleMode === 'immediate' ? 'โพสทันที' : `ทุก ${interval} ${intervalUnit === 'hours' ? 'ชม.' : intervalUnit === 'minutes' ? 'นาที' : 'วัน'}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: '#6b7280' }}>ภาพหน้าปก:</span>
                    <span className="font-medium">
                      {generateImage
                        ? backgroundType === 'custom'
                          ? customBgImage ? 'รูปภาพที่อัพโหลด' : 'ยังไม่ได้อัพโหลด'
                          : `${selectedPreset.name} (${backgroundType === 'solid' ? 'สีพื้น' : 'ไล่สี'})`
                        : 'ไม่สร้าง'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
