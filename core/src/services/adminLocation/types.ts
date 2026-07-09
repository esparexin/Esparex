export interface AdminLocationPaginationQuery {
    page?: unknown;
    limit?: unknown;
    q?: unknown;
    status?: unknown;
    state?: unknown;
    level?: unknown;
}

export interface AdminCreateLocationBody {
    name?: unknown;
    state?: unknown;
    country?: unknown;
    level?: unknown;
    parentId?: unknown;
    latitude?: unknown;
    longitude?: unknown;
    isActive?: unknown;
    city?: unknown;
    district?: unknown;
    [key: string]: unknown;
}

export interface AdminUpdateLocationBody {
    name?: unknown;
    country?: unknown;
    level?: unknown;
    parentId?: unknown;
    latitude?: unknown;
    longitude?: unknown;
    isActive?: unknown;
    [key: string]: unknown;
}
