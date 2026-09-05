import CatalogRequest from '../../../../models/CatalogRequest';
import Brand from '../../../../models/Brand';
import Model from '../../../../models/Model';

export interface CatalogRequestPayload {
    requestType: 'brand' | 'model';
    categoryId: string;
    parentBrandId?: string;
    requestedName: string;
    canonicalName: string;
    slug: string;
    requestedBy: string;
    /** Optional soft reference to the related listing. Null for new-ad flow. */
    listingId?: string;
}

export const findOrCreateCatalogRequest = async (payload: CatalogRequestPayload) => {
    const dedupeQuery = {
        requestType: payload.requestType,
        categoryId: payload.categoryId,
        parentBrandId: payload.requestType === 'model' ? payload.parentBrandId ?? null : null,
        $or: [
            { canonicalName: payload.canonicalName },
            { normalizedName: payload.canonicalName },
        ],
        status: 'pending' as const,
    };

    const existingPending = await CatalogRequest.findOne(dedupeQuery);

    if (existingPending) {
        const isAlreadyRequester =
            existingPending.requestedByUsers?.some(
                (u) => String(u) === String(payload.requestedBy)
            ) || String(existingPending.requestedBy) === String(payload.requestedBy);

        const updateOp: Record<string, unknown> = {
            $addToSet: { requestedByUsers: payload.requestedBy },
        };
        if (!isAlreadyRequester) {
            updateOp.$inc = { requestCount: 1 };
        }

        const updated = await CatalogRequest.findByIdAndUpdate(
            existingPending._id,
            updateOp,
            { new: true }
        );

        return { request: updated ?? existingPending, isNew: false };
    }

    const createdRequest = await CatalogRequest.create({
        requestType: payload.requestType,
        categoryId: payload.categoryId,
        parentBrandId: payload.requestType === 'model' ? payload.parentBrandId : null,
        listingId: payload.listingId ?? null,
        requestedName: payload.requestedName,
        canonicalName: payload.canonicalName,
        normalizedName: payload.canonicalName,
        slug: payload.slug,
        requestedBy: payload.requestedBy,
        requestedByUsers: [payload.requestedBy],
        requestCount: 1,
        status: 'pending',
    } as Record<string, unknown>);

    return { request: createdRequest, isNew: true };
};

export const getCatalogRequests = async (filter: Record<string, unknown>, skip: number, limit: number, populateRequestedBy = false) => {
    let query = CatalogRequest.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);
    
    if (populateRequestedBy) {
        query = query
            .populate('requestedBy', 'firstName lastName email mobile')
            .populate('categoryId', 'name slug')
            .populate('parentBrandId', 'name slug');
    }

    const [items, total] = await Promise.all([
        query,
        CatalogRequest.countDocuments(filter),
    ]);

    return { items, total };
};

export const getCatalogRequestById = async (id: string, populateRequestedBy = false) => {
    let query = CatalogRequest.findById(id);
    
    if (populateRequestedBy) {
        query = query
            .populate('requestedBy', 'firstName lastName email mobile')
            .populate('categoryId', 'name slug')
            .populate('parentBrandId', 'name slug');
    }

    return await query;
};

export const deleteCatalogRequestById = async (id: string) => {
    return CatalogRequest.findByIdAndDelete(id);
};

export const bulkDeleteCatalogRequests = async (requestIds: string[]) => {
    const result = await CatalogRequest.deleteMany({ _id: { $in: requestIds } });
    return { deletedCount: result.deletedCount };
};

export const getCatalogRequestStats = async (match: Record<string, unknown>) => {
    const [groupedCounts, totalCount] = await Promise.all([
        CatalogRequest.aggregate<{
            _id: { requestType: 'brand' | 'model'; status: 'pending' | 'approved' | 'rejected' | 'duplicate' };
            count: number;
        }>([
            { $match: match },
            {
                $group: {
                    _id: {
                        requestType: '$requestType',
                        status: '$status',
                    },
                    count: { $sum: 1 },
                },
            },
        ]),
        CatalogRequest.countDocuments(match),
    ]);

    return { groupedCounts, totalCount };
};

export const resolveCatalogRequestsForSubmission = async (params: {
    categoryId: string;
    brandId?: string;
    customBrandName?: string;
    modelId?: string;
    customModelName?: string;
    userId: string;
}): Promise<{
    brandId?: string;
    pendingBrandRequestId?: string;
    modelId?: string;
    pendingModelRequestId?: string;
}> => {
    let resolvedBrandId = params.brandId;
    let pendingBrandRequestId: string | undefined;
    let resolvedModelId = params.modelId;
    let pendingModelRequestId: string | undefined;

    // Handle proposed custom brand
    if (!resolvedBrandId && params.customBrandName && params.customBrandName.trim().length > 0) {
        const trimmedBrand = params.customBrandName.trim();
        const canonicalBrand = trimmedBrand.toLowerCase().replace(/\s+/g, ' ');

        // 1. Canonical DB Pre-Check: If brand already exists in category, re-bind and skip request creation
        const existingBrand = await Brand.findOne({
            canonicalName: canonicalBrand,
            categoryIds: params.categoryId,
            isDeleted: { $ne: true },
        });

        if (existingBrand) {
            resolvedBrandId = String(existingBrand._id);
        } else {
            const brandRequest = await findOrCreateCatalogRequest({
                requestType: 'brand',
                categoryId: params.categoryId,
                requestedName: trimmedBrand,
                canonicalName: canonicalBrand,
                slug: `brand-request-${Date.now()}`,
                requestedBy: params.userId,
            });
            pendingBrandRequestId = String(brandRequest.request._id);
        }
    }

    // Handle proposed custom model
    if (!resolvedModelId && params.customModelName && params.customModelName.trim().length > 0) {
        const trimmedModel = params.customModelName.trim();
        const canonicalModel = trimmedModel.toLowerCase().replace(/\s+/g, ' ');

        // 2. Canonical DB Pre-Check: If model already exists under parent brand, re-bind and skip request creation
        let existingModel = null;
        if (resolvedBrandId) {
            existingModel = await Model.findOne({
                brandId: resolvedBrandId,
                canonicalName: canonicalModel,
                isDeleted: { $ne: true },
            });
        }

        if (existingModel) {
            resolvedModelId = String(existingModel._id);
        } else {
            const modelRequest = await findOrCreateCatalogRequest({
                requestType: 'model',
                categoryId: params.categoryId,
                parentBrandId: resolvedBrandId,
                requestedName: trimmedModel,
                canonicalName: canonicalModel,
                slug: `model-request-${Date.now()}`,
                requestedBy: params.userId,
            });
            pendingModelRequestId = String(modelRequest.request._id);
        }
    }

    return {
        brandId: resolvedBrandId,
        pendingBrandRequestId,
        modelId: resolvedModelId,
        pendingModelRequestId,
    };
};

