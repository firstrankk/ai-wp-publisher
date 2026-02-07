import { Response } from 'express';
import { prisma } from '../index.js';
import { createApiKeySchema, updateApiKeySchema } from '../utils/validation.js';
import { encrypt, decrypt, hashForLog } from '../utils/encryption.js';
import type { AuthRequest } from '../middlewares/auth.middleware.js';

export class ApiKeyController {
  async list(req: AuthRequest, res: Response) {
    try {
      const apiKeys = await prisma.apiKey.findMany({
        select: {
          id: true,
          name: true,
          provider: true,
          model: true,
          isActive: true,
          isDefault: true,
          usageCount: true,
          lastUsedAt: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json(apiKeys);
    } catch (error) {
      throw error;
    }
  }

  async create(req: AuthRequest, res: Response) {
    try {
      const data = createApiKeySchema.parse(req.body);

      // Encrypt the API key
      const encryptedKey = encrypt(data.key);

      const apiKey = await prisma.apiKey.create({
        data: {
          name: data.name,
          provider: data.provider,
          key: encryptedKey,
          model: data.model,
        },
        select: {
          id: true,
          name: true,
          provider: true,
          model: true,
          isActive: true,
          createdAt: true,
        },
      });

      res.status(201).json(apiKey);
    } catch (error) {
      throw error;
    }
  }

  async getById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const apiKey = await prisma.apiKey.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          provider: true,
          model: true,
          isActive: true,
          usageCount: true,
          lastUsedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!apiKey) {
        return res.status(404).json({ error: 'API key not found' });
      }

      res.json(apiKey);
    } catch (error) {
      throw error;
    }
  }

  async update(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const data = updateApiKeySchema.parse(req.body);

      const existing = await prisma.apiKey.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json({ error: 'API key not found' });
      }

      const updateData: any = { ...data };
      if (data.key) {
        updateData.key = encrypt(data.key);
      }

      const apiKey = await prisma.apiKey.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          name: true,
          provider: true,
          model: true,
          isActive: true,
          usageCount: true,
          lastUsedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      res.json(apiKey);
    } catch (error) {
      throw error;
    }
  }

  async delete(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const existing = await prisma.apiKey.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json({ error: 'API key not found' });
      }

      await prisma.apiKey.delete({ where: { id } });

      res.json({ message: 'API key deleted successfully' });
    } catch (error) {
      throw error;
    }
  }

  async test(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const apiKey = await prisma.apiKey.findUnique({ where: { id } });
      if (!apiKey) {
        return res.status(404).json({ error: 'API key not found' });
      }

      const decryptedKey = decrypt(apiKey.key);

      let result: { success: boolean; message: string };

      switch (apiKey.provider) {
        case 'CLAUDE':
          result = await testClaudeKey(decryptedKey);
          break;
        case 'OPENAI':
          result = await testOpenAIKey(decryptedKey);
          break;
        case 'GEMINI':
          result = await testGeminiKey(decryptedKey);
          break;
        case 'OPENROUTER':
          result = await testOpenRouterKey(decryptedKey);
          break;
        default:
          result = { success: true, message: 'Key format validated' };
      }

      res.json(result);
    } catch (error) {
      throw error;
    }
  }

  async setDefault(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const apiKey = await prisma.apiKey.findUnique({ where: { id } });
      if (!apiKey) {
        return res.status(404).json({ error: 'API key not found' });
      }

      // Only text generation providers can be set as default
      if (!['CLAUDE', 'OPENAI', 'GEMINI', 'OPENROUTER'].includes(apiKey.provider)) {
        return res.status(400).json({ error: 'Only Claude, OpenAI, Gemini, or OpenRouter keys can be set as default for text generation' });
      }

      // Remove default from all other keys
      await prisma.apiKey.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });

      // Set this key as default
      const updated = await prisma.apiKey.update({
        where: { id },
        data: { isDefault: true },
        select: {
          id: true,
          name: true,
          provider: true,
          model: true,
          isActive: true,
          isDefault: true,
          usageCount: true,
          lastUsedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      res.json(updated);
    } catch (error) {
      throw error;
    }
  }
}

async function testClaudeKey(key: string): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hi' }],
      }),
    });

    if (response.ok) {
      return { success: true, message: 'Claude API key is valid' };
    } else {
      const error = await response.json();
      return { success: false, message: error.error?.message || 'Invalid API key' };
    }
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

async function testOpenAIKey(key: string): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        Authorization: `Bearer ${key}`,
      },
    });

    if (response.ok) {
      return { success: true, message: 'OpenAI API key is valid' };
    } else {
      const error = await response.json();
      return { success: false, message: error.error?.message || 'Invalid API key' };
    }
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

async function testGeminiKey(key: string): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`
    );

    if (response.ok) {
      return { success: true, message: 'Gemini API key is valid' };
    } else {
      const error = await response.json();
      return { success: false, message: error.error?.message || 'Invalid API key' };
    }
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

async function testOpenRouterKey(key: string): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        Authorization: `Bearer ${key}`,
      },
    });

    if (response.ok) {
      return { success: true, message: 'OpenRouter API key is valid' };
    } else {
      const error = await response.json();
      return { success: false, message: error.error?.message || 'Invalid API key' };
    }
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}
