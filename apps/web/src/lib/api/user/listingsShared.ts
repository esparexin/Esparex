import type { PaginationEnvelope } from "@/lib/api/result";

const DEFAULT_OBJECT_ID_FIELDS = ["categoryId", "brandId", "modelId", "locationId"] as const;

type PaginationInput = {
    page?: number;
    limit?: number;
};

interface StripEmptyObjectIdFieldsOptions {
    extractId: (value: unknown) => string | undefined;
    objectIdFields?: readonly string[];
}

export function stripEmptyObjectIdFields<T extends Record<string, unknown>>(
    payload: T,
    { extractId, objectIdFields = DEFAULT_OBJECT_ID_FIELDS }: StripEmptyObjectIdFieldsOptions
): T {
    const cleaned = { ...payload } as Record<string, unknown>;

    for (const field of objectIdFields) {
        const value = cleaned[field];
        if (typeof value === "string" && value.trim() === "") {
            delete cleaned[field];
            continue;
        }
        if (value && typeof value === "object") {
            const extractedId = extractId(value);
            if (typeof extractedId === "string" && extractedId.trim().length > 0) {
                cleaned[field] = extractedId;
            } else {
                delete cleaned[field];
            }
        }
    }

    return cleaned as T;
}

export function createEmptyPagination({ page, limit }: PaginationInput): PaginationEnvelope {
    return {
        page: Number(page || 1),
        limit: Number(limit || 20),
        hasMore: false,
    };
}

export function createEmptyPageResult<T>(pagination: PaginationInput): {
    data: T[];
    pagination: PaginationEnvelope;
} {
    return {
        data: [],
        pagination: createEmptyPagination(pagination),
    };
}
