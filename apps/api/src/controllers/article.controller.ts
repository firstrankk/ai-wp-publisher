import { Response } from 'express';
import { prisma } from '../index.js';
import {
  createArticleSchema,
  updateArticleSchema,
  paginationSchema,
} from '../utils/validation.js';
import { AIService } from '../services/ai.service.js';
import { ImageService } from '../services/image.service.js';
import { WordPressService } from '../services/wordpress.service.js';
import { decrypt } from '../utils/encryption.js';
import type { AuthRequest } from '../middlewares/auth.middleware.js';

interface SeoLink {
  keyword: string;
  url: string;
  maxCount: number;
}

// Helper function to insert SEO links into content
function insertSeoLinks(content: string, seoLinks: SeoLink[]): string {
  if (!seoLinks || seoLinks.length === 0) {
    return content;
  }

  let modifiedContent = content;

  for (const link of seoLinks) {
    const { keyword, url, maxCount } = link;
    if (!keyword || !url) continue;

    // Track how many replacements we've made
    let replacementCount = 0;

    // Create a regex to find the keyword (case-insensitive, not inside existing tags)
    const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Split content by HTML tags to avoid replacing inside tags
    const parts = modifiedContent.split(/(<[^>]*>)/);

    // Track if we're inside a heading tag
    let insideHeading = false;

    modifiedContent = parts.map(part => {
      // Check for heading opening tags
      if (part.match(/^<h[1-6][^>]*>/i)) {
        insideHeading = true;
        return part;
      }
      // Check for heading closing tags
      if (part.match(/^<\/h[1-6]>/i)) {
        insideHeading = false;
        return part;
      }
      // If it's any HTML tag, don't modify it
      if (part.startsWith('<')) {
        return part;
      }
      // If we're inside a heading, don't add links
      if (insideHeading) {
        return part;
      }

      // Replace keyword occurrences in text content (only in paragraphs, not headings)
      return part.replace(new RegExp(escapedKeyword, 'gi'), (match) => {
        if (replacementCount < maxCount) {
          replacementCount++;
          return `<a href="${url}" target="_blank" rel="noopener">${match}</a>`;
        }
        return match;
      });
    }).join('');

    // If we didn't find enough occurrences, insert keyword+link at appropriate positions
    const remaining = maxCount - replacementCount;
    if (remaining > 0) {
      modifiedContent = insertAdditionalLinks(modifiedContent, keyword, url, remaining);
    }
  }

  return modifiedContent;
}

// Helper function to insert additional keyword+link at appropriate positions
function insertAdditionalLinks(content: string, keyword: string, url: string, count: number): string {
  let modifiedContent = content;
  let inserted = 0;

  // Find all paragraph tags and insert after some of them
  const paragraphRegex = /(<\/p>)/gi;
  const matches = [...content.matchAll(paragraphRegex)];

  if (matches.length === 0) {
    // No paragraphs found, try to insert before closing tags like </div>
    const linkText = ` <a href="${url}" target="_blank" rel="noopener">${keyword}</a>`;
    // Insert at the end of content or before last closing tag
    if (content.includes('</p>')) {
      modifiedContent = content.replace(/<\/p>(?![\s\S]*<\/p>)/, `${linkText}</p>`);
      inserted++;
    }
    return modifiedContent;
  }

  // Calculate which paragraphs to insert after (spread evenly)
  const totalParagraphs = matches.length;
  const interval = Math.max(1, Math.floor(totalParagraphs / (count + 1)));

  let insertPositions: number[] = [];
  for (let i = 0; i < count && i < totalParagraphs; i++) {
    const pos = Math.min(interval * (i + 1) - 1, totalParagraphs - 1);
    if (!insertPositions.includes(pos)) {
      insertPositions.push(pos);
    }
  }

  // Sort positions in reverse order to insert from end to start (to preserve indices)
  insertPositions.sort((a, b) => b - a);

  // Insert keyword+link after selected paragraphs
  const linkHtml = `<p><a href="${url}" target="_blank" rel="noopener">${keyword}</a></p>`;

  for (const pos of insertPositions) {
    if (inserted >= count) break;
    const match = matches[pos];
    if (match && match.index !== undefined) {
      const insertIndex = match.index + match[0].length;
      modifiedContent = modifiedContent.slice(0, insertIndex) + linkHtml + modifiedContent.slice(insertIndex);
      inserted++;
    }
  }

  return modifiedContent;
}

export class ArticleController {
  async list(req: AuthRequest, res: Response) {
    try {
      const query = paginationSchema.parse(req.query);
      const { page, limit, search, sortBy, sortOrder } = query;
      const { status, siteId } = req.query as { status?: string; siteId?: string };

      // Build where clause
      let where: any = {};

      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { keyword: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (status) {
        where.status = status;
      }

      if (siteId) {
        where.siteId = siteId;
      }

      // Filter by user's assigned sites (for non-admin)
      if (req.user!.role !== 'ADMIN') {
        const userSites = await prisma.userSite.findMany({
          where: { userId: req.user!.id },
          select: { siteId: true },
        });
        where.siteId = { in: userSites.map((us) => us.siteId) };
      }

      const [articles, total] = await Promise.all([
        prisma.article.findMany({
          where,
          select: {
            id: true,
            title: true,
            keyword: true,
            tone: true,
            length: true,
            status: true,
            wpPostUrl: true,
            errorMessage: true,
            createdAt: true,
            publishedAt: true,
            scheduledAt: true,
            site: {
              select: { id: true, name: true, url: true },
            },
            user: {
              select: { id: true, name: true },
            },
          },
          orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.article.count({ where }),
      ]);

      res.json({
        data: articles,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      throw error;
    }
  }

  async create(req: AuthRequest, res: Response) {
    try {
      const data = createArticleSchema.parse(req.body);

      // Check site access
      const site = await prisma.site.findUnique({
        where: { id: data.siteId },
      });

      if (!site) {
        return res.status(404).json({ error: 'Site not found' });
      }

      if (req.user!.role !== 'ADMIN') {
        const hasAccess = await prisma.userSite.findFirst({
          where: { userId: req.user!.id, siteId: data.siteId },
        });
        if (!hasAccess) {
          return res.status(403).json({ error: 'Access denied to this site' });
        }
      }

      const article = await prisma.article.create({
        data: {
          title: '',
          content: '',
          keyword: data.keyword,
          tone: data.tone,
          length: data.length,
          seoKeywords: data.seoKeywords || [],
          seoLinks: data.seoLinks || null,
          categories: data.categories || [],
          tags: data.tags || [],
          scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
          status: 'DRAFT',
          siteId: data.siteId,
          userId: req.user!.id,
        },
        include: {
          site: { select: { id: true, name: true, url: true } },
        },
      });

      res.status(201).json(article);
    } catch (error) {
      throw error;
    }
  }

  async getById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const article = await prisma.article.findUnique({
        where: { id },
        include: {
          site: { select: { id: true, name: true, url: true } },
          user: { select: { id: true, name: true } },
        },
      });

      if (!article) {
        return res.status(404).json({ error: 'Article not found' });
      }

      res.json(article);
    } catch (error) {
      throw error;
    }
  }

  async update(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const data = updateArticleSchema.parse(req.body);

      const existing = await prisma.article.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json({ error: 'Article not found' });
      }

      const article = await prisma.article.update({
        where: { id },
        data: {
          ...data,
          scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : data.scheduledAt === null ? null : undefined,
        },
        include: {
          site: { select: { id: true, name: true, url: true } },
        },
      });

      res.json(article);
    } catch (error) {
      throw error;
    }
  }

  async delete(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const deleteFromWP = req.query.deleteFromWP === 'true';

      const existing = await prisma.article.findUnique({
        where: { id },
        include: { site: true },
      });
      if (!existing) {
        return res.status(404).json({ error: 'Article not found' });
      }

      // If requested, delete from WordPress too
      if (deleteFromWP && existing.wpPostId && existing.site) {
        try {
          const decryptedPassword = decrypt(existing.site.appPassword);
          const wp = new WordPressService(
            existing.site.url,
            existing.site.username,
            decryptedPassword
          );
          await wp.deletePost(parseInt(existing.wpPostId));
        } catch (wpError: any) {
          // Log error but continue with local deletion
          console.error('Failed to delete from WordPress:', wpError.message);
        }
      }

      await prisma.article.delete({ where: { id } });

      res.json({ message: 'Article deleted successfully' });
    } catch (error) {
      throw error;
    }
  }

  async generate(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const article = await prisma.article.findUnique({
        where: { id },
        include: { site: true },
      });

      if (!article) {
        return res.status(404).json({ error: 'Article not found' });
      }

      // Update status to generating
      await prisma.article.update({
        where: { id },
        data: { status: 'GENERATING' },
      });

      try {
        // Get default AI API key (or first active text generation key)
        let apiKey = await prisma.apiKey.findFirst({
          where: {
            isDefault: true,
            isActive: true,
            provider: { in: ['CLAUDE', 'OPENAI', 'GEMINI', 'OPENROUTER'] }
          },
        });

        // Fallback to any active text generation key if no default set
        if (!apiKey) {
          apiKey = await prisma.apiKey.findFirst({
            where: {
              isActive: true,
              provider: { in: ['CLAUDE', 'OPENAI', 'GEMINI', 'OPENROUTER'] }
            },
          });
        }

        if (!apiKey) {
          throw new Error('No active AI API key found. Please add a Claude, OpenAI, Gemini, or OpenRouter API key.');
        }

        const decryptedKey = decrypt(apiKey.key);
        const aiService = new AIService(decryptedKey, apiKey.provider, apiKey.model || undefined);

        // Extract SEO link keywords to tell AI to include them
        let seoLinkKeywords: { keyword: string; count: number }[] | undefined;
        if (article.seoLinks && Array.isArray(article.seoLinks)) {
          seoLinkKeywords = (article.seoLinks as SeoLink[]).map(link => ({
            keyword: link.keyword,
            count: link.maxCount,
          }));
        }

        // Generate content
        const generated = await aiService.generateArticle({
          keyword: article.keyword,
          tone: article.tone,
          length: article.length,
          seoKeywords: article.seoKeywords,
          seoLinkKeywords,
        });

        // Insert SEO links into content if available
        let processedContent = generated.content;
        if (article.seoLinks && Array.isArray(article.seoLinks)) {
          processedContent = insertSeoLinks(generated.content, article.seoLinks as SeoLink[]);
        }

        // Prepare update data
        const updateData: any = {
          title: generated.title,
          content: processedContent,
          excerpt: generated.excerpt,
          status: 'READY',
        };

        // Add AI-generated tags if available and article doesn't have manual tags
        if (generated.tags && generated.tags.length > 0) {
          // Merge with existing tags (if any)
          const existingTags = article.tags || [];
          const newTags = [...new Set([...existingTags, ...generated.tags])];
          updateData.tags = newTags;
        }

        // Update article
        const updated = await prisma.article.update({
          where: { id },
          data: updateData,
          include: {
            site: { select: { id: true, name: true, url: true } },
          },
        });

        // Update API key usage
        await prisma.apiKey.update({
          where: { id: apiKey.id },
          data: {
            usageCount: { increment: 1 },
            lastUsedAt: new Date(),
          },
        });

        // Log activity
        await prisma.activityLog.create({
          data: {
            type: 'ARTICLE_CREATED',
            message: `Article "${generated.title}" generated`,
            userId: req.user!.id,
            metadata: { articleId: id },
          },
        });

        res.json(updated);
      } catch (error: any) {
        // Update status to failed
        await prisma.article.update({
          where: { id },
          data: {
            status: 'FAILED',
            errorMessage: error.message,
          },
        });
        return res.status(500).json({ error: `Generation failed: ${error.message}` });
      }
    } catch (error: any) {
      console.error('Generate error:', error);
      return res.status(500).json({ error: error.message || 'Failed to generate article' });
    }
  }

  async regenerate(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      // Reset article and regenerate
      await prisma.article.update({
        where: { id },
        data: {
          title: '',
          content: '',
          excerpt: null,
          status: 'DRAFT',
          errorMessage: null,
        },
      });

      // Call generate
      return this.generate(req, res);
    } catch (error: any) {
      console.error('Regenerate error:', error);
      return res.status(500).json({ error: error.message || 'Failed to regenerate article' });
    }
  }

  async generateImage(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { backgroundColor, textColor, fontSize, gradient, backgroundImage } = req.body;

      const article = await prisma.article.findUnique({ where: { id } });

      if (!article) {
        return res.status(404).json({ error: 'Article not found' });
      }

      if (!article.title) {
        return res.status(400).json({ error: 'Article has no title yet' });
      }

      const imageService = new ImageService();
      const imageBase64 = await imageService.generateFeaturedImage({
        title: article.title,
        backgroundColor: backgroundColor || '#1a1a2e',
        textColor: textColor || '#ffffff',
        fontSize: fontSize || 48,
        gradient,
        backgroundImage,
      });

      // Update article with image
      const updated = await prisma.article.update({
        where: { id },
        data: { featuredImage: imageBase64 },
      });

      res.json({ featuredImage: imageBase64 });
    } catch (error) {
      throw error;
    }
  }

  async publish(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { status: publishStatus, scheduledAt } = req.body; // 'draft', 'publish', 'future' + optional scheduledAt

      if (scheduledAt) {
        const scheduleDate = new Date(scheduledAt);
        if (isNaN(scheduleDate.getTime())) {
          return res.status(400).json({ error: 'Invalid scheduledAt date format' });
        }
        if (scheduleDate <= new Date()) {
          return res.status(400).json({ error: 'Scheduled date must be in the future' });
        }
      }

      const article = await prisma.article.findUnique({
        where: { id },
        include: { site: true },
      });

      if (!article) {
        return res.status(404).json({ error: 'Article not found' });
      }

      if (article.status !== 'READY') {
        return res.status(400).json({ error: 'Article is not ready for publishing' });
      }

      // Validate title and content are not empty
      if (!article.title || article.title.trim() === '') {
        return res.status(400).json({ error: 'Article title is empty. Please regenerate the article.' });
      }
      if (!article.content || article.content.trim() === '') {
        return res.status(400).json({ error: 'Article content is empty. Please regenerate the article.' });
      }

      // Determine WordPress post status
      // If scheduledAt is provided, use 'future' status for scheduled posts
      let wpPostStatus: string;
      if (scheduledAt) {
        wpPostStatus = 'future';
      } else {
        wpPostStatus = publishStatus || article.site.defaultPostStatus.toLowerCase();
      }

      // Update status
      await prisma.article.update({
        where: { id },
        data: { status: 'PUBLISHING' },
      });

      try {
        const appPassword = decrypt(article.site.appPassword);
        const wpService = new WordPressService(
          article.site.url,
          article.site.username,
          appPassword
        );

        // Upload featured image if exists
        let mediaId: number | undefined;
        if (article.featuredImage) {
          mediaId = await wpService.uploadMedia(
            article.featuredImage,
            `${article.title.slice(0, 50)}.png`
          );
        }

        // Create post
        const result = await wpService.createPost({
          title: article.title,
          content: article.content,
          excerpt: article.excerpt || undefined,
          status: wpPostStatus as 'draft' | 'publish' | 'pending' | 'future',
          date: scheduledAt || undefined,
          categories: article.categories && article.categories.length > 0 ? article.categories : undefined,
          tags: article.tags,
          featured_media: mediaId,
        });

        // Update article - handle both immediate publish and scheduled posts
        const isScheduled = !!scheduledAt;
        const updated = await prisma.article.update({
          where: { id },
          data: {
            status: isScheduled ? 'SCHEDULED' : 'PUBLISHED',
            wpPostId: result.id.toString(),
            wpPostUrl: result.link,
            publishedAt: isScheduled ? null : new Date(),
            scheduledAt: isScheduled ? new Date(scheduledAt) : null,
            errorMessage: null,
          },
          include: {
            site: { select: { id: true, name: true, url: true } },
          },
        });

        // Log activity
        const activityMessage = isScheduled
          ? `Article "${article.title}" scheduled for ${new Date(scheduledAt).toLocaleString('th-TH')} on ${article.site.name}`
          : `Article "${article.title}" published to ${article.site.name}`;
        await prisma.activityLog.create({
          data: {
            type: isScheduled ? 'ARTICLE_SCHEDULED' : 'ARTICLE_PUBLISHED',
            message: activityMessage,
            userId: req.user!.id,
            metadata: { articleId: id, wpPostUrl: result.link, scheduledAt: scheduledAt || null },
          },
        });

        res.json(updated);
      } catch (error: any) {
        await prisma.article.update({
          where: { id },
          data: {
            status: 'FAILED',
            errorMessage: error.message,
          },
        });

        // Log error
        await prisma.activityLog.create({
          data: {
            type: 'ERROR',
            message: `Failed to publish article: ${error.message}`,
            userId: req.user!.id,
            metadata: { articleId: id },
          },
        });

        return res.status(500).json({ error: `Failed to publish: ${error.message}` });
      }
    } catch (error: any) {
      console.error('Publish error:', error);
      return res.status(500).json({ error: error.message || 'Failed to publish article' });
    }
  }

  async retry(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const article = await prisma.article.findUnique({ where: { id } });

      if (!article) {
        return res.status(404).json({ error: 'Article not found' });
      }

      if (article.status !== 'FAILED') {
        return res.status(400).json({ error: 'Only failed articles can be retried' });
      }

      // Reset status and retry
      await prisma.article.update({
        where: { id },
        data: {
          status: 'READY',
          errorMessage: null,
        },
      });

      return this.publish(req, res);
    } catch (error) {
      throw error;
    }
  }

  async bulkGenerate(req: AuthRequest, res: Response) {
    try {
      const { keywords, siteId, tone, length } = req.body;

      if (!Array.isArray(keywords) || keywords.length === 0) {
        return res.status(400).json({ error: 'Keywords array is required' });
      }

      // Create articles in draft status
      const results = await Promise.allSettled(
        keywords.map((keyword: string) =>
          prisma.article.create({
            data: {
              title: '',
              content: '',
              keyword,
              tone,
              length,
              seoKeywords: [],
              status: 'DRAFT',
              siteId,
              userId: req.user!.id,
            },
          })
        )
      );

      const succeeded = results.filter(r => r.status === 'fulfilled').map(r => (r as PromiseFulfilledResult<any>).value);
      const failedCount = results.filter(r => r.status === 'rejected').length;

      res.json({
        message: `Created ${succeeded.length} articles${failedCount > 0 ? `, ${failedCount} failed` : ''}`,
        articleIds: succeeded.map((a: any) => a.id),
      });
    } catch (error) {
      throw error;
    }
  }
}
