type UnknownRecord = Record<string, unknown>;

export type AdminPagination = {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    pages?: number;
};

export type ParsedAdminResponse<T, DataType = Record<string, unknown>> = {
    items: T[];
    data: DataType | null;
    pagination: AdminPagination | null;
    meta: UnknownRecord | null;
};

const asRecord = (value: unknown): UnknownRecord | null => {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return null;
    }
    return value as UnknownRecord;
};

const asArray = <T>(value: unknown): T[] | null => {
    return Array.isArray(value) ? (value as T[]) : null;
};

const asPagination = (value: unknown): AdminPagination | null => {
    const record = asRecord(value);
    return record ? (record as AdminPagination) : null;
};

export function parseAdminResponse<T, DataType = Record<string, unknown>>(payload: unknown): ParsedAdminResponse<T, DataType> {
    const root = asRecord(payload);
    const rootData = root?.data;
    const dataRecord = asRecord(rootData);

    const items =
        asArray<T>(dataRecord?.items) ??
        asArray<T>(dataRecord?.data) ??
        asArray<T>(dataRecord?.messages) ??
        asArray<T>(rootData) ??
        asArray<T>(root?.items) ??
        asArray<T>(root?.data) ??
        [];

    const pagination =
        asPagination(dataRecord?.pagination) ??
        asPagination(root?.pagination) ??
        null;

    const data = (dataRecord as DataType | null) ?? null;

    const inferredMeta = (() => {
        if (!dataRecord) return null;
        const clone: UnknownRecord = { ...dataRecord };
        delete clone.items;
        delete clone.data;
        delete clone.messages;
        delete clone.pagination;
        return Object.keys(clone).length > 0 ? clone : null;
    })();

    const meta =
        asRecord(dataRecord?.meta) ??
        inferredMeta ??
        asRecord(root?.meta) ??
        null;

    return {
        items,
        data,
        pagination,
        meta
    };
}
