import type { EntitlementType } from '@esparex/contracts';

export interface EntitlementPresentationMeta {
  label: string;
  description: string;
  icon: string;
  color: string;
  sortOrder: number;
}

export const ENTITLEMENT_PRESENTATION_REGISTRY: Record<EntitlementType, EntitlementPresentationMeta> = {
  AD_POSTING: {
    label: 'More Ads',
    description: 'Post additional listings beyond free monthly allowance',
    icon: 'package',
    color: 'emerald',
    sortOrder: 1,
  },
  PUSH_TO_TOP: {
    label: 'Top Ad Boost',
    description: 'Bump listing back to top of search results',
    icon: 'zap',
    color: 'amber',
    sortOrder: 2,
  },
  SPOTLIGHT_CAT: {
    label: 'Spotlight Boost',
    description: 'Featured placement in category search results',
    icon: 'sparkles',
    color: 'amber',
    sortOrder: 3,
  },
  SPOTLIGHT_HP: {
    label: 'Spotlight Boost',
    description: 'Featured placement on homepage carousel',
    icon: 'sparkles',
    color: 'amber',
    sortOrder: 4,
  },
  SMART_ALERT_SLOT: {
    label: 'Smart Alerts',
    description: 'Instant buyer request notifications',
    icon: 'bell',
    color: 'cyan',
    sortOrder: 5,
  },
  BUSINESS_PAGE: {
    label: 'Business Page',
    description: 'Custom business profile and storefront page',
    icon: 'building',
    color: 'violet',
    sortOrder: 6,
  },
};

export function getEntitlementPresentationMeta(type: string): EntitlementPresentationMeta {
  const key = type as EntitlementType;
  return ENTITLEMENT_PRESENTATION_REGISTRY[key] || {
    label: 'Credit Pack',
    description: 'Account credit entitlement',
    icon: 'package',
    color: 'emerald',
    sortOrder: 99,
  };
}

export function formatPlanName(rawName?: string): string {
  if (!rawName) return 'Free Starter Plan';
  const name = rawName.trim();
  if (name.includes('New_user_Plan') || name.toLowerCase().includes('free')) return 'Free Starter Plan';
  return name.replace(/_/g, ' ');
}
