export type PublicBrowseType = "ad" | "service" | "spare_part";

export interface PublicBrowseRouteParams {
    type?: unknown;
    q?: unknown;
    category?: unknown;
    categoryId?: unknown;
    sort?: unknown;
    minPrice?: unknown;
    maxPrice?: unknown;
    location?: unknown;
    locationId?: unknown;
    brands?: unknown;
    radiusKm?: unknown;
    page?: unknown;
}

export interface ParsedPublicBrowseParams {
    type: PublicBrowseType;
    q?: string;
    category?: string;
    categoryId?: string;
    sort?: string;
    minPrice?: number;
    maxPrice?: number;
    location?: string;
    locationId?: string;
    brands?: string;
    radiusKm?: number;
    page?: number;
}

type SearchParamsRecord = Record<string, string | string[] | undefined>;

const PUBLIC_BROWSE_PATH = "/search";
const PUBLIC_BROWSE_TYPES = new Set<PublicBrowseType>(["ad", "service", "spare_part"]);
const PUBLIC_SORTS = new Set(["relevance", "newest", "price_low_high", "price_high_low"]);
const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

const readString = (value: unknown): string | undefined => {
    if (typeof value !== "string") {
        return undefined;
    }

    const normalized = value.trim();
    return normalized ? normalized : undefined;
};

const readNumber = (value: unknown): number | undefined => {
    if (typeof value === "number") {
        return Number.isFinite(value) ? value : undefined;
    }

    const raw = readString(value);
    if (!raw) {
        return undefined;
    }

    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : undefined;
};

const readSearchParamValue = (input: SearchParamsRecord, key: string): string | undefined => {
    const value = input[key];
    return Array.isArray(value) ? readString(value[0]) : readString(value);
};

const hasSearchGetter = (value: unknown): value is { get(key: string): string | null } =>
    typeof value === "object" &&
    value !== null &&
    "get" in value &&
    typeof (value as { get?: unknown }).get === "function";

const appendIfPresent = (params: URLSearchParams, key: string, value: unknown) => {
    const normalized = readString(value);
    if (normalized) {
        params.set(key, normalized);
    }
};

export const normalizePublicBrowseType = (value: unknown): PublicBrowseType => {
    const normalized = readString(value)?.toLowerCase();
    return normalized && PUBLIC_BROWSE_TYPES.has(normalized as PublicBrowseType)
        ? (normalized as PublicBrowseType)
        : "ad";
};

export const inferPublicBrowseTypeFromPathname = (pathname?: string | null): PublicBrowseType => {
    const normalizedPathname = pathname?.toLowerCase() || "";
    if (normalizedPathname.includes("spare-part")) {
        return "spare_part";
    }
    if (normalizedPathname.includes("service")) {
        return "service";
    }
    return "ad";
};

export const parsePublicBrowseParams = (
    input: URLSearchParams | { get(key: string): string | null } | SearchParamsRecord
): ParsedPublicBrowseParams => {
    const read = (key: string): string | undefined => {
        if (hasSearchGetter(input)) {
            return readString(input.get(key));
        }
        return readSearchParamValue(input as SearchParamsRecord, key);
    };

    const type = normalizePublicBrowseType(read("type"));
    const sort = read("sort");

    return {
        type,
        q: read("q"),
        category: read("category"),
        categoryId: read("categoryId"),
        sort: sort && PUBLIC_SORTS.has(sort) ? sort : undefined,
        minPrice: readNumber(read("minPrice")),
        maxPrice: readNumber(read("maxPrice")),
        location: read("location"),
        locationId: read("locationId"),
        brands: read("brands"),
        radiusKm: readNumber(read("radiusKm")),
        page: readNumber(read("page")),
    };
};

export const buildPublicBrowseRoute = (input: PublicBrowseRouteParams = {}): string => {
    const params = new URLSearchParams();
    const type = normalizePublicBrowseType(input.type);
    const normalizedCategoryId = readString(input.categoryId);
    const normalizedCategory = readString(input.category);
    const resolvedCategoryId =
        normalizedCategoryId && OBJECT_ID_PATTERN.test(normalizedCategoryId)
            ? normalizedCategoryId
            : normalizedCategory && OBJECT_ID_PATTERN.test(normalizedCategory)
              ? normalizedCategory
              : undefined;

    params.set("type", type);
    appendIfPresent(params, "q", input.q);
    if (resolvedCategoryId) {
        params.set("categoryId", resolvedCategoryId);
    } else {
        appendIfPresent(params, "category", normalizedCategory);
    }

    const sort = readString(input.sort);
    if (sort && PUBLIC_SORTS.has(sort)) {
        params.set("sort", sort);
    }

    const minPrice = readNumber(input.minPrice);
    if (typeof minPrice === "number" && minPrice > 0) {
        params.set("minPrice", String(minPrice));
    }

    const maxPrice = readNumber(input.maxPrice);
    if (typeof maxPrice === "number" && maxPrice > 0) {
        params.set("maxPrice", String(maxPrice));
    }

    appendIfPresent(params, "location", input.location);
    appendIfPresent(params, "locationId", input.locationId);
    appendIfPresent(params, "brands", Array.isArray(input.brands) ? input.brands.join(",") : input.brands);

    const radiusKm = readNumber(input.radiusKm);
    if (typeof radiusKm === "number" && radiusKm > 0) {
        params.set("radiusKm", String(radiusKm));
    }

    const page = readNumber(input.page);
    if (typeof page === "number" && page > 1) {
        params.set("page", String(page));
    }

    return `${PUBLIC_BROWSE_PATH}?${params.toString()}`;
};

export const buildPublicBrowseRouteFromPathname = (
    pathname: string,
    input: Omit<PublicBrowseRouteParams, "type"> = {}
): string => buildPublicBrowseRoute({ type: inferPublicBrowseTypeFromPathname(pathname), ...input });
