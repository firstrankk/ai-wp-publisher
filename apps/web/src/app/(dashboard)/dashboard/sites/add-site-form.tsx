'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { sitesApi } from '@/lib/api';

const addSiteSchema = z.object({
  name: z.string().min(1, 'Site name is required'),
  url: z.string().url('Invalid URL'),
  username: z.string().min(1, 'Username is required'),
  appPassword: z.string().min(1, 'App password is required'),
});

type AddSiteForm = z.infer<typeof addSiteSchema>;

interface AddSiteFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function AddSiteForm({ onSuccess, onCancel }: AddSiteFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AddSiteForm>({
    resolver: zodResolver(addSiteSchema),
  });

  const onSubmit = async (data: AddSiteForm) => {
    setIsLoading(true);
    try {
      await sitesApi.create(data);
      toast.success('Site added successfully');
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to add site');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>
          Site Name
        </label>
        <Input
          placeholder="My WordPress Site"
          {...register('name')}
          error={errors.name?.message}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>
          Site URL
        </label>
        <Input
          placeholder="https://example.com"
          {...register('url')}
          error={errors.url?.message}
        />
        <p className="mt-1 text-xs" style={{ color: '#6b7280' }}>
          The full URL of your WordPress site
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>
          WordPress Username
        </label>
        <Input
          placeholder="admin"
          {...register('username')}
          error={errors.username?.message}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>
          Application Password
        </label>
        <Input
          type="password"
          placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"
          {...register('appPassword')}
          error={errors.appPassword?.message}
        />
        <p className="mt-1 text-xs" style={{ color: '#6b7280' }}>
          Generate an Application Password in WordPress Users {'>'} Profile {'>'} Application Passwords
        </p>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading}>
          Add Site
        </Button>
      </div>
    </form>
  );
}
