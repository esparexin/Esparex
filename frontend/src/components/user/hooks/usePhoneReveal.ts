import { useState, useEffect } from 'react';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { getListingPhone, type Listing as Ad } from '@/lib/api/user/listings';
import type { User } from '@/types/User';
import { notify } from '@/lib/notify';
import { buildLoginUrl } from '@/lib/authHelpers';

export function usePhoneReveal(ad: Ad | undefined | null, user: User | undefined | null, router: AppRouterInstance) {
  const [revealedPhone, setRevealedPhone] = useState<string | null>(null);
  const [isPhoneMasked, setIsPhoneMasked] = useState(false);
  const [phoneMessage, setPhoneMessage] = useState<string | null>(null);
  const [isPhoneLoading, setIsPhoneLoading] = useState(false);

  useEffect(() => {
    setRevealedPhone(null);
    setIsPhoneMasked(false);
    setPhoneMessage(null);
  }, [ad?.id]);

  const handleRevealPhone = async () => {
    if (!ad?.id || isPhoneLoading) return;

    if (revealedPhone && !isPhoneMasked) {
      window.location.href = `tel:${revealedPhone}`;
      return;
    }

    if (revealedPhone && isPhoneMasked && !user) {
      const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      void router.push(buildLoginUrl(returnTo));
      return;
    }

    setIsPhoneLoading(true);
    setPhoneMessage(null);

    try {
      const result = await getListingPhone(ad.id);
      if (result?.mobile || result?.phone) {
        const phone = result.mobile || result.phone || null;
        setRevealedPhone(phone);
        setIsPhoneMasked(false);
        setPhoneMessage(null);
        return;
      }

      if (result?.masked) {
        setRevealedPhone(result.masked);
        setIsPhoneMasked(true);
        setPhoneMessage("Login to reveal the full phone number.");
        return;
      }

      setPhoneMessage("Phone number is unavailable for this listing.");
    } catch (phoneError) {
      const backendCode = String(
        (phoneError as { context?: { backendErrorCode?: unknown } })?.context?.backendErrorCode || ""
      );
      if (backendCode === "PHONE_REQUEST_REQUIRED") {
        const message = "Seller shares phone numbers on request only. Use chat first.";
        setPhoneMessage(message);
        notify.info(message);
      } else if (backendCode === "PHONE_HIDDEN") {
        const message = "Seller chose not to share a phone number for this listing.";
        setPhoneMessage(message);
        notify.info(message);
      } else {
        notify.error(phoneError instanceof Error ? phoneError.message : "Failed to reveal phone number");
      }
    } finally {
      setIsPhoneLoading(false);
    }
  };

  return { revealedPhone, isPhoneMasked, phoneMessage, isPhoneLoading, handleRevealPhone };
}
