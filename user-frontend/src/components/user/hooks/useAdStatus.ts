import { useState, useMemo } from 'react';
import type { Listing as Ad } from '@/lib/api/user/listings';
import { isAdSold, getSoldDetails } from '@/lib/logic/soldStatus';

export function useAdStatus(ad: Ad | undefined | null) {
  const [soldOverride, setSoldOverride] = useState<{
    adId: string;
    isSold: boolean;
    soldPlatform?: string;
    soldAt?: string;
  } | null>(null);

  const computedAdStatus = useMemo(() => {
    if (ad && isAdSold({ ad })) {
      const details = getSoldDetails(ad);
      return {
        isSold: true,
        soldPlatform: details?.soldPlatform,
        soldAt: details?.soldAt,
        isChatLocked: Boolean(ad.isChatLocked)
      };
    }

    return {
      isSold: false as const,
      isChatLocked: Boolean(ad?.isChatLocked)
    };
  }, [ad]);

  const adStatus = useMemo(() => {
    if (!ad) return computedAdStatus;
    if (soldOverride && soldOverride.adId === String(ad.id)) {
      return {
        isSold: soldOverride.isSold,
        soldPlatform: soldOverride.soldPlatform,
        soldAt: soldOverride.soldAt,
        isChatLocked: true,
      };
    }

    return computedAdStatus;
  }, [ad, computedAdStatus, soldOverride]);

  return { adStatus, soldOverride, setSoldOverride };
}
