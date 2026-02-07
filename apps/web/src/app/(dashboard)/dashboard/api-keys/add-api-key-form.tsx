'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { apiKeysApi } from '@/lib/api';

const addApiKeySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  provider: z.enum(['CLAUDE', 'OPENAI', 'GEMINI', 'OPENROUTER', 'DALLE', 'REPLICATE']),
  key: z.string().min(1, 'API key is required'),
  model: z.string().optional(),
});

type AddApiKeyForm = z.infer<typeof addApiKeySchema>;

interface AddApiKeyFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function AddApiKeyForm({ onSuccess, onCancel }: AddApiKeyFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<AddApiKeyForm>({
    resolver: zodResolver(addApiKeySchema),
    defaultValues: {
      provider: 'CLAUDE',
    },
  });

  const selectedProvider = watch('provider');

  const onSubmit = async (data: AddApiKeyForm) => {
    setIsLoading(true);
    try {
      await apiKeysApi.create(data);
      toast.success('API key added successfully');
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to add API key');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Name
        </label>
        <Input
          placeholder="e.g., Claude Production"
          {...register('name')}
          error={errors.name?.message}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Provider
        </label>
        <Select
          {...register('provider')}
          options={[
            { value: 'CLAUDE', label: 'Claude (Anthropic)' },
            { value: 'OPENAI', label: 'OpenAI' },
            { value: 'GEMINI', label: 'Gemini (Google)' },
            { value: 'OPENROUTER', label: 'OpenRouter' },
            { value: 'DALLE', label: 'DALL-E' },
            { value: 'REPLICATE', label: 'Replicate' },
          ]}
          error={errors.provider?.message}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          API Key
        </label>
        <Input
          type="password"
          placeholder="sk-..."
          {...register('key')}
          error={errors.key?.message}
        />
        <p className="mt-1 text-xs text-gray-500">
          Your API key will be encrypted before storage
        </p>
      </div>

      {selectedProvider === 'OPENROUTER' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Model
          </label>
          <Select
            {...register('model')}
            options={[
              { value: '', label: '-- เลือกโมเดล --' },
              { value: 'anthropic/claude-sonnet-4', label: 'Claude Sonnet 4 (Anthropic)' },
              { value: 'anthropic/claude-haiku-4', label: 'Claude Haiku 4 (Anthropic)' },
              { value: 'openai/gpt-4o', label: 'GPT-4o (OpenAI)' },
              { value: 'openai/gpt-4o-mini', label: 'GPT-4o Mini (OpenAI)' },
              { value: 'openai/o3-mini', label: 'o3-mini (OpenAI)' },
              { value: 'google/gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite (Google)' },
              { value: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash (Google)' },
              { value: 'google/gemini-2.5-pro', label: 'Gemini 2.5 Pro (Google)' },
              { value: 'google/gemini-2.0-flash-001', label: 'Gemini 2.0 Flash (Google)' },
              { value: 'google/gemini-3-flash-preview', label: 'Gemini 3 Flash Preview (Google)' },
              { value: 'deepseek/deepseek-r1', label: 'DeepSeek R1' },
              { value: 'deepseek/deepseek-chat', label: 'DeepSeek V3' },
              { value: 'meta-llama/llama-3.3-70b-instruct', label: 'Llama 3.3 70B (Meta)' },
              { value: 'qwen/qwen-2.5-72b-instruct', label: 'Qwen 2.5 72B' },
              { value: 'mistralai/mistral-large-2411', label: 'Mistral Large (Mistral AI)' },
            ]}
            error={errors.model?.message}
          />
          <p className="mt-1 text-xs text-gray-500">
            เลือกโมเดลที่ต้องการใช้สำหรับสร้างบทความ
          </p>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading}>
          Add API Key
        </Button>
      </div>
    </form>
  );
}
