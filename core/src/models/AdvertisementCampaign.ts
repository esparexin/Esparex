import { Schema, Document, Model, Connection } from "mongoose";
import { getUserConnection } from "../config/db";
import { applyToJSONTransform } from '../utils/schemaOptions';
import type { AdCampaignItem, MonetizationSystemState } from "@esparex/contracts";

export interface IAdvertisementCampaign extends Document, Omit<AdCampaignItem, "id" | "createdAt" | "updatedAt"> {
    createdAt: Date;
    updatedAt: Date;
}

const AdvertisementCampaignSchema = new Schema<IAdvertisementCampaign>(
    {
        name: { type: String, required: true, trim: true },
        placementId: {
            type: String,
            required: true,
            enum: [
                'homepage_hero_top',
                'homepage_feed_inline',
                'search_results_header',
                'search_results_inline',
                'category_page_header',
                'category_page_inline',
                'listing_details_sidebar',
                'listing_details_incontent',
                'services_page_header',
                'spare_parts_header',
                'business_profile_sidebar',
                'user_dashboard_top',
                'user_my_listings_inline',
                'business_dashboard_top',
                'static_pages_footer',
                'footer_leaderboard',
                'mobile_sticky_bottom',
                // Legacy aliases
                'listing_detail_sidebar_bottom',
                'listing_detail_below_description',
                'home_below_hero',
                'home_between_sections',
                'browse_in_feed',
                'global_footer',
            ],
            index: true,
        },
        providerType: {
            type: String,
            required: true,
            enum: ['google_adsense', 'google_ad_manager', 'custom_banner', 'house_ad'],
            default: 'google_adsense',
        },
        priority: { type: Number, required: true, default: 1, min: 1, index: true },
        status: {
            type: String,
            required: true,
            enum: ['draft', 'active', 'paused', 'expired'],
            default: 'active',
            index: true,
        },
        fallbackStrategy: {
            type: String,
            enum: ['collapse', 'house_ad', 'internal_promo'],
            default: 'collapse',
        },
        startAt: { type: Date, default: null },
        endAt: { type: Date, default: null },
        targeting: {
            states: { type: [String], default: [] },
            cities: { type: [String], default: [] },
            categories: { type: [String], default: [] },
            device: {
                type: String,
                enum: ['all', 'desktop', 'mobile', 'tablet'],
                default: 'all',
            },
            viewports: {
                type: [String],
                default: ['desktop', 'tablet', 'mobile'],
            },
            userType: {
                type: String,
                enum: ['all', 'authenticated', 'guest', 'business'],
                default: 'all',
            },
        },
        frequency: {
            interval: { type: Number, default: 8 },
            maxPerPage: { type: Number, default: 2 },
        },
        rendering: {
            desktop: {
                width: { type: Number, default: 300 },
                height: { type: Number, default: 250 },
            },
            mobile: {
                width: { type: Number, default: 300 },
                height: { type: Number, default: 250 },
            },
            aspectRatio: { type: String },
            responsive: { type: Boolean, default: true },
            spacingMarginY: { type: String },
        },
        providerConfig: {
            googleSlotId: { type: String, trim: true },
            googlePublisherId: { type: String, trim: true },
            googleFormat: {
                type: String,
                enum: ['auto', 'rectangle', 'horizontal', 'vertical', 'fluid'],
                default: 'auto',
            },
            bannerImageUrl: { type: String, trim: true },
            bannerTargetUrl: { type: String, trim: true },
            bannerAltText: { type: String, trim: true },
            openInNewTab: { type: Boolean, default: true },
            trackingPixelUrl: { type: String, trim: true },
        },
        metrics: {
            impressions: { type: Number, default: 0 },
            clicks: { type: Number, default: 0 },
            ctr: { type: Number, default: 0 },
            lastServedAt: { type: Date },
        },
    },
    {
        timestamps: true,
    }
);

AdvertisementCampaignSchema.index({ placementId: 1, status: 1, priority: 1 });
applyToJSONTransform(AdvertisementCampaignSchema);

export interface IMonetizationConfigDoc extends Document, MonetizationSystemState {
    updatedAt: Date;
}

const MonetizationConfigSchema = new Schema<IMonetizationConfigDoc>(
    {
        featureEnabled: { type: Boolean, default: true },
        publishingEnabled: { type: Boolean, default: true },
        providers: {
            googleAdsense: {
                publisherId: { type: String, default: '' },
                autoAdsEnabled: { type: Boolean, default: false },
            },
            googleAdManager: {
                networkCode: { type: String, default: '' },
            },
        },
    },
    {
        timestamps: true,
    }
);
applyToJSONTransform(MonetizationConfigSchema);

export const getAdvertisementCampaignModel = (conn?: Connection): Model<IAdvertisementCampaign> => {
    const connection = conn || getUserConnection();
    return (
        (connection.models.AdvertisementCampaign as Model<IAdvertisementCampaign>) ||
        connection.model("AdvertisementCampaign", AdvertisementCampaignSchema, "advertisement_campaigns")
    );
};

export const getMonetizationConfigModel = (conn?: Connection): Model<IMonetizationConfigDoc> => {
    const connection = conn || getUserConnection();
    return (
        (connection.models.MonetizationConfig as Model<IMonetizationConfigDoc>) ||
        connection.model("MonetizationConfig", MonetizationConfigSchema, "monetization_config")
    );
};
