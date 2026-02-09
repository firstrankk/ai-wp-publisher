interface CreatePostParams {
  title: string;
  content: string;
  excerpt?: string;
  status?: 'draft' | 'publish' | 'pending' | 'future';
  date?: string; // ISO 8601 format for scheduled posts
  categories?: string[];
  tags?: string[];
  featured_media?: number;
}

interface WPPost {
  id: number;
  link: string;
  title: { rendered: string };
  status: string;
}

interface WPUser {
  id: number;
  name: string;
}

export class WordPressService {
  private baseUrl: string;
  private username: string;
  private appPassword: string;

  constructor(siteUrl: string, username: string, appPassword: string) {
    this.baseUrl = `${siteUrl}/wp-json/wp/v2`;
    this.username = username;
    this.appPassword = appPassword;
  }

  private getAuthHeader(): string {
    // Explicitly use UTF-8 encoding for non-ASCII usernames/passwords
    const credentials = Buffer.from(`${this.username}:${this.appPassword}`, 'utf-8').toString('base64');
    return `Basic ${credentials}`;
  }

  private async fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async testConnection(): Promise<{ success: boolean; message: string; user?: WPUser }> {
    try {
      // Test by fetching current user
      const response = await this.fetchWithTimeout(`${this.baseUrl}/users/me`, {
        headers: {
          Authorization: this.getAuthHeader(),
        },
      });

      if (response.ok) {
        const user = await response.json();
        return {
          success: true,
          message: `Connected as ${user.name}`,
          user: { id: user.id, name: user.name },
        };
      } else {
        const error = await response.json();
        return {
          success: false,
          message: error.message || 'Failed to connect',
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Connection failed',
      };
    }
  }

  async createPost(params: CreatePostParams): Promise<WPPost> {
    const { title, content, excerpt, status = 'draft', date, categories, tags, featured_media } = params;

    const body: any = {
      title,
      content,
      status,
    };

    if (excerpt) {
      body.excerpt = excerpt;
    }

    // For scheduled posts, set the date
    if (date) {
      body.date = date;
    }

    if (featured_media) {
      body.featured_media = featured_media;
    }

    // Handle categories - get or create category IDs
    if (categories && categories.length > 0) {
      const categoryIds = await this.getOrCreateCategoryIds(categories);
      if (categoryIds.length > 0) {
        body.categories = categoryIds;
      }
    }

    // Handle tags - need to get or create tag IDs
    if (tags && tags.length > 0) {
      const tagIds = await this.getOrCreateTagIds(tags);
      if (tagIds.length > 0) {
        body.tags = tagIds;
      }
    }

    const response = await this.fetchWithTimeout(`${this.baseUrl}/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: this.getAuthHeader(),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create post');
    }

    return response.json();
  }

  async uploadMedia(imageData: string, filename: string): Promise<number> {
    // Convert base64 to buffer if needed
    let buffer: Buffer;
    if (imageData.startsWith('data:')) {
      const base64Data = imageData.split(',')[1];
      buffer = Buffer.from(base64Data, 'base64');
    } else {
      buffer = Buffer.from(imageData, 'base64');
    }

    // Sanitize filename to ASCII only (HTTP headers don't support non-ASCII)
    const safeFilename = filename.replace(/[^\x00-\x7F]/g, '').trim() || `image-${Date.now()}.png`;

    const response = await this.fetchWithTimeout(`${this.baseUrl}/media`, {
      method: 'POST',
      headers: {
        'Content-Disposition': `attachment; filename="${safeFilename}"`,
        'Content-Type': 'image/png',
        Authorization: this.getAuthHeader(),
      },
      body: buffer,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to upload media');
    }

    const media = await response.json();
    return media.id;
  }

  async getCategories(): Promise<{ id: number; name: string; slug: string }[]> {
    const response = await this.fetchWithTimeout(`${this.baseUrl}/categories?per_page=100`, {
      headers: {
        Authorization: this.getAuthHeader(),
      },
    });

    if (!response.ok) {
      return [];
    }

    return response.json();
  }

  private async getCategoryIds(categoryNames: string[]): Promise<number[]> {
    const categories = await this.getCategories();
    const ids: number[] = [];

    for (const name of categoryNames) {
      const found = categories.find(
        (cat) =>
          cat.name.toLowerCase() === name.toLowerCase() ||
          cat.slug.toLowerCase() === name.toLowerCase()
      );
      if (found) {
        ids.push(found.id);
      }
    }

    return ids;
  }

  async getOrCreateCategoryIds(categoryNames: string[]): Promise<number[]> {
    const existingCategories = await this.getCategories();
    const ids: number[] = [];

    for (const name of categoryNames) {
      // Check if category exists
      const found = existingCategories.find(
        (cat) =>
          cat.name.toLowerCase() === name.toLowerCase() ||
          cat.slug.toLowerCase() === name.toLowerCase()
      );

      if (found) {
        ids.push(found.id);
      } else {
        // Create new category
        try {
          const response = await this.fetchWithTimeout(`${this.baseUrl}/categories`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: this.getAuthHeader(),
            },
            body: JSON.stringify({ name }),
          });

          if (response.ok) {
            const newCategory = await response.json();
            ids.push(newCategory.id);
          }
        } catch {
          // Skip if category creation fails
        }
      }
    }

    return ids;
  }

  async getTags(): Promise<{ id: number; name: string; slug: string }[]> {
    const response = await this.fetchWithTimeout(`${this.baseUrl}/tags?per_page=100`, {
      headers: {
        Authorization: this.getAuthHeader(),
      },
    });

    if (!response.ok) {
      return [];
    }

    return response.json();
  }

  private async getOrCreateTagIds(tagNames: string[]): Promise<number[]> {
    const existingTags = await this.getTags();
    const ids: number[] = [];

    for (const name of tagNames) {
      // Check if tag exists
      const found = existingTags.find(
        (tag) =>
          tag.name.toLowerCase() === name.toLowerCase() ||
          tag.slug.toLowerCase() === name.toLowerCase()
      );

      if (found) {
        ids.push(found.id);
      } else {
        // Create new tag
        try {
          const response = await this.fetchWithTimeout(`${this.baseUrl}/tags`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: this.getAuthHeader(),
            },
            body: JSON.stringify({ name }),
          });

          if (response.ok) {
            const newTag = await response.json();
            ids.push(newTag.id);
          }
        } catch {
          // Skip if tag creation fails
        }
      }
    }

    return ids;
  }

  async deletePost(postId: number): Promise<void> {
    const response = await this.fetchWithTimeout(`${this.baseUrl}/posts/${postId}?force=true`, {
      method: 'DELETE',
      headers: {
        Authorization: this.getAuthHeader(),
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete post');
    }
  }

  async updatePost(postId: number, params: Partial<CreatePostParams>): Promise<WPPost> {
    const response = await this.fetchWithTimeout(`${this.baseUrl}/posts/${postId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: this.getAuthHeader(),
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update post');
    }

    return response.json();
  }
}
