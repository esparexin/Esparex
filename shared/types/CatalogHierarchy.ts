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
