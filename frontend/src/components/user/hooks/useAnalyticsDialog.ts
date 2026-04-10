import { useState, useEffect, useMemo } from 'react';
import { getListingAnalytics, type Listing as Ad, type ListingAnalytics } from '@/lib/api/user/listings';
import { notify } from '@/lib/notify';

export function useAnalyticsDialog(ad: Ad | undefined | null, viewCount: number) {
  const [showAnalyticsDialog, setShowAnalyticsDialog] = useState(false);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);
  const [analytics, setAnalytics] = useState<ListingAnalytics | null>(null);

  useEffect(() => {
    setAnalytics(null);
    setShowAnalyticsDialog(false);
  }, [ad?.id]);

  const analyticsSummary = useMemo(() => {
    const analyticsViews = analytics?.views;
    if (typeof analyticsViews === "number") {
      return {
        total: analyticsViews,
        unique: analyticsViews,
        lastViewedAt: null,
      };
    }

    if (analyticsViews && typeof analyticsViews === "object") {
      return {
        total: typeof analyticsViews.total === "number" ? analyticsViews.total : viewCount,
        unique: typeof analyticsViews.unique === "number" ? analyticsViews.unique : viewCount,
        lastViewedAt: typeof analyticsViews.lastViewedAt === "string" ? analyticsViews.lastViewedAt : null,
      };
    }

    const currentViews = ad?.views && typeof ad.views === "object"
      ? ad.views as { unique?: number; lastViewedAt?: string }
      : null;

    return {
      total: viewCount,
      unique: typeof currentViews?.unique === "number" ? currentViews.unique : viewCount,
      lastViewedAt: typeof currentViews?.lastViewedAt === "string" ? currentViews.lastViewedAt : null,
    };
  }, [ad?.views, analytics, viewCount]);

  const handleViewAnalytics = async () => {
    if (!ad?.id) return;

    setShowAnalyticsDialog(true);
    setIsAnalyticsLoading(true);
    try {
      const result = await getListingAnalytics(ad.id);
      if (result) {
        setAnalytics(result);
      } else {
        notify.info("No analytics available yet for this listing.");
      }
    } catch {
      notify.error("Failed to load listing analytics");
    } finally {
      setIsAnalyticsLoading(false);
    }
  };

  return {
    showAnalyticsDialog,
    setShowAnalyticsDialog,
    isAnalyticsLoading,
    analyticsSummary,
    handleViewAnalytics
  };
}
