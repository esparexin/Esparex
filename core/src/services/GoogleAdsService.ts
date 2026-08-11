import GoogleAdPlacement from "../models/GoogleAdPlacement";
import { GOOGLE_AD_STATUS, type GoogleAdPlacementDTO } from "@esparex/contracts";
import { AppError } from "../utils/AppError";

export const serializeGoogleAdPlacement = (doc: any): GoogleAdPlacementDTO => {
    return {
        id: doc._id.toString(),
        placementKey: doc.placementKey,
        name: doc.name,
        adSlotId: doc.adSlotId,
        publisherClientId: doc.publisherClientId,
        location: doc.location,
        format: doc.format,
        status: doc.status,
        viewports: doc.viewports || ["desktop", "tablet", "mobile"],
        priority: doc.priority || 0,
        fallbackStrategy: doc.fallbackStrategy,
        fallbackImageUri: doc.fallbackImageUri,
        fallbackTargetUrl: doc.fallbackTargetUrl,
        startDate: doc.startDate ? new Date(doc.startDate).toISOString() : undefined,
        endDate: doc.endDate ? new Date(doc.endDate).toISOString() : undefined,
        impressionsCount: doc.impressionsCount || 0,
        clicksCount: doc.clicksCount || 0,
        isDeleted: doc.isDeleted || false,
        createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : undefined,
        updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : undefined,
    };
};

export const getAdminGoogleAdPlacements = async (params: {
    location?: string;
    status?: string;
    search?: string;
    skip?: number;
    limit?: number;
}) => {
    const query: Record<string, unknown> = { isDeleted: { $ne: true } };

    if (params.status && params.status !== "all") {
        query.status = params.status;
    }
    if (params.location && params.location !== "all") {
        query.location = params.location;
    }
    if (params.search) {
        const regex = new RegExp(params.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
        query.$or = [{ name: regex }, { placementKey: regex }, { adSlotId: regex }];
    }

    const skip = params.skip || 0;
    const limit = params.limit || 20;

    const [items, total] = await Promise.all([
        GoogleAdPlacement.find(query).sort({ priority: -1, createdAt: -1 }).skip(skip).limit(limit),
        GoogleAdPlacement.countDocuments(query),
    ]);

    return {
        items: items.map(serializeGoogleAdPlacement),
        total,
    };
};

export const getPublicActiveGoogleAdPlacements = async () => {
    const now = new Date();
    const query = {
        status: GOOGLE_AD_STATUS.ACTIVE,
        isDeleted: { $ne: true },
        $or: [
            { startDate: { $exists: false } },
            { startDate: null },
            { startDate: { $lte: now } },
        ],
        $and: [
            {
                $or: [
                    { endDate: { $exists: false } },
                    { endDate: null },
                    { endDate: { $gte: now } },
                ],
            },
        ],
    };

    const items = await GoogleAdPlacement.find(query).sort({ priority: -1 });
    return items.map(serializeGoogleAdPlacement);
};

export const createGoogleAdPlacement = async (data: Partial<GoogleAdPlacementDTO>) => {
    const existing = await GoogleAdPlacement.findOne({ placementKey: data.placementKey, isDeleted: { $ne: true } });
    if (existing) {
        throw new AppError(`Placement with key '${data.placementKey}' already exists`, 400);
    }

    const placement = new GoogleAdPlacement({
        ...data,
        isDeleted: false,
    });

    await placement.save();
    return serializeGoogleAdPlacement(placement);
};

export const updateGoogleAdPlacement = async (id: string, data: Partial<GoogleAdPlacementDTO>) => {
    const placement = await GoogleAdPlacement.findOne({ _id: id, isDeleted: { $ne: true } });
    if (!placement) {
        throw new AppError("Ad placement not found", 404);
    }

    if (data.placementKey && data.placementKey !== placement.placementKey) {
        const duplicate = await GoogleAdPlacement.findOne({
            placementKey: data.placementKey,
            _id: { $ne: id },
            isDeleted: { $ne: true },
        });
        if (duplicate) {
            throw new AppError(`Placement key '${data.placementKey}' is taken`, 400);
        }
    }

    Object.assign(placement, data);
    await placement.save();
    return serializeGoogleAdPlacement(placement);
};

export const mutateGoogleAdPlacementStatus = async (id: string, status: string) => {
    const placement = await GoogleAdPlacement.findOne({ _id: id, isDeleted: { $ne: true } });
    if (!placement) {
        throw new AppError("Ad placement not found", 404);
    }

    placement.status = status;
    await placement.save();
    return serializeGoogleAdPlacement(placement);
};

export const deleteGoogleAdPlacement = async (id: string) => {
    const placement = await GoogleAdPlacement.findOne({ _id: id, isDeleted: { $ne: true } });
    if (!placement) {
        throw new AppError("Ad placement not found", 404);
    }

    placement.isDeleted = true;
    await placement.save();
    return true;
};
