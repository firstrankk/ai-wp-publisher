'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { schedulesApi, sitesApi } from '@/lib/api';
import { TONE_LABELS, LENGTH_LABELS, DAY_LABELS } from '@/lib/utils';

const createScheduleSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  siteId: z.string().min(1, 'Site is required'),
  frequency: z.coerce.number().min(1).max(7),
  timeStart: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  timeEnd: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  tone: z.enum(['FRIENDLY', 'FORMAL', 'EDUCATIONAL', 'SALES', 'PROFESSIONAL', 'HUMOROUS', 'INSPIRATIONAL', 'STORYTELLING', 'NEWS', 'REVIEW']),
  length: z.enum(['SHORT', 'MEDIUM', 'LONG']),
});

type CreateScheduleForm = z.infer<typeof createScheduleSchema>;

interface AddScheduleFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function AddScheduleForm({ onSuccess, onCancel }: AddScheduleFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 3, 5]); // Mon, Wed, Fri
  const [keywords, setKeywords] = useState('');

  const { data: sites } = useQuery({
    queryKey: ['sites-active'],
    queryFn: () => sitesApi.list({ status: 'ACTIVE', limit: 100 }).then((res) => res.data),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<CreateScheduleForm>({
    resolver: zodResolver(createScheduleSchema),
    defaultValues: {
      frequency: 3,
      timeStart: '09:00',
      timeEnd: '17:00',
      tone: 'FRIENDLY',
      length: 'MEDIUM',
    },
  });

  const watchedTone = watch('tone');
  const watchedLength = watch('length');

  const toggleDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  const onSubmit = async (data: CreateScheduleForm) => {
    if (selectedDays.length === 0) {
      toast.error('Please select at least one day');
      return;
    }

    setIsLoading(true);
    try {
      const keywordList = keywords
        .split('\n')
        .map((k) => k.trim())
        .filter(Boolean);

      await schedulesApi.create({
        ...data,
        days: selectedDays,
        keywords: keywordList,
      });

      toast.success('Schedule created');
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create schedule');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Schedule Name
        </label>
        <Input
          placeholder="e.g., Weekly Health Articles"
          {...register('name')}
          error={errors.name?.message}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Target Site
        </label>
        <Select
          {...register('siteId')}
          placeholder="Select a site"
          options={
            sites?.data?.map((site: any) => ({
              value: site.id,
              label: site.name,
            })) || []
          }
          error={errors.siteId?.message}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Posts per Week
          </label>
          <Input
            type="number"
            min={1}
            max={7}
            {...register('frequency')}
            error={errors.frequency?.message}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Active Days
          </label>
          <div className="flex gap-1">
            {DAY_LABELS.map((label, index) => (
              <button
                key={index}
                type="button"
                onClick={() => toggleDay(index)}
                className="w-8 h-8 rounded text-sm font-medium"
                style={{
                  backgroundColor: selectedDays.includes(index) ? '#2563eb' : '#f3f4f6',
                  color: selectedDays.includes(index) ? '#ffffff' : '#4b5563'
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Time
          </label>
          <Input type="time" {...register('timeStart')} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            End Time
          </label>
          <Input type="time" {...register('timeEnd')} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tone
          </label>
          <Select
            {...register('tone')}
            value={watchedTone}
            options={Object.entries(TONE_LABELS).map(([value, label]) => ({
              value,
              label,
            }))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Length
          </label>
          <Select
            {...register('length')}
            value={watchedLength}
            options={Object.entries(LENGTH_LABELS).map(([value, label]) => ({
              value,
              label,
            }))}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Keywords (one per line)
        </label>
        <textarea
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          placeholder="รีวิวมือถือ 2024&#10;เปรียบเทียบ iPhone vs Samsung&#10;มือถือราคาถูก"
          className="w-full h-32 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <p className="mt-1 text-xs text-gray-500">
          Add keywords that will be randomly selected for article generation
        </p>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading}>
          Create Schedule
        </Button>
      </div>
    </form>
  );
}
