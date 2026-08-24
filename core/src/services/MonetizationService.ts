import { Types } from "mongoose";
import {
    getAdvertisementCampaignModel,
    getMonetizationConfigModel,
    IAdvertisementCampaign,
} from "../models/AdvertisementCampaign";
import {
    getPlacementEquivalents,
    type AdCampaignItem,
    type AdTargetingCriteria,
    type MonetizationSystemState,
    type ResolveAdRequest,
    type ResolveAdResponse,
} from "@esparex/contracts";

interface RawCampaignDoc extends Omit<Partial<IAdvertisementCampaign>, "_id"> {
    _id?: Types.ObjectId | string;
    id?: string;
}

const mapDocToCampaignItem = (doc: RawCampaignDoc): AdCampaignItem => ({
    id: String(doc._id || doc.id || ""),
    name: doc.name || "",
    placementId: doc.placementId || "homepage_hero_top",
    providerType: doc.providerType || "google_adsense",
    priority: doc.priority || 1,
    status: doc.status || "active",
    fallbackStrategy: doc.fallbackStrategy || "collapse",
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

const matchesTargeting = (targeting: AdTargetingCriteria | undefined, req: ResolveAdRequest): boolean => {
    if (!targeting) return true;
    if (targeting.device && targeting.device !== "all" && req.device && req.device !== targeting.device) {
        return false;
    }
    if (targeting.viewports?.length && req.device && !targeting.viewports.includes(req.device)) {
        return false;
    }
    if (targeting.states?.length && req.location?.state) {
        if (!targeting.states.some((s: string) => s.toLowerCase() === req.location?.state?.toLowerCase())) return false;
    }
    if (targeting.cities?.length && req.location?.city) {
        if (!targeting.cities.some((c: string) => c.toLowerCase() === req.location?.city?.toLowerCase())) return false;
    }
    if (targeting.categories?.length && req.category) {
        if (!targeting.categories.some((cat: string) => cat.toLowerCase() === req.category?.toLowerCase())) return false;
    }
    if (targeting.userType && targeting.userType !== "all") {
        if (targeting.userType === "authenticated" && !req.isAuthenticated) return false;
        if (targeting.userType === "guest" && req.isAuthenticated) return false;
        if (targeting.userType === "business" && !req.isBusiness) return false;
    }
    return true;
};

export class MonetizationService {
    static async resolveAd(request: ResolveAdRequest): Promise<ResolveAdResponse> {
        const configModel = getMonetizationConfigModel();
        const config = await configModel.findOne().lean();
        if (config && (!config.featureEnabled || !config.publishingEnabled)) {
            return { ad: null, fallbackAd: null, renderedProvider: "none" };
        }

        const campaignModel = getAdvertisementCampaignModel();
        const now = new Date();
        const placementEquivalents = getPlacementEquivalents(request.placementId);

        const activeCampaigns = await campaignModel
            .find({
                placementId: { $in: placementEquivalents },
                status: "active",
                $and: [
                    { $or: [{ startAt: null }, { startAt: { $lte: now } }] },
                    { $or: [{ endAt: null }, { endAt: { $gte: now } }] },
                ],
            } as Record<string, unknown>)
            .sort({ priority: 1, createdAt: -1 })
            .lean();

        if (!activeCampaigns || activeCampaigns.length === 0) {
            return { ad: null, fallbackAd: null, renderedProvider: "none" };
        }

        const matching = activeCampaigns.filter((c) => matchesTargeting(c.targeting, request));
        if (matching.length === 0) {
            return { ad: null, fallbackAd: null, renderedProvider: "none" };
        }

        const primaryAd = mapDocToCampaignItem(matching[0] as RawCampaignDoc);
        const fallbackAd = matching[1] ? mapDocToCampaignItem(matching[1] as RawCampaignDoc) : null;

        if (primaryAd.providerType === "google_adsense" && !primaryAd.providerConfig.googlePublisherId) {
            primaryAd.providerConfig.googlePublisherId = config?.providers?.googleAdsense?.publisherId || "";
        }

        return { ad: primaryAd, fallbackAd, renderedProvider: primaryAd.providerType };
    }

    static async recordImpression(campaignId: string): Promise<void> {
        const campaignModel = getAdvertisementCampaignModel();
        await campaignModel.findByIdAndUpdate(campaignId, {
            $inc: { "metrics.impressions": 1 },
            $set: { "metrics.lastServedAt": new Date() },
        });
    }

    static async recordClick(campaignId: string): Promise<void> {
        const campaignModel = getAdvertisementCampaignModel();
        const campaign = await campaignModel.findById(campaignId);
        if (!campaign) return;

        const impressions = Math.max(1, (campaign.metrics?.impressions || 0) + 1);
        const clicks = (campaign.metrics?.clicks || 0) + 1;
        const ctr = Number(((clicks / impressions) * 100).toFixed(2));

        await campaignModel.findByIdAndUpdate(campaignId, {
            $set: { "metrics.clicks": clicks, "metrics.ctr": ctr },
        });
    }

    static async getAdminCampaigns(): Promise<AdCampaignItem[]> {
        const campaignModel = getAdvertisementCampaignModel();
        const docs = await campaignModel.find().sort({ priority: 1, createdAt: -1 }).lean();
        return docs.map((doc) => mapDocToCampaignItem(doc as RawCampaignDoc));
    }

    static async createCampaign(data: Partial<AdCampaignItem>): Promise<AdCampaignItem> {
        const campaignModel = getAdvertisementCampaignModel();
        const created = await campaignModel.create(data);
        return mapDocToCampaignItem(created.toObject() as RawCampaignDoc);
    }

    static async updateCampaign(id: string, data: Partial<AdCampaignItem>): Promise<AdCampaignItem | null> {
        const campaignModel = getAdvertisementCampaignModel();
        const updated = await campaignModel.findByIdAndUpdate(id, { $set: data }, { new: true });
        return updated ? mapDocToCampaignItem(updated.toObject() as RawCampaignDoc) : null;
    }

    static async deleteCampaign(id: string): Promise<boolean> {
        const campaignModel = getAdvertisementCampaignModel();
        const result = await campaignModel.findByIdAndDelete(id);
        return Boolean(result);
    }

    static async getMonetizationConfig(): Promise<MonetizationSystemState> {
        const configModel = getMonetizationConfigModel();
        let config = await configModel.findOne().lean();
        if (!config) {
            config = await configModel.create({
                featureEnabled: true,
                publishingEnabled: true,
                providers: { googleAdsense: { publisherId: "", autoAdsEnabled: false } },
            });
        }
        return {
            featureEnabled: config.featureEnabled,
            publishingEnabled: config.publishingEnabled,
            providers: config.providers || {},
        };
    }

    static async updateMonetizationConfig(data: Partial<MonetizationSystemState>): Promise<MonetizationSystemState> {
        const configModel = getMonetizationConfigModel();
        const updated = await configModel.findOneAndUpdate({}, { $set: data }, { upsert: true, new: true });
        return {
            featureEnabled: updated.featureEnabled,
            publishingEnabled: updated.publishingEnabled,
            providers: updated.providers || {},
        };
    }
}
