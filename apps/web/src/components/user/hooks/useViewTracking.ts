import { useEffect, useRef } from 'react';
import type { QueryClient } from '@tanstack/react-query';
import { incrementListingView, type Listing as Ad } from '@/lib/api/user/listings';
import { queryKeys } from '@/hooks/queries/queryKeys';

export function useViewTracking(
  adId: string | number | undefined,
  isOwner: boolean,
  queryClient: QueryClient
) {
  const trackedViewRef = useRef<string | null>(null);

  useEffect(() => {
    trackedViewRef.current = undefined;
  }, [adId]);

  useEffect(() => {
    if (!adId || isOwner) {
      return;
    }

    const trackingKey = String(adId);
    if (trackedViewRef.current === trackingKey) {
      return;
    }

    trackedViewRef.current = trackingKey;
    let cancelled = false;

    void incrementListingView(adId)
      .then((response) => {
        if (!cancelled) {
          const isUnique = (response as { isUnique?: boolean })?.isUnique ?? false;
          
          queryClient.setQueryData<Ad | undefined>(queryKeys.ads.detail(String(adId)), (current) => {
            if (!current) return current;

            if (typeof current.views === "number") {
              return {
                ...current,
                views: current.views + 1,
              };
            }

            const currentViews = current.views && typeof current.views === "object"
              ? current.views as { total?: number; unique?: number; lastViewedAt?: string }
              : {};

            return {
              ...current,
              views: {
                ...currentViews,
                total: (typeof currentViews.total === "number" ? currentViews.total : 0) + 1,
                unique: (typeof currentViews.unique === "number" ? currentViews.unique : 0) + (isUnique ? 1 : 0),
                lastViewedAt: new Date().toISOString(),
              },
            };
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          trackedViewRef.current = undefined;
        }
      });

    return () => {
      cancelled = true;
    };
  }, [adId, isOwner, queryClient]);
}
