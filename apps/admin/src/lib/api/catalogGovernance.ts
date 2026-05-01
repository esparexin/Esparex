import { adminFetch } from "./adminClient";
import { parseAdminResponse } from "./parseAdminResponse";
import { ADMIN_ROUTES } from "./routes";
import type { HierarchyTreeResponse } from "@shared/types/CatalogHierarchy";

export type {
    HierarchyTreeModelNode,
    HierarchyTreeBrandNode,
    HierarchyTreeCategoryNode,
    HierarchyTreeResponse,
} from "@shared/types/CatalogHierarchy";

export async function getCatalogHierarchyTree(): Promise<HierarchyTreeResponse> {
    const response = await adminFetch<HierarchyTreeResponse>(ADMIN_ROUTES.CATALOG_HIERARCHY_TREE);
    const parsed = parseAdminResponse<never, HierarchyTreeResponse>(response);

    return parsed.data ?? {
        summary: { categories: 0, brands: 0, models: 0 },
        categories: [],
    };
}
