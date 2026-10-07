/**
 * Phase 3a (§5) — canonical catalog service-layer payloads.
 *
 * Relocated from the catalog domain application layer (DECISION-GATE §5;
 * evidence `areas/04-contract-ssot.md` Finding 3 — unique API payloads with
 * no contract home):
 * - `CatalogRequestPayload` from
 *   `core/src/domains/catalog/application/services/CatalogRequestService.ts:5`
 * - `SparePartRelationPayload` / `ScreenSizeRelationPayload` from
 *   `core/src/domains/catalog/application/services/CatalogValidationService.ts:348,358`
 * - `ModelHierarchyMutationPayload` from
 *   `core/src/domains/catalog/application/hierarchy/types.ts:60`
 */
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

export interface SparePartRelationPayload {
    categoryIds: string[];
    brandId?: string;
    modelId?: string;
}

export interface ScreenSizeRelationPayload {
    categoryId: string;
    brandId?: string;
}

export interface ModelHierarchyMutationPayload {
    name?: unknown;
    displayName?: unknown;
    canonicalName?: unknown;
    slug?: unknown;
    brandId?: unknown;
    parentModelId?: unknown;
    variantOfModelId?: unknown;
    hierarchyPath?: unknown;
    treeDepth?: unknown;
    isParentModel?: unknown;
}
