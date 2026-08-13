import { z } from 'zod';
import { optionalTrimmedStringSchema } from '../common/schema/common.schemas';

export const inContentPlacementIdSchema = z.enum([
  'listing_detail_sidebar_bottom',
  'listing_detail_below_description',
  'home_below_hero',
  'home_between_sections',
  'browse_in_feed',
  'global_footer',
]);

export const adProviderTypeSchema = z.enum([
  'google_adsense',
  'google_ad_manager',
  'custom_banner',
  'house_ad',
]);

export const adCampaignStatusSchema = z.enum([
  'draft',
  'active',
  'paused',
  'expired',
]);

export const adTargetingCriteriaSchema = z.object({
  states: z.array(z.string()).optional(),
  cities: z.array(z.string()).optional(),
  categories: z.array(z.string()).optional(),
  device: z.enum(['all', 'desktop', 'mobile', 'tablet']).optional(),
  userType: z.enum(['all', 'authenticated', 'guest', 'business']).optional(),
});

export const adFrequencyConfigSchema = z.object({
  interval: z.number().int().positive().optional(),
  maxPerPage: z.number().int().positive().optional(),
});

export const adRenderingRulesSchema = z.object({
  desktop: z.object({ width: z.number().positive(), height: z.number().positive() }),
  mobile: z.object({ width: z.number().positive(), height: z.number().positive() }),
  aspectRatio: z.string().optional(),
  responsive: z.boolean().default(true),
  spacingMarginY: z.string().optional(),
});

export const adProviderConfigSchema = z.object({
  googleSlotId: optionalTrimmedStringSchema,
  googlePublisherId: optionalTrimmedStringSchema,
  googleFormat: z.enum(['auto', 'rectangle', 'horizontal']).optional(),
  bannerImageUrl: optionalTrimmedStringSchema,
  bannerTargetUrl: optionalTrimmedStringSchema,
  bannerAltText: optionalTrimmedStringSchema,
  openInNewTab: z.boolean().optional(),
  trackingPixelUrl: optionalTrimmedStringSchema,
});

export const adMetricsSchema = z.object({
  impressions: z.number().int().nonnegative().default(0),
  clicks: z.number().int().nonnegative().default(0),
  ctr: z.number().nonnegative().default(0),
  lastServedAt: z.string().optional(),
});

export const adCampaignItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Campaign name is required'),
  placementId: inContentPlacementIdSchema,
  providerType: adProviderTypeSchema,
  priority: z.number().int().positive().default(1),
  status: adCampaignStatusSchema.default('active'),
  startAt: z.string().optional(),
  endAt: z.string().optional(),
  targeting: adTargetingCriteriaSchema.default({}),
  frequency: adFrequencyConfigSchema.optional(),
  rendering: adRenderingRulesSchema.optional(),
  providerConfig: adProviderConfigSchema.default({}),
  metrics: adMetricsSchema.optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const createAdCampaignSchema = z.object({
  name: z.string().min(1, 'Campaign name is required'),
  placementId: inContentPlacementIdSchema,
  providerType: adProviderTypeSchema,
  priority: z.number().int().positive().default(1),
  status: adCampaignStatusSchema.default('active'),
  startAt: z.string().optional(),
  endAt: z.string().optional(),
  targeting: adTargetingCriteriaSchema.optional().default({}),
  frequency: adFrequencyConfigSchema.optional(),
  rendering: adRenderingRulesSchema.optional(),
  providerConfig: adProviderConfigSchema.default({}),
});

export const updateAdCampaignSchema = createAdCampaignSchema.partial();

export const monetizationSystemStateSchema = z.object({
  featureEnabled: z.boolean().default(true),
  publishingEnabled: z.boolean().default(true),
  providers: z.object({
    googleAdsense: z.object({
      publisherId: z.string().default(''),
      autoAdsEnabled: z.boolean().default(false),
    }).optional(),
    googleAdManager: z.object({
      networkCode: z.string().default(''),
    }).optional(),
  }).default({}),
});

export const resolveAdRequestSchema = z.object({
  placementId: inContentPlacementIdSchema,
  device: z.enum(['desktop', 'mobile', 'tablet']).optional(),
  location: z.object({
    state: z.string().optional(),
    city: z.string().optional(),
  }).optional(),
  category: z.string().optional(),
  isAuthenticated: z.boolean().optional(),
  isBusiness: z.boolean().optional(),
});
