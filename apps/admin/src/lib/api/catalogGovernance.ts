import { adminFetch } from "./adminClient";
import { parseAdminResponse } from "./parseAdminResponse";
import { ADMIN_ROUTES } from "./routes";
import type { HierarchyTreeResponse } from "@shared/types/catalogHierarchy";

export type {
    HierarchyTreeModelNode,
    HierarchyTreeBrandNode,
    HierarchyTreeCategoryNode,
    HierarchyTreeResponse,
} from "@shared/types/catalogHierarchy";

export async function getCatalogHierarchyTree(): Promise<HierarchyTreeResponse> {
    const response = await adminFetch<HierarchyTreeResponse>(ADMIN_ROUTES.CATALOG_HIERARCHY_TREE);
    const parsed = parseAdminResponse<never, HierarchyTreeResponse>(response);

    return parsed.data ?? {
        summary: { categories: 0, brands: 0, models: 0 },
        categories: [],
    };
}

export async function getCatalogGovernanceMetrics(): Promise<any> {
    const response = await adminFetch<any>(ADMIN_ROUTES.CATALOG_GOVERNANCE_METRICS);
    const parsed = parseAdminResponse<never, any>(response);
    return parsed.data;
}

export async function getCatalogGovernanceLogs(): Promise<any[]> {
    const response = await adminFetch<any[]>(ADMIN_ROUTES.CATALOG_GOVERNANCE_LOGS);
    const parsed = parseAdminResponse<never, any[]>(response);
    return parsed.data ?? [];
}

export async function getAiModerationQueue(): Promise<{ brands: any[], models: any[] }> {
    const response = await adminFetch<{ brands: any[], models: any[] }>(ADMIN_ROUTES.AI_ANALYSIS_QUEUE);
    const parsed = parseAdminResponse<never, { brands: any[], models: any[] }>(response);
    return parsed.data ?? { brands: [], models: [] };
}
