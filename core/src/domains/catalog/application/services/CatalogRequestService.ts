import CatalogRequest from '@esparex/core/models/CatalogRequest';

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

    const existingPending = await CatalogRequest.findOneAndUpdate(
        dedupeQuery,
        {
            $addToSet: { requestedByUsers: payload.requestedBy },
            $inc: { requestCount: 1 },
        },
        { new: true, sort: { createdAt: -1 } }
    );

    if (existingPending) {
        return { request: existingPending, isNew: false };
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
    const resolvedBrandId = params.brandId;
    let pendingBrandRequestId: string | undefined;
    const resolvedModelId = params.modelId;
    let pendingModelRequestId: string | undefined;

    // Handle proposed custom brand
    if (!resolvedBrandId && params.customBrandName && params.customBrandName.trim().length > 0) {
        const trimmedBrand = params.customBrandName.trim();
        const canonicalBrand = trimmedBrand.toLowerCase().replace(/\s+/g, ' ');
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

    // Handle proposed custom model
    if (!resolvedModelId && params.customModelName && params.customModelName.trim().length > 0) {
        const trimmedModel = params.customModelName.trim();
        const canonicalModel = trimmedModel.toLowerCase().replace(/\s+/g, ' ');
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

    return {
        brandId: resolvedBrandId,
        pendingBrandRequestId,
        modelId: resolvedModelId,
        pendingModelRequestId,
    };
};

