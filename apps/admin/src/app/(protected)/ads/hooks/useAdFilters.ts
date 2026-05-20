"use client";

import { useMemo, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { 
    DEFAULT_FILTERS, 
    type ModerationFilters 
} from "@/components/moderation/moderationTypes";
import { 
    adminListingModerationRoute, 
    readPositiveIntParam, 
    readStringParam 
} from "@/lib/adminUiRoutes";

const ALLOWED_STATUSES = new Set<ModerationFilters["status"]>([
    "pending",
    "live",
    "rejected",
    "deactivated",
    "sold",
    "expired",
    "all",
]);

const SORT_OPTIONS: Array<{ label: string; value: ModerationFilters["sort"] }> = [
    { label: "Newest", value: "newest" },
    { label: "Oldest", value: "oldest" },
    { label: "Price High", value: "price_high" },
    { label: "Price Low", value: "price_low" }
];

export type RouteOverrides = Partial<Omit<ModerationFilters, "listingType"> & { page: number; limit: number }>;

export function useAdFilters(listingType: ModerationFilters["listingType"]) {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();

    const currentUrl = useMemo(() => {
        const queryString = searchParams.toString();
        return queryString ? `${pathname}?${queryString}` : pathname;
    }, [pathname, searchParams]);

    const routeState = useMemo(() => {
        const requestedListingType = searchParams.get("listingType") as ModerationFilters["listingType"] | null;
        if (
            requestedListingType &&
            requestedListingType !== listingType &&
            ["ad", "service", "spare_part"].includes(requestedListingType)
        ) {
            const legacyParams = new URLSearchParams(searchParams.toString());
            legacyParams.delete("listingType");
            return {
                filters: {
                    ...DEFAULT_FILTERS,
                    status: "live" as ModerationFilters["status"],
                    listingType,
                },
                page: 1,
                pageSize: 20,
                canonicalUrl: adminListingModerationRoute(
                    requestedListingType as "ad" | "service" | "spare_part",
                    Object.fromEntries(legacyParams.entries())
                ),
            };
        }

        const statusFromQuery = searchParams.get("status");
        const sellerIdFromQuery = searchParams.get("sellerId");
        const searchFromQuery = searchParams.get("q") ?? searchParams.get("search");
        const locationIdFromQuery = searchParams.get("locationId");
        const sortFromQuery = searchParams.get("sort");
        const dateFromQuery = searchParams.get("dateFrom");
        const dateToQuery = searchParams.get("dateTo");
        
        const normalizedStatus =
            statusFromQuery && ALLOWED_STATUSES.has(statusFromQuery as ModerationFilters["status"])
                ? statusFromQuery as ModerationFilters["status"]
                : "live";
        
        const normalizedSellerId = readStringParam(sellerIdFromQuery);
        const normalizedSearch = readStringParam(searchFromQuery);
        const normalizedLocationId = readStringParam(locationIdFromQuery);
        const normalizedSort =
            sortFromQuery && SORT_OPTIONS.some((option) => option.value === sortFromQuery)
                ? (sortFromQuery as ModerationFilters["sort"])
                : DEFAULT_FILTERS.sort;
        
        const normalizedDateFrom = readStringParam(dateFromQuery);
        const normalizedDateTo = readStringParam(dateToQuery);

        const expiryWarningStatusFromQuery = searchParams.get("expiryWarningStatus");
        const expiringWithinDaysFromQuery = searchParams.get("expiringWithinDays");
        const spotlightWarningStatusFromQuery = searchParams.get("spotlightWarningStatus");
        const spotlightExpiringWithinDaysFromQuery = searchParams.get("spotlightExpiringWithinDays");
        const catalogPendingFromQuery = searchParams.get("catalogPending");

        const normalizedExpiryWarningStatus: ModerationFilters['expiryWarningStatus'] = (expiryWarningStatusFromQuery === 'sent' || expiryWarningStatusFromQuery === 'not_sent') 
            ? (expiryWarningStatusFromQuery as 'sent' | 'not_sent') 
            : 'all';
        const normalizedExpiringWithinDays = readStringParam(expiringWithinDaysFromQuery) || "";
        const normalizedSpotlightWarningStatus: ModerationFilters['spotlightWarningStatus'] = (spotlightWarningStatusFromQuery === 'sent' || spotlightWarningStatusFromQuery === 'not_sent')
            ? (spotlightWarningStatusFromQuery as 'sent' | 'not_sent')
            : 'all';
        const normalizedSpotlightExpiringWithinDays = readStringParam(spotlightExpiringWithinDaysFromQuery) || "";

        const normalizedPage = readPositiveIntParam(searchParams.get("page"), 1);
        const normalizedLimit = readPositiveIntParam(searchParams.get("limit"), 20);

        return {
            filters: {
                ...DEFAULT_FILTERS,
                status: normalizedStatus,
                sellerId: normalizedSellerId,
                search: normalizedSearch,
                locationId: normalizedLocationId,
                sort: normalizedSort,
                dateFrom: normalizedDateFrom,
                dateTo: normalizedDateTo,
                listingType,
                expiryWarningStatus: normalizedExpiryWarningStatus,
                expiringWithinDays: normalizedExpiringWithinDays,
                spotlightWarningStatus: normalizedSpotlightWarningStatus,
                spotlightExpiringWithinDays: normalizedSpotlightExpiringWithinDays,
                catalogPending: catalogPendingFromQuery === "true" || undefined,
            },
            page: normalizedPage,
            pageSize: normalizedLimit,
            canonicalUrl: adminListingModerationRoute(listingType ?? "ad", {
                status: normalizedStatus,
                q: normalizedSearch || undefined,
                sellerId: normalizedSellerId || undefined,
                locationId: normalizedLocationId || undefined,
                sort: normalizedSort !== DEFAULT_FILTERS.sort ? normalizedSort : undefined,
                dateFrom: normalizedDateFrom || undefined,
                dateTo: normalizedDateTo || undefined,
                expiryWarningStatus: normalizedExpiryWarningStatus !== 'all' ? normalizedExpiryWarningStatus : undefined,
                expiringWithinDays: normalizedExpiringWithinDays || undefined,
                spotlightWarningStatus: normalizedSpotlightWarningStatus !== 'all' ? normalizedSpotlightWarningStatus : undefined,
                spotlightExpiringWithinDays: normalizedSpotlightExpiringWithinDays || undefined,
                catalogPending: catalogPendingFromQuery === "true" ? true : undefined,
                page: normalizedPage > 1 ? normalizedPage : undefined,
                limit: normalizedLimit !== 20 ? normalizedLimit : undefined,
            }),
        };
    }, [listingType, searchParams]);

    const filters = routeState.filters;
    const page = routeState.page;
    const pageSize = routeState.pageSize;

    useEffect(() => {
        if (routeState.canonicalUrl !== currentUrl) {
            void router.replace(routeState.canonicalUrl, { scroll: false });
        }
    }, [currentUrl, routeState.canonicalUrl, router]);

    const buildRoute = (overrides: RouteOverrides = {}) => {
        const nextFilters = { ...filters, ...overrides };
        const nextPage = overrides.page ?? page;
        const nextLimit = overrides.limit ?? pageSize;

        return adminListingModerationRoute(listingType ?? "ad", {
            status: nextFilters.status,
            q: nextFilters.search || undefined,
            sellerId: nextFilters.sellerId || undefined,
            locationId: nextFilters.locationId || undefined,
            sort: nextFilters.sort !== DEFAULT_FILTERS.sort ? nextFilters.sort : undefined,
            dateFrom: nextFilters.dateFrom || undefined,
            dateTo: nextFilters.dateTo || undefined,
            expiryWarningStatus: nextFilters.expiryWarningStatus !== 'all' ? nextFilters.expiryWarningStatus : undefined,
            expiringWithinDays: nextFilters.expiringWithinDays || undefined,
            spotlightWarningStatus: nextFilters.spotlightWarningStatus !== 'all' ? nextFilters.spotlightWarningStatus : undefined,
            spotlightExpiringWithinDays: nextFilters.spotlightExpiringWithinDays || undefined,
            catalogPending: nextFilters.catalogPending === true ? true : undefined,
            page: nextPage > 1 ? nextPage : undefined,
            limit: nextLimit !== 20 ? nextLimit : undefined,
        });
    };

    const replaceRoute = (overrides: RouteOverrides = {}) => {
        const nextUrl = buildRoute(overrides);
        if (nextUrl !== currentUrl) {
            void router.replace(nextUrl, { scroll: false });
        }
    };

    const updateFilter = <K extends keyof ModerationFilters>(key: K, value: ModerationFilters[K]) => {
        replaceRoute({
            [key]: value,
            page: 1,
        } as RouteOverrides);
    };

    const clearFilters = () => {
        replaceRoute({
            status: "live",
            search: "",
            sellerId: "",
            locationId: "",
            sort: DEFAULT_FILTERS.sort,
            dateFrom: "",
            dateTo: "",
            expiryWarningStatus: "all",
            expiringWithinDays: "",
            spotlightWarningStatus: "all",
            spotlightExpiringWithinDays: "",
            catalogPending: undefined,
            page: 1,
            limit: 20,
        });
    };

    return {
        filters,
        page,
        pageSize,
        updateFilter,
        clearFilters,
        replaceRoute,
        buildRoute,
        searchParams,
        pathname,
        router
    };
}
