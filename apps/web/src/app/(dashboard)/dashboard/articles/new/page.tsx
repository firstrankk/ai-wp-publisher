'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DOMPurify from 'dompurify';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { ArrowLeft, Sparkles, Image as ImageIcon, Send, Eye, X, Link2, Plus } from 'lucide-react';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { articlesApi, sitesApi } from '@/lib/api';
import { TONE_LABELS, LENGTH_LABELS, STATUS_LABELS } from '@/lib/utils';

const createArticleSchema = z.object({
  keyword: z.string().min(1, 'Keyword is required'),
  siteId: z.string().min(1, 'Site is required'),
  tone: z.enum(['FRIENDLY', 'FORMAL', 'EDUCATIONAL', 'SALES', 'PROFESSIONAL', 'HUMOROUS', 'INSPIRATIONAL', 'STORYTELLING', 'NEWS', 'REVIEW']),
  length: z.enum(['SHORT', 'MEDIUM', 'LONG']),
});

type CreateArticleForm = z.infer<typeof createArticleSchema>;

// Image background presets - Solid colors
const SOLID_PRESETS = [
  { id: 'modern', name: 'Modern', bg: '#1a1a2e', text: '#ffffff' },
  { id: 'classic', name: 'Classic', bg: '#2c3e50', text: '#ecf0f1' },
  { id: 'vibrant', name: 'Vibrant', bg: '#e74c3c', text: '#ffffff' },
  { id: 'minimal', name: 'Minimal', bg: '#ffffff', text: '#2c3e50' },
];

// Gradient presets
const GRADIENT_PRESETS = [
  { id: 'sunset', name: 'Sunset', gradient: { type: 'linear' as const, colors: ['#f093fb', '#f5576c'], angle: 135 }, text: '#ffffff' },
  { id: 'ocean', name: 'Ocean', gradient: { type: 'linear' as const, colors: ['#4facfe', '#00f2fe'], angle: 135 }, text: '#ffffff' },
  { id: 'forest', name: 'Forest', gradient: { type: 'linear' as const, colors: ['#11998e', '#38ef7d'], angle: 135 }, text: '#ffffff' },
  { id: 'purple', name: 'Purple', gradient: { type: 'linear' as const, colors: ['#667eea', '#764ba2'], angle: 135 }, text: '#ffffff' },
  { id: 'fire', name: 'Fire', gradient: { type: 'linear' as const, colors: ['#f12711', '#f5af19'], angle: 135 }, text: '#ffffff' },
  { id: 'night', name: 'Night', gradient: { type: 'linear' as const, colors: ['#0f0c29', '#302b63', '#24243e'], angle: 135 }, text: '#ffffff' },
  { id: 'candy', name: 'Candy', gradient: { type: 'linear' as const, colors: ['#ff6a88', '#ff99ac'], angle: 135 }, text: '#ffffff' },
  { id: 'aurora', name: 'Aurora', gradient: { type: 'radial' as const, colors: ['#00d2ff', '#3a7bd5', '#6441a5'] }, text: '#ffffff' },
];

type PresetType = {
  id: string;
  name: string;
  bg?: string;
  text: string;
  gradient?: { type: 'linear' | 'radial'; colors: string[]; angle?: number };
};

// Text color presets
const TEXT_COLOR_PRESETS = [
  { id: 'white', name: 'ขาว', color: '#ffffff' },
  { id: 'black', name: 'ดำ', color: '#000000' },
  { id: 'yellow', name: 'เหลือง', color: '#fbbf24' },
  { id: 'cyan', name: 'ฟ้า', color: '#22d3ee' },
  { id: 'pink', name: 'ชมพู', color: '#f472b6' },
  { id: 'lime', name: 'เขียว', color: '#a3e635' },
  { id: 'orange', name: 'ส้ม', color: '#fb923c' },
  { id: 'purple', name: 'ม่วง', color: '#c084fc' },
];

export default function NewArticlePage() {
  const router = useRouter();
  const [article, setArticle] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishStatus, setPublishStatus] = useState<'publish' | 'draft'>('publish');
  const [selectedPreset, setSelectedPreset] = useState<PresetType>(SOLID_PRESETS[0]);
  const [backgroundType, setBackgroundType] = useState<'solid' | 'gradient' | 'custom'>('solid');
  const [customBgImage, setCustomBgImage] = useState<string | null>(null);
  const [textColor, setTextColor] = useState<string>('#ffffff');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [categoryInput, setCategoryInput] = useState('');
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');

  // SEO Link mappings
  const [linkMappings, setLinkMappings] = useState<{ keyword: string; url: string; maxCount: number }[]>([]);
  const [linkKeyword, setLinkKeyword] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkMaxCount, setLinkMaxCount] = useState<number>(1);

  const { data: sites } = useQuery({
    queryKey: ['sites-list'],
    queryFn: () => sitesApi.list({ limit: 100 }).then((res) => res.data),
  });

  // Fetch categories when site is selected
  const { data: siteCategories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['site-categories', selectedSiteId],
    queryFn: () => sitesApi.getCategories(selectedSiteId).then((res) => res.data),
    enabled: !!selectedSiteId,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<CreateArticleForm>({
    resolver: zodResolver(createArticleSchema),
    defaultValues: {
      tone: 'FRIENDLY',
      length: 'MEDIUM',
    },
  });

  // Watch for form values
  const watchedSiteId = watch('siteId');
  const watchedTone = watch('tone');
  const watchedLength = watch('length');

  useEffect(() => {
    if (watchedSiteId && watchedSiteId !== selectedSiteId) {
      setSelectedSiteId(watchedSiteId);
      setCategories([]); // Reset categories when site changes
    }
  }, [watchedSiteId, selectedSiteId]);

  const onSubmit = async (data: CreateArticleForm) => {
    setIsGenerating(true);
    try {
      // Step 1: Create draft
      const createRes = await articlesApi.create({ ...data, tags, categories } as any);
      setArticle(createRes.data);
      toast.success('Draft created, generating article...');

      // Step 2: Auto-generate content
      const generateRes = await articlesApi.generate(createRes.data.id);
      setArticle(generateRes.data);
      toast.success('Article generated!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create article');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleAddCategory = () => {
    const trimmedCategory = categoryInput.trim();
    if (trimmedCategory && !categories.includes(trimmedCategory)) {
      setCategories([...categories, trimmedCategory]);
      setCategoryInput('');
    }
  };

  const handleSelectCategory = (categoryName: string) => {
    if (!categories.includes(categoryName)) {
      setCategories([...categories, categoryName]);
    }
  };

  const handleRemoveCategory = (categoryToRemove: string) => {
    setCategories(categories.filter(cat => cat !== categoryToRemove));
  };

  const handleCategoryKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCategory();
    }
  };

  // Link mapping handlers
  const handleAddLinkMapping = () => {
    const keyword = linkKeyword.trim();
    const url = linkUrl.trim();
    const maxCount = Math.max(1, linkMaxCount);
    if (keyword && url) {
      // Check if keyword already exists
      if (!linkMappings.some(m => m.keyword.toLowerCase() === keyword.toLowerCase())) {
        setLinkMappings([...linkMappings, { keyword, url, maxCount }]);
        setLinkKeyword('');
        setLinkUrl('');
        setLinkMaxCount(1);
      } else {
        toast.error('Keyword นี้มีอยู่แล้ว');
      }
    }
  };

  const handleRemoveLinkMapping = (keyword: string) => {
    setLinkMappings(linkMappings.filter(m => m.keyword !== keyword));
  };

  // Apply links to content (randomly distributed, skip headings)
  const applyLinksToContent = (content: string): string => {
    if (!content || linkMappings.length === 0) return content || '';

    let result = content;

    for (const mapping of linkMappings) {
      const escapedKeyword = mapping.keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escapedKeyword, 'gi');

      // Find all valid match positions (not in headings, not in links)
      const validPositions: { index: number; match: string }[] = [];
      let match;
      const tempRegex = new RegExp(escapedKeyword, 'gi');

      while ((match = tempRegex.exec(content)) !== null) {
        const beforeMatch = content.substring(0, match.index);

        // Check if inside heading tag (H1-H6)
        const headingPatterns = ['<h1', '<h2', '<h3', '<h4', '<h5', '<h6'];
        const closingPatterns = ['</h1>', '</h2>', '</h3>', '</h4>', '</h5>', '</h6>'];
        let insideHeading = false;

        for (let i = 0; i < headingPatterns.length; i++) {
          const lastOpenH = beforeMatch.lastIndexOf(headingPatterns[i]);
          const lastCloseH = beforeMatch.lastIndexOf(closingPatterns[i]);
          if (lastOpenH > lastCloseH) {
            insideHeading = true;
            break;
          }
        }

        // Check if inside anchor tag
        const lastOpenA = beforeMatch.lastIndexOf('<a ');
        const lastCloseA = beforeMatch.lastIndexOf('</a>');
        const insideAnchor = lastOpenA > lastCloseA;

        if (!insideHeading && !insideAnchor) {
          validPositions.push({ index: match.index, match: match[0] });
        }
      }

      if (validPositions.length === 0) continue;

      // Randomly select positions to link (up to maxCount)
      const numToLink = Math.min(mapping.maxCount, validPositions.length);
      const shuffled = [...validPositions].sort(() => Math.random() - 0.5);
      const selectedPositions = shuffled.slice(0, numToLink).sort((a, b) => b.index - a.index); // Sort descending for replacement

      // Replace from end to start to preserve indices
      for (const pos of selectedPositions) {
        const before = result.substring(0, pos.index);
        const after = result.substring(pos.index + pos.match.length);
        const linkedText = `<a href="${mapping.url}" target="_blank" rel="noopener" style="color:#2563eb;text-decoration:underline;">${pos.match}</a>`;
        result = before + linkedText + after;
      }
    }

    return result;
  };

  // Add heading badges for preview
  const addHeadingBadges = (content: string): string => {
    if (!content) return '';

    const headingStyles: Record<string, { badge: string; color: string }> = {
      h1: { badge: 'H1', color: '#1d4ed8' },
      h2: { badge: 'H2', color: '#059669' },
      h3: { badge: 'H3', color: '#7c3aed' },
      h4: { badge: 'H4', color: '#ea580c' },
    };

    let result = content;

    for (const [tag, style] of Object.entries(headingStyles)) {
      const regex = new RegExp(`<${tag}([^>]*)>`, 'gi');
      result = result.replace(regex, (match, attrs) => {
        const badge = `<span style="display:inline-block;background-color:${style.color};color:white;font-size:10px;font-weight:600;padding:2px 6px;border-radius:4px;margin-right:8px;vertical-align:middle;">${style.badge}</span>`;
        return `<${tag}${attrs}>${badge}`;
      });
    }

    return result;
  };

  // Process content for preview (add badges + apply links)
  const processContentForPreview = (content: string): string => {
    if (!content) return '';
    const withLinks = applyLinksToContent(content);
    const withBadges = addHeadingBadges(withLinks);
    return withBadges;
  };

  const handleGenerate = async () => {
    if (!article) return;
    setIsGenerating(true);
    try {
      const res = await articlesApi.generate(article.id);
      setArticle(res.data);
      toast.success('Article generated!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!article) return;
    setIsGeneratingImage(true);
    try {
      const options: any = {
        textColor: textColor,
      };

      if (backgroundType === 'custom' && customBgImage) {
        options.backgroundImage = customBgImage;
      } else if (backgroundType === 'gradient' && selectedPreset.gradient) {
        options.gradient = selectedPreset.gradient;
      } else {
        options.backgroundColor = selectedPreset.bg;
      }

      const res = await articlesApi.generateImage(article.id, options);
      setArticle({ ...article, featuredImage: res.data.featuredImage });
      toast.success('Image generated!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Image generation failed');
    } finally {
      setIsGeneratingImage(false);
    }
  };

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

  const handlePublish = async (status: 'publish' | 'draft') => {
    if (!article) return;
    setPublishStatus(status);
    setIsPublishing(true);
    try {
      // Apply SEO links to content if there are link mappings
      if (linkMappings.length > 0 && article.content) {
        const linkedContent = applyLinksToContent(article.content);
        await articlesApi.update(article.id, { content: linkedContent });
        setArticle({ ...article, content: linkedContent });
      }

      const res = await articlesApi.publish(article.id, status);
      setArticle(res.data);
      toast.success(status === 'publish' ? 'Article published!' : 'Article saved as draft!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Publish failed');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div>
      <Header
        title="สร้างบทความใหม่"
        description="สร้างและเผยแพร่บทความด้วย AI"
        action={
          <Link href="/dashboard/articles">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              กลับ
            </Button>
          </Link>
        }
      />

      <div className="p-8">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Form / Settings */}
          <Card>
            <CardHeader>
              <CardTitle>ตั้งค่าบทความ</CardTitle>
            </CardHeader>
            <CardContent>
              {!article ? (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>
                      Keyword / หัวข้อ
                    </label>
                    <Input
                      placeholder="e.g., วิธีดูแลสุขภาพในหน้าหนาว"
                      {...register('keyword')}
                      error={errors.keyword?.message}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>
                      เว็บไซต์เป้าหมาย
                    </label>
                    <Select
                      {...register('siteId')}
                      placeholder="เลือกเว็บไซต์"
                      options={
                        (sites?.data || sites || []).map((site: any) => ({
                          value: site.id,
                          label: site.name,
                        }))
                      }
                      error={errors.siteId?.message}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>
                      โทนเสียง
                    </label>
                    <Select
                      {...register('tone')}
                      value={watchedTone}
                      options={Object.entries(TONE_LABELS).map(([value, label]) => ({
                        value,
                        label,
                      }))}
                      error={errors.tone?.message}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>
                      ความยาว
                    </label>
                    <Select
                      {...register('length')}
                      value={watchedLength}
                      options={Object.entries(LENGTH_LABELS).map(([value, label]) => ({
                        value,
                        label,
                      }))}
                      error={errors.length?.message}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>
                      Tags
                    </label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="พิมพ์แท็กแล้วกด Enter"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleTagKeyDown}
                      />
                      <Button type="button" variant="outline" onClick={handleAddTag}>
                        Add
                      </Button>
                    </div>
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                            style={{ backgroundColor: '#dbeafe', color: '#1e40af' }}
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() => handleRemoveTag(tag)}
                              className="hover:text-red-600"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>
                      Categories
                    </label>
                    {/* Existing categories from WordPress */}
                    {selectedSiteId && (
                      <div className="mb-2">
                        {categoriesLoading ? (
                          <p className="text-xs" style={{ color: '#9ca3af' }}>Loading categories...</p>
                        ) : siteCategories && siteCategories.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {siteCategories
                              .filter((cat: any) => !categories.includes(cat.name))
                              .map((cat: any) => (
                                <button
                                  key={cat.id}
                                  type="button"
                                  onClick={() => handleSelectCategory(cat.name)}
                                  className="px-2 py-1 text-xs rounded-full border transition-colors"
                                  style={{ borderColor: '#d1d5db', color: '#4b5563' }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                                    e.currentTarget.style.borderColor = '#2563eb';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                    e.currentTarget.style.borderColor = '#d1d5db';
                                  }}
                                >
                                  + {cat.name}
                                </button>
                              ))}
                          </div>
                        ) : (
                          <p className="text-xs" style={{ color: '#9ca3af' }}>No categories found. Add new below.</p>
                        )}
                      </div>
                    )}
                    {/* Add new category */}
                    <div className="flex gap-2">
                      <Input
                        placeholder="พิมพ์หมวดหมู่ใหม่"
                        value={categoryInput}
                        onChange={(e) => setCategoryInput(e.target.value)}
                        onKeyDown={handleCategoryKeyDown}
                      />
                      <Button type="button" variant="outline" onClick={handleAddCategory}>
                        Add
                      </Button>
                    </div>
                    {/* Selected categories */}
                    {categories.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {categories.map((cat) => (
                          <span
                            key={cat}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                            style={{ backgroundColor: '#dcfce7', color: '#166534' }}
                          >
                            {cat}
                            <button
                              type="button"
                              onClick={() => handleRemoveCategory(cat)}
                              className="hover:text-red-600"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* SEO Link Mappings */}
                  <div className="border-t pt-4" style={{ borderColor: '#e5e7eb' }}>
                    <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: '#374151' }}>
                      <Link2 className="h-4 w-4" style={{ color: '#2563eb' }} />
                      SEO Links (Auto-link keywords)
                    </label>
                    <p className="text-xs mb-3" style={{ color: '#6b7280' }}>
                      เพิ่ม keyword ที่ต้องการใส่ลิงค์อัตโนมัติในบทความ
                    </p>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Keyword (เช่น iPhone)"
                          value={linkKeyword}
                          onChange={(e) => setLinkKeyword(e.target.value)}
                          className="flex-1"
                        />
                        <div className="w-20">
                          <Input
                            type="number"
                            min={1}
                            max={99}
                            value={linkMaxCount}
                            onChange={(e) => setLinkMaxCount(parseInt(e.target.value) || 1)}
                            title="จำนวนครั้งที่ต้องการใส่ลิงค์"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Input
                          placeholder="URL (เช่น https://apple.com/iphone)"
                          value={linkUrl}
                          onChange={(e) => setLinkUrl(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddLinkMapping();
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleAddLinkMapping}
                          disabled={!linkKeyword.trim() || !linkUrl.trim()}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs" style={{ color: '#9ca3af' }}>
                        ตัวเลขคือจำนวนครั้งที่จะใส่ลิงค์ (ค่าเริ่มต้น: 1)
                      </p>
                    </div>
                    {/* Link mappings list */}
                    {linkMappings.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {linkMappings.map((mapping, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 rounded-lg text-sm"
                            style={{ backgroundColor: '#f0f9ff', border: '1px solid #bae6fd' }}
                          >
                            <div className="flex-1 min-w-0 flex items-center gap-2">
                              <span className="font-medium" style={{ color: '#0369a1' }}>
                                {mapping.keyword}
                              </span>
                              <span
                                className="px-1.5 py-0.5 rounded text-xs font-medium"
                                style={{ backgroundColor: '#dbeafe', color: '#1d4ed8' }}
                              >
                                ×{mapping.maxCount}
                              </span>
                              <span style={{ color: '#9ca3af' }}>→</span>
                              <span
                                className="text-xs truncate"
                                style={{ color: '#6b7280' }}
                                title={mapping.url}
                              >
                                {mapping.url.length > 25 ? mapping.url.slice(0, 25) + '...' : mapping.url}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveLinkMapping(mapping.keyword)}
                              className="ml-2 p-1 rounded hover:bg-red-100 transition-colors"
                            >
                              <X className="h-3 w-3" style={{ color: '#ef4444' }} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <Button type="submit" isLoading={isGenerating} className="w-full">
                    <Sparkles className="h-4 w-4 mr-2" />
                    สร้างและ Generate บทความ
                  </Button>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: '#6b7280' }}>Status</span>
                    <Badge>
                      {STATUS_LABELS[article.status as keyof typeof STATUS_LABELS]}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: '#6b7280' }}>Keyword</span>
                    <span className="font-medium">{article.keyword}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: '#6b7280' }}>Site</span>
                    <span className="font-medium">{article.site?.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: '#6b7280' }}>Tone</span>
                    <span>{TONE_LABELS[article.tone as keyof typeof TONE_LABELS]}</span>
                  </div>

                  <div className="border-t pt-4 space-y-2">
                    {article.status === 'DRAFT' && (
                      <Button
                        onClick={handleGenerate}
                        isLoading={isGenerating}
                        className="w-full"
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate with AI
                      </Button>
                    )}

                    {article.status === 'READY' && (
                      <>
                        {/* Background Selector */}
                        <div className="space-y-3">
                          <label className="block text-sm font-medium" style={{ color: '#374151' }}>
                            {article.featuredImage ? 'Change Background' : 'Image Background'}
                          </label>

                          {/* Tab Buttons */}
                          <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: '#f3f4f6', border: '1px solid #e5e7eb' }}>
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
                              Solid
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
                              Gradient
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
                              Upload
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
                                    borderColor: selectedPreset.id === preset.id ? '#2563eb' : '#e5e7eb',
                                    boxShadow: selectedPreset.id === preset.id ? '0 0 0 2px rgba(37, 99, 235, 0.2)' : 'none',
                                    backgroundColor: (preset as any).bg,
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
                            <div className="grid grid-cols-4 gap-2">
                              {GRADIENT_PRESETS.map((preset) => (
                                <button
                                  key={preset.id}
                                  type="button"
                                  onClick={() => setSelectedPreset(preset)}
                                  className="relative p-3 rounded-xl border-2 transition-all"
                                  style={{
                                    borderColor: selectedPreset.id === preset.id ? '#2563eb' : '#e5e7eb',
                                    boxShadow: selectedPreset.id === preset.id ? '0 0 0 2px rgba(37, 99, 235, 0.2)' : 'none',
                                    background: preset.gradient
                                      ? `linear-gradient(${preset.gradient.angle || 135}deg, ${preset.gradient.colors.join(', ')})`
                                      : (preset as any).bg,
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
                            <div className="space-y-3">
                              <label className="block">
                                <div
                                  className="relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all"
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
                                        Click to change image
                                      </p>
                                    </div>
                                  ) : (
                                    <>
                                      <ImageIcon className="h-8 w-8 mb-2" style={{ color: '#9ca3af' }} />
                                      <p className="text-sm" style={{ color: '#4b5563' }}>Click to upload background image</p>
                                      <p className="text-xs mt-1" style={{ color: '#6b7280' }}>PNG, JPG up to 5MB</p>
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

                          {/* Text Color Selector */}
                          <div className="pt-3 border-t" style={{ borderColor: '#e5e7eb' }}>
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
                              {/* Custom color picker */}
                              <label
                                className="relative w-8 h-8 rounded-full border-2 cursor-pointer overflow-hidden"
                                style={{ borderColor: '#d1d5db' }}
                                title="เลือกสีเอง"
                              >
                                <input
                                  type="color"
                                  value={textColor}
                                  onChange={(e) => setTextColor(e.target.value)}
                                  className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
                                />
                                <div
                                  className="w-full h-full"
                                  style={{
                                    background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)'
                                  }}
                                />
                              </label>
                            </div>
                          </div>

                          <Button
                            onClick={handleGenerateImage}
                            isLoading={isGeneratingImage}
                            variant="outline"
                            className="w-full"
                            disabled={backgroundType === 'custom' && !customBgImage}
                          >
                            <ImageIcon className="h-4 w-4 mr-2" />
                            {article.featuredImage ? 'Regenerate Image' : 'Generate Image'}
                          </Button>
                        </div>

                        {/* SEO Link Mappings */}
                        <div className="border-t pt-4" style={{ borderColor: '#e5e7eb' }}>
                          <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: '#374151' }}>
                            <Link2 className="h-4 w-4" style={{ color: '#2563eb' }} />
                            SEO Links (Auto-link keywords)
                          </label>
                          <p className="text-xs mb-3" style={{ color: '#6b7280' }}>
                            เพิ่ม keyword ที่ต้องการใส่ลิงค์อัตโนมัติในบทความ
                          </p>
                          <div className="space-y-2">
                            <div className="flex gap-2">
                              <Input
                                placeholder="Keyword (เช่น iPhone)"
                                value={linkKeyword}
                                onChange={(e) => setLinkKeyword(e.target.value)}
                                className="flex-1"
                              />
                              <div className="w-20">
                                <Input
                                  type="number"
                                  min={1}
                                  max={99}
                                  value={linkMaxCount}
                                  onChange={(e) => setLinkMaxCount(parseInt(e.target.value) || 1)}
                                  title="จำนวนครั้งที่ต้องการใส่ลิงค์"
                                />
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Input
                                placeholder="URL (เช่น https://apple.com/iphone)"
                                value={linkUrl}
                                onChange={(e) => setLinkUrl(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddLinkMapping();
                                  }
                                }}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                onClick={handleAddLinkMapping}
                                disabled={!linkKeyword.trim() || !linkUrl.trim()}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                            <p className="text-xs" style={{ color: '#9ca3af' }}>
                              ตัวเลขคือจำนวนครั้งที่จะใส่ลิงค์ (ค่าเริ่มต้น: 1)
                            </p>
                          </div>
                          {/* Link mappings list */}
                          {linkMappings.length > 0 && (
                            <div className="mt-3 space-y-2">
                              {linkMappings.map((mapping, index) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between p-2 rounded-lg text-sm"
                                  style={{ backgroundColor: '#f0f9ff', border: '1px solid #bae6fd' }}
                                >
                                  <div className="flex-1 min-w-0 flex items-center gap-2">
                                    <span className="font-medium" style={{ color: '#0369a1' }}>
                                      {mapping.keyword}
                                    </span>
                                    <span
                                      className="px-1.5 py-0.5 rounded text-xs font-medium"
                                      style={{ backgroundColor: '#dbeafe', color: '#1d4ed8' }}
                                    >
                                      x{mapping.maxCount}
                                    </span>
                                    <span style={{ color: '#9ca3af' }}>→</span>
                                    <span
                                      className="text-xs truncate"
                                      style={{ color: '#6b7280' }}
                                      title={mapping.url}
                                    >
                                      {mapping.url.length > 25 ? mapping.url.slice(0, 25) + '...' : mapping.url}
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveLinkMapping(mapping.keyword)}
                                    className="ml-2 p-1 rounded hover:bg-red-100 transition-colors"
                                  >
                                    <X className="h-3 w-3" style={{ color: '#ef4444' }} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Two separate publish buttons */}
                        <div className="space-y-2">
                          <Button
                            onClick={() => handlePublish('publish')}
                            isLoading={isPublishing && publishStatus === 'publish'}
                            className="w-full bg-gradient-to-r from-success-500 to-success-600 hover:from-success-400 hover:to-success-500 shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                          >
                            <Send className="h-4 w-4 mr-2" />
                            Publish Now
                          </Button>
                          <Button
                            onClick={() => handlePublish('draft')}
                            isLoading={isPublishing && publishStatus === 'draft'}
                            variant="outline"
                            className="w-full"
                          >
                            <Send className="h-4 w-4 mr-2" />
                            Save as Draft
                          </Button>
                        </div>
                      </>
                    )}

                    {article.status === 'PUBLISHED' && article.wpPostUrl && (
                      <a
                        href={article.wpPostUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <Button variant="outline" className="w-full">
                          <Eye className="h-4 w-4 mr-2" />
                          View on Site
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle>ตัวอย่าง</CardTitle>
            </CardHeader>
            <CardContent>
              {!article?.title ? (
                <div className="flex h-64 items-center justify-center" style={{ color: '#9ca3af' }}>
                  ตัวอย่างบทความจะแสดงที่นี่
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Heading Color Legend */}
                  <div className="flex flex-wrap items-center gap-3 p-2 rounded-lg text-xs" style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}>
                    <span style={{ color: '#6b7280' }}>หัวข้อ:</span>
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded" style={{ backgroundColor: '#1d4ed8' }}></span>
                      <span style={{ color: '#1d4ed8' }}>H1</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded" style={{ backgroundColor: '#059669' }}></span>
                      <span style={{ color: '#059669' }}>H2</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded" style={{ backgroundColor: '#7c3aed' }}></span>
                      <span style={{ color: '#7c3aed' }}>H3</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded" style={{ backgroundColor: '#ea580c' }}></span>
                      <span style={{ color: '#ea580c' }}>H4</span>
                    </span>
                  </div>

                  {article.featuredImage && (
                    <img
                      src={article.featuredImage}
                      alt={article.title}
                      className="w-full rounded-xl shadow-glass"
                    />
                  )}
                  <h2 className="text-xl font-bold" style={{ color: '#1f2937' }}>{article.title}</h2>
                  {article.excerpt && (
                    <p className="italic" style={{ color: '#4b5563' }}>{article.excerpt}</p>
                  )}
                  <div
                    className="prose prose-sm max-w-none [&_a]:text-blue-600 [&_a]:underline [&_a]:font-medium [&_h1]:text-blue-700 [&_h1]:font-bold [&_h1]:text-2xl [&_h1]:mt-6 [&_h1]:mb-3 [&_h2]:text-emerald-600 [&_h2]:font-bold [&_h2]:text-xl [&_h2]:mt-5 [&_h2]:mb-2 [&_h3]:text-violet-600 [&_h3]:font-semibold [&_h3]:text-lg [&_h3]:mt-4 [&_h3]:mb-2 [&_h4]:text-orange-600 [&_h4]:font-semibold [&_h4]:text-base [&_h4]:mt-3 [&_h4]:mb-1"
                    style={{ color: '#374151' }}
                    dangerouslySetInnerHTML={{ __html: article.content ? DOMPurify.sanitize(processContentForPreview(article.content)) : '' }}
                  />
                  {linkMappings.length > 0 && (
                    <div className="mt-4 p-3 rounded-lg flex items-center gap-2" style={{ backgroundColor: '#f0f9ff', border: '1px solid #bae6fd' }}>
                      <Link2 className="h-4 w-4" style={{ color: '#0369a1' }} />
                      <span className="text-sm" style={{ color: '#0369a1' }}>
                        SEO Links: {linkMappings.length} keyword{linkMappings.length > 1 ? 's' : ''} จะถูกใส่ลิงค์อัตโนมัติ
                      </span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
