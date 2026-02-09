'use client';

import { useRef, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { articlesApi } from '@/lib/api';

interface Article {
  id: string;
  title: string;
  status: string;
}

export function useArticleNotifications() {
  const queryClient = useQueryClient();
  const previousStatuses = useRef<Map<string, string>>(new Map());

  const handleStatusChanges = useCallback(
    (articles: Article[]) => {
      const prev = previousStatuses.current;
      let hasChanges = false;

      for (const article of articles) {
        const prevStatus = prev.get(article.id);

        if (prevStatus && prevStatus !== article.status) {
          hasChanges = true;
          const title =
            article.title.length > 40
              ? article.title.slice(0, 40) + '...'
              : article.title;

          if (prevStatus === 'GENERATING' && article.status === 'READY') {
            toast.success(`บทความ "${title}" สร้างเสร็จแล้ว`);
          } else if (
            prevStatus === 'PUBLISHING' &&
            article.status === 'PUBLISHED'
          ) {
            toast.success(`บทความ "${title}" เผยแพร่สำเร็จ`);
          } else if (article.status === 'FAILED') {
            toast.error(`บทความ "${title}" ล้มเหลว`);
          }
        }
      }

      if (hasChanges) {
        queryClient.invalidateQueries({ queryKey: ['articles'] });
      }
    },
    [queryClient],
  );

  const { data } = useQuery({
    queryKey: ['articles', 'in-progress'],
    queryFn: async () => {
      const [generating, publishing] = await Promise.all([
        articlesApi.list({ status: 'GENERATING', limit: 50 }),
        articlesApi.list({ status: 'PUBLISHING', limit: 50 }),
      ]);

      const inProgress: Article[] = [
        ...(generating.data?.data || []),
        ...(publishing.data?.data || []),
      ];

      // On subsequent polls, check for articles that disappeared from in-progress
      // (meaning they transitioned to a final state)
      const prev = previousStatuses.current;
      if (prev.size > 0) {
        const currentIds = new Set(inProgress.map((a) => a.id));
        const missingIds = [...prev.keys()].filter(
          (id) => !currentIds.has(id),
        );

        if (missingIds.length > 0) {
          // Fetch the current state of articles that left in-progress
          const settled = await Promise.all(
            missingIds.map((id) =>
              articlesApi
                .get(id)
                .then((res) => res.data as Article)
                .catch(() => null),
            ),
          );

          const allArticles = [
            ...inProgress,
            ...settled.filter((a): a is Article => a !== null),
          ];
          handleStatusChanges(allArticles);
        }
      }

      // Update the ref with current statuses
      const newMap = new Map<string, string>();
      for (const article of inProgress) {
        newMap.set(article.id, article.status);
      }
      previousStatuses.current = newMap;

      return inProgress;
    },
    refetchInterval: (query) => {
      const articles = query.state.data;
      // Fast poll (5s) when there are in-progress articles, slow poll (30s) otherwise
      return articles && articles.length > 0 ? 5000 : 30000;
    },
    refetchIntervalInBackground: false,
  });

  return { inProgressCount: data?.length ?? 0 };
}
