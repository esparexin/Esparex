export interface ContentOptions {
    searchFields?: string[];
    defaultSort?: Record<string, 1 | -1>;
    publicQuery?: Record<string, unknown>;
    adminQuery?: Record<string, unknown>;
    populate?: unknown;
    select?: string;
    transformResponse?: (items: unknown[]) => unknown | Promise<unknown>;
    queryParams?: Record<string, unknown>;
}

export type CachedPaginatedPayload = Record<string, unknown> & {
    items?: unknown[];
    total?: number;
    page?: number;
    limit?: number;
};
