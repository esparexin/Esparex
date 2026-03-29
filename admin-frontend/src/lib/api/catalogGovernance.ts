import { adminFetch } from "./adminClient";
import { parseAdminResponse } from "./parseAdminResponse";
import { ADMIN_ROUTES } from "./routes";

export interface HierarchyTreeModelNode {
    id: string;
    name: string;
    isActive: boolean;
    status?: string;
}

export interface HierarchyTreeBrandNode {
    id: string;
    name: string;
    isActive: boolean;
    status?: string;
    models: HierarchyTreeModelNode[];
}

export interface HierarchyTreeCategoryNode {
    id: string;
    name: string;
    slug: string;
    listingType: string[];
    hasScreenSizes: boolean;
    isActive: boolean;
    brands: HierarchyTreeBrandNode[];
}

export interface HierarchyTreeResponse {
    summary: {
        categories: number;
        brands: number;
        models: number;
    };
    categories: HierarchyTreeCategoryNode[];
}

export async function getCatalogHierarchyTree(): Promise<HierarchyTreeResponse> {
    const response = await adminFetch<HierarchyTreeResponse>(ADMIN_ROUTES.CATALOG_HIERARCHY_TREE);
    const parsed = parseAdminResponse<never, HierarchyTreeResponse>(response);

    return parsed.data ?? {
        summary: { categories: 0, brands: 0, models: 0 },
        categories: [],
    };
}
