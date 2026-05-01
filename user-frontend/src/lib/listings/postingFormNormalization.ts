import type { ServiceType } from "@/lib/api/user/masterData";
import { sanitizeMongoObjectId } from "@/lib/listings/locationUtils";
import type { AdPayload as PostAdFormData } from "@/schemas/adPayload.schema";
import type { PostSparePartFormValues } from "@/schemas/postSparePartForm.schema";
import type { ServiceListingFormData } from "@/schemas/serviceListingPayload.schema";

type ListingPayloadRecord = Record<string, unknown>;

const normalizeTextValue = (value: unknown): string => (
    typeof value === "string" ? value : ""
);

export const resolveCatalogEntityId = (...values: unknown[]): string => {
    for (const value of values) {
        const directMatch = sanitizeMongoObjectId(value);
        if (directMatch) return directMatch;

        if (!value || typeof value !== "object") continue;

        const record = value as Record<string, unknown>;
        const nestedMatch =
            sanitizeMongoObjectId(record.id) ||
            sanitizeMongoObjectId(record._id) ||
            sanitizeMongoObjectId(record.value);

        if (nestedMatch) return nestedMatch;
    }

    return "";
};

export const normalizeStringTokenList = (value: unknown): string[] => {
    if (!value) return [];

    const tokens = Array.isArray(value) ? value : [value];
    return tokens
        .map((token) => {
            if (typeof token === "string") return token.trim();
            if (!token || typeof token !== "object") return "";

            const record = token as Record<string, unknown>;
            const preferredValue = record.id ?? record._id ?? record.name ?? record.value;
            return typeof preferredValue === "string" ? preferredValue.trim() : "";
        })
        .filter((token): token is string => token.length > 0);
};

export const normalizeObjectIdList = (value: unknown): string[] => Array.from(
    new Set(
        normalizeStringTokenList(value)
            .map((token) => sanitizeMongoObjectId(token))
            .filter((token): token is string => Boolean(token))
    )
);

export const resolveNumericField = (...values: unknown[]): number | undefined => {
    for (const value of values) {
        if (typeof value === "number" && Number.isFinite(value)) return value;
        if (typeof value === "string" && value.trim().length > 0) {
            const numeric = Number(value);
            if (Number.isFinite(numeric)) return numeric;
        }
    }

    return undefined;
};

export const buildGenericListingEditResetValues = (
    payload: ListingPayloadRecord
): ListingPayloadRecord => ({
    ...payload,
    categoryId: resolveCatalogEntityId(payload.categoryId, payload.category),
    brandId: resolveCatalogEntityId(payload.brandId, payload.brand),
});

export const buildServiceListingEditValues = (
    payload: ListingPayloadRecord
): Partial<ServiceListingFormData> => ({
    title: normalizeTextValue(payload.title),
    categoryId: resolveCatalogEntityId(payload.categoryId, payload.category),
    brandId: resolveCatalogEntityId(payload.brandId, payload.brand),
    serviceTypeIds: normalizeStringTokenList(payload.serviceTypeIds),
    price: resolveNumericField(payload.price, payload.priceMin),
    description: normalizeTextValue(payload.description),
});

export const resolveServiceTypeSelectionIds = (
    tokens: string[],
    availableItems: ServiceType[]
): string[] => {
    const validIds = new Set<string>();
    const byName = new Map<string, string>();

    availableItems.forEach((item) => {
        const id = item.id?.trim();
        const name = item.name?.trim().toLowerCase();
        if (!id) return;
        validIds.add(id);
        if (name) byName.set(name, id);
    });

    return Array.from(new Set(tokens.map((token) => {
        if (validIds.has(token)) return token;
        return byName.get(token.toLowerCase()) || token;
    })));
};

export const buildSparePartListingEditValues = (
    payload: ListingPayloadRecord
): Partial<PostSparePartFormValues> => ({
    title: normalizeTextValue(payload.title),
    categoryId: resolveCatalogEntityId(payload.categoryId, payload.category),
    brandId: resolveCatalogEntityId(payload.brandId, payload.brand),
    sparePartTypeId: resolveCatalogEntityId(payload.sparePartId, payload.sparePartTypeId),
    price: resolveNumericField(payload.price),
    description: normalizeTextValue(payload.description),
});

export const buildPostAdEditPayload = (
    payload: PostAdFormData,
    isLocationLocked: boolean
): Record<string, unknown> => {
    const editPayload: Record<string, unknown> = {
        title: payload.title,
        description: payload.description,
        price: payload.price,
        images: payload.images,
        isFree: payload.isFree,
    };

    if (!isLocationLocked && payload.location) {
        editPayload.location = payload.location;
    }

    return editPayload;
};

export const buildPostAdIdentityPatch = (
    values: Pick<PostAdFormData, "categoryId" | "category" | "brandId" | "modelId" | "spareParts">
): Partial<PostAdFormData> => {
    const normalizedCategoryId = resolveCatalogEntityId(values.categoryId, values.category);

    return {
        categoryId: normalizedCategoryId,
        category: normalizedCategoryId,
        brandId: resolveCatalogEntityId(values.brandId),
        modelId: resolveCatalogEntityId(values.modelId),
        spareParts: normalizeObjectIdList(values.spareParts),
    };
};
