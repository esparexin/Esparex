import type { Page } from "@playwright/test";

// =============================================================================
// LISTING API INTERCEPTOR HELPERS
// =============================================================================
//
// ⚠️  CONTRACT AUTHORITY: This file is the single source of truth for HTTP
//     methods used by listing API routes in Playwright tests.
//
//     If the API contract changes (method, path, payload shape), update this
//     file and run the full E2E suite. Do NOT scatter raw method strings through
//     individual test files.
//
//     See AGENTS.md §10 — Contract Impact Review for the governance rule.
// =============================================================================

// ─── HTTP Method Constants ────────────────────────────────────────────────────
export const HTTP = {
    GET:    "GET",
    POST:   "POST",
    PATCH:  "PATCH",
    DELETE: "DELETE",
    PUT:    "PUT",
} as const;

export type HttpMethod = typeof HTTP[keyof typeof HTTP];

// ─── Listing API Route Patterns ───────────────────────────────────────────────
// Update these if routes change — tests will adapt automatically.
export const LISTING_ROUTES = {
    /** PATCH /api/v1/listings/:id/edit */
    EDIT: (id: string) => new RegExp(`/api/v1/listings/${id}/edit`),
    /** GET  /api/v1/listings/:id */
    DETAIL: (id: string) => new RegExp(`/api/v1/listings/${id}$`),
    /** POST /api/v1/listings */
    CREATE: /\/api\/v1\/listings$/,
    /** DELETE /api/v1/listings/:id */
    DELETE: (id: string) => new RegExp(`/api/v1/listings/${id}$`),
} as const;

// ─── Edit Listing Interceptor ─────────────────────────────────────────────────

interface EditListingMockOptions {
    /** Mock listing payload to merge into the response */
    listing: Record<string, unknown>;
    /** Override the default 200 OK status */
    status?: number;
    /** Override the HTTP method guard (default: PATCH) */
    method?: HttpMethod;
    /** If true, abort the connection instead of fulfilling */
    abort?: boolean;
    /** Callback to inspect the captured request payload */
    onRequest?: (payload: Record<string, unknown>) => void;
}

/**
 * Intercepts the Edit Listing API call and fulfills it with a mock response.
 *
 * By default this intercepts PATCH /api/v1/listings/:id/edit — the current
 * production contract as of the POST-AD workflow refactor (Jul 2026).
 *
 * @example
 * ```ts
 * let captured: Record<string, unknown> = {};
 * await interceptEditListing(page, mockListingId, {
 *     listing: mockListing,
 *     onRequest: (payload) => { captured = payload; },
 * });
 * ```
 */
export async function interceptEditListing(
    page: Page,
    listingId: string,
    options: EditListingMockOptions
): Promise<void> {
    const { listing, status = 200, method = HTTP.PATCH, abort = false, onRequest } = options;

    await page.route(LISTING_ROUTES.EDIT(listingId), async (route) => {
        if (route.request().method() !== method) {
            await route.fallback();
            return;
        }

        if (onRequest) {
            const raw = route.request().postData() ?? "{}";
            onRequest(JSON.parse(raw) as Record<string, unknown>);
        }

        if (abort) {
            await route.abort("failed");
            return;
        }

        await route.fulfill({
            status,
            contentType: "application/json",
            body: JSON.stringify({ success: true, listing }),
        });
    });
}

// ─── Listing Detail (GET) Interceptor ────────────────────────────────────────

/**
 * Intercepts GET /api/v1/listings/:id and returns the provided listing data.
 * Non-GET requests are forwarded to the real backend.
 */
export async function interceptListingDetail(
    page: Page,
    listingId: string,
    listing: Record<string, unknown>
): Promise<void> {
    await page.route(LISTING_ROUTES.DETAIL(listingId), async (route) => {
        if (route.request().method() !== HTTP.GET) {
            await route.fallback();
            return;
        }

        await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ success: true, data: listing }),
        });
    });
}
