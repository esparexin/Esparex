"use client";

import { buildQueryString, type QueryParamValue } from "@/lib/api/queryParams";

type QueryShape = Record<string, QueryParamValue>;
type SearchParamsLike = { toString(): string };

export type AdminListingModerationType = "ad" | "service" | "spare_part";

const toRoute = (pathname: string, query?: QueryShape) => {
    const queryString = buildQueryString(query);
    return queryString ? `${pathname}?${queryString}` : pathname;
};

const sanitizeParamValue = (value: QueryParamValue) => {
    if (value === undefined || value === null) return null;
    if (typeof value === "string") {
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : null;
    }
    return value;
};

export const mergeAdminSearchParams = (
    current: SearchParamsLike,
    updates: QueryShape
) => {
    const params = new URLSearchParams(current.toString());

    Object.entries(updates).forEach(([key, value]) => {
        const normalized = sanitizeParamValue(value);
        if (normalized === null) {
            params.delete(key);
            return;
        }
        params.set(key, String(normalized));
    });

    return params;
};

export const buildAdminRouteWithMergedQuery = (
    pathname: string,
    current: SearchParamsLike,
    updates: QueryShape
) => {
    const params = mergeAdminSearchParams(current, updates);
    const queryString = params.toString();
    return queryString ? `${pathname}?${queryString}` : pathname;
};

export const readStringParam = (value: string | null | undefined, fallback = "") => {
    if (typeof value !== "string") {
        return fallback;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : fallback;
};

export const readPositiveIntParam = (
    value: string | null | undefined,
    fallback: number,
    min = 1
) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
        return fallback;
    }

    const nextValue = Math.trunc(parsed);
    return nextValue >= min ? nextValue : fallback;
};

const moderationPathnameByType: Record<AdminListingModerationType, string> = {
    ad: "/ads",
    service: "/services",
    spare_part: "/spare-parts",
};

export const adminListingModerationRoute = (
    listingType: AdminListingModerationType,
    query?: QueryShape
) => toRoute(moderationPathnameByType[listingType], query);

export const ADMIN_UI_ROUTES = {
    login: (next?: string | null) => toRoute("/login", next ? { next } : undefined),
    dashboard: () => "/dashboard",
    ads: (query?: QueryShape) => toRoute("/ads", query),
    services: (query?: QueryShape) => toRoute("/services", query),
    spareParts: (query?: QueryShape) => toRoute("/spare-parts", query),
    listingModeration: adminListingModerationRoute,
    reports: (query?: QueryShape) => toRoute("/reports", query),
    users: (query?: QueryShape) => toRoute("/users", query),
    userById: (id: string) => `/users/${encodeURIComponent(id)}`,
    businesses: (query?: QueryShape) => toRoute("/businesses", query),
    businessRequests: (query?: QueryShape) => toRoute("/business-requests", query),
    finance: (query?: QueryShape) => toRoute("/finance", query),
    chat: (query?: QueryShape) => toRoute("/chat", query),
} as const;
