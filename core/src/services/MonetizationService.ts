import { Types } from "mongoose";
import {
    getAdvertisementCampaignModel,
    getMonetizationConfigModel,
    IAdvertisementCampaign,
} from "../models/AdvertisementCampaign";
import type {
    AdCampaignItem,
    MonetizationSystemState,
    ResolveAdRequest,
    ResolveAdResponse,
} from "@esparex/contracts";

type QueryFilter<T = unknown> = Record<string, unknown>;

interface RawCampaignDoc extends Omit<Partial<IAdvertisementCampaign>, "_id"> {
    _id?: Types.ObjectId | string;
    id?: string;
}

const mapDocToCampaignItem = (doc: RawCampaignDoc): AdCampaignItem => ({
    id: String(doc._id || doc.id || ""),
    name: doc.name || "",
    placementId: doc.placementId || "listing_detail_sidebar_bottom",
    providerType: doc.providerType || "google_adsense",
    priority: doc.priority || 1,
    status: doc.status || "active",
    startAt: doc.startAt ? new Date(doc.startAt).toISOString() : undefined,
    endAt: doc.endAt ? new Date(doc.endAt).toISOString() : undefined,
    targeting: doc.targeting || {},
    frequency: doc.frequency,
    rendering: doc.rendering,
    providerConfig: doc.providerConfig || {},
    metrics: doc.metrics,
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : new Date().toISOString(),
});

export class MonetizationService {
    /**
     * Resolve the most appropriate active campaign for a given placement context
     */
    static async resolveAd(request: ResolveAdRequest): Promise<ResolveAdResponse> {
        const configModel = getMonetizationConfigModel();
        const config = await configModel.findOne().lean();

        // If advertising is globally disabled
        if (config && (!config.featureEnabled || !config.publishingEnabled)) {
            return { ad: null, fallbackAd: null, renderedProvider: "none" };
        }

        const campaignModel = getAdvertisementCampaignModel();
        const now = new Date();

        // Query active campaigns for this placement
        const query: QueryFilter<IAdvertisementCampaign> = {
            placementId: request.placementId,
            status: "active",
            $and: [
                {
                    $or: [
                        { startAt: null },
                        { startAt: { $lte: now } },
                    ],
                },
                {
                    $or: [
                        { endAt: null },
                        { endAt: { $gte: now } },
                    ],
                },
            ],
        };

        const activeCampaigns = await campaignModel
            .find(query)
            .sort({ priority: 1, createdAt: -1 })
            .lean();

        if (!activeCampaigns || activeCampaigns.length === 0) {
            return { ad: null, fallbackAd: null, renderedProvider: "none" };
        }

        // Filter by targeting criteria
        const matchingCampaigns = activeCampaigns.filter((campaign) => {
            const targeting = campaign.targeting;
            if (!targeting) return true;

            // Device targeting
            if (targeting.device && targeting.device !== "all") {
                if (request.device && request.device !== targeting.device) {
                    return false;
                }
            }

            // Location targeting (State / City)
            if (targeting.states && targeting.states.length > 0 && request.location?.state) {
                const matchState = targeting.states.some(
                    (s) => s.toLowerCase() === request.location?.state?.toLowerCase()
                );
                if (!matchState) return false;
            }

            if (targeting.cities && targeting.cities.length > 0 && request.location?.city) {
                const matchCity = targeting.cities.some(
                    (c) => c.toLowerCase() === request.location?.city?.toLowerCase()
                );
                if (!matchCity) return false;
            }

            // Category targeting
            if (targeting.categories && targeting.categories.length > 0 && request.category) {
                const matchCat = targeting.categories.some(
                    (cat) => cat.toLowerCase() === request.category?.toLowerCase()
                );
                if (!matchCat) return false;
            }

            // User type targeting
            if (targeting.userType && targeting.userType !== "all") {
                if (targeting.userType === "authenticated" && !request.isAuthenticated) return false;
                if (targeting.userType === "guest" && request.isAuthenticated) return false;
                if (targeting.userType === "business" && !request.isBusiness) return false;
            }

            return true;
        });

        if (matchingCampaigns.length === 0) {
            return { ad: null, fallbackAd: null, renderedProvider: "none" };
        }

        const primaryDoc = matchingCampaigns[0];
        const fallbackDoc = matchingCampaigns[1] || null;

        const primaryAd = mapDocToCampaignItem(primaryDoc as RawCampaignDoc);
        const fallbackAd = fallbackDoc ? mapDocToCampaignItem(fallbackDoc as RawCampaignDoc) : null;

        return {
            ad: primaryAd,
            fallbackAd,
            renderedProvider: primaryAd.providerType,
        };
    }

    /**
     * Record an ad impression
     */
    static async recordImpression(campaignId: string): Promise<void> {
        const campaignModel = getAdvertisementCampaignModel();
        await campaignModel.findByIdAndUpdate(campaignId, {
            $inc: { "metrics.impressions": 1 },
            $set: { "metrics.lastServedAt": new Date() },
        });
    }

    /**
     * Record an ad click and update CTR
     */
    static async recordClick(campaignId: string): Promise<void> {
        const campaignModel = getAdvertisementCampaignModel();
        const campaign = await campaignModel.findById(campaignId);
        if (!campaign) return;

        const impressions = Math.max(1, (campaign.metrics?.impressions || 0) + 1);
        const clicks = (campaign.metrics?.clicks || 0) + 1;
        const ctr = Number(((clicks / impressions) * 100).toFixed(2));

        await campaignModel.findByIdAndUpdate(campaignId, {
            $set: {
                "metrics.clicks": clicks,
                "metrics.ctr": ctr,
            },
        });
    }

    /**
     * Admin: Get all campaigns
     */
    static async getAdminCampaigns(): Promise<AdCampaignItem[]> {
        const campaignModel = getAdvertisementCampaignModel();
        const docs = await campaignModel.find().sort({ priority: 1, createdAt: -1 }).lean();
        return docs.map((doc) => mapDocToCampaignItem(doc as RawCampaignDoc));
    }

    /**
     * Admin: Create campaign
     */
    static async createCampaign(data: Partial<AdCampaignItem>): Promise<AdCampaignItem> {
        const campaignModel = getAdvertisementCampaignModel();
        const created = await campaignModel.create(data);
        return {
            id: String(created._id),
            name: created.name,
            placementId: created.placementId,
            providerType: created.providerType,
            priority: created.priority,
            status: created.status,
            startAt: created.startAt ? new Date(created.startAt).toISOString() : undefined,
            endAt: created.endAt ? new Date(created.endAt).toISOString() : undefined,
            targeting: created.targeting || {},
            frequency: created.frequency,
            rendering: created.rendering,
            providerConfig: created.providerConfig || {},
            metrics: created.metrics,
            createdAt: created.createdAt.toISOString(),
            updatedAt: created.updatedAt.toISOString(),
        };
    }

    /**
     * Admin: Update campaign
     */
    static async updateCampaign(id: string, data: Partial<AdCampaignItem>): Promise<AdCampaignItem | null> {
        const campaignModel = getAdvertisementCampaignModel();
        const updated = await campaignModel.findByIdAndUpdate(id, { $set: data }, { new: true });
        if (!updated) return null;
        return {
            id: String(updated._id),
            name: updated.name,
            placementId: updated.placementId,
            providerType: updated.providerType,
            priority: updated.priority,
            status: updated.status,
            startAt: updated.startAt ? new Date(updated.startAt).toISOString() : undefined,
            endAt: updated.endAt ? new Date(updated.endAt).toISOString() : undefined,
            targeting: updated.targeting || {},
            frequency: updated.frequency,
            rendering: updated.rendering,
            providerConfig: updated.providerConfig || {},
            metrics: updated.metrics,
            createdAt: updated.createdAt.toISOString(),
            updatedAt: updated.updatedAt.toISOString(),
        };
    }

    /**
     * Admin: Delete campaign
     */
    static async deleteCampaign(id: string): Promise<boolean> {
        const campaignModel = getAdvertisementCampaignModel();
        const result = await campaignModel.findByIdAndDelete(id);
        return Boolean(result);
    }

    /**
     * Admin: Get Monetization System Configuration
     */
    static async getMonetizationConfig(): Promise<MonetizationSystemState> {
        const configModel = getMonetizationConfigModel();
        let config = await configModel.findOne().lean();
        if (!config) {
            config = await configModel.create({
                featureEnabled: true,
                publishingEnabled: true,
                providers: {
                    googleAdsense: { publisherId: "", autoAdsEnabled: false },
                },
            });
        }
        return {
            featureEnabled: config.featureEnabled,
            publishingEnabled: config.publishingEnabled,
            providers: config.providers || {},
        };
    }

    /**
     * Admin: Update Monetization System Configuration
     */
    static async updateMonetizationConfig(data: Partial<MonetizationSystemState>): Promise<MonetizationSystemState> {
        const configModel = getMonetizationConfigModel();
        const updated = await configModel.findOneAndUpdate(
            {},
            { $set: data },
            { upsert: true, new: true }
        );
        return {
            featureEnabled: updated.featureEnabled,
            publishingEnabled: updated.publishingEnabled,
            providers: updated.providers || {},
        };
    }
}
