import { z } from "zod";
export declare const ObjectIdSchema: z.ZodString;
export declare const CategoryFilterSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    type: z.ZodEnum<["checkbox", "select", "range", "text", "number"]>;
    options: z.ZodOptional<z.ZodArray<z.ZodObject<{
        value: z.ZodString;
        label: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        value: string;
        label: string;
    }, {
        value: string;
        label: string;
    }>, "many">>;
    min: z.ZodOptional<z.ZodNumber>;
    max: z.ZodOptional<z.ZodNumber>;
    unit: z.ZodOptional<z.ZodString>;
    isRequired: z.ZodOptional<z.ZodBoolean>;
    showInFilters: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    type: "number" | "text" | "select" | "checkbox" | "range";
    id: string;
    name: string;
    options?: {
        value: string;
        label: string;
    }[] | undefined;
    max?: number | undefined;
    min?: number | undefined;
    isRequired?: boolean | undefined;
    unit?: string | undefined;
    showInFilters?: boolean | undefined;
}, {
    type: "number" | "text" | "select" | "checkbox" | "range";
    id: string;
    name: string;
    options?: {
        value: string;
        label: string;
    }[] | undefined;
    max?: number | undefined;
    min?: number | undefined;
    isRequired?: boolean | undefined;
    unit?: string | undefined;
    showInFilters?: boolean | undefined;
}>;
export declare const CreateCategorySchema: z.ZodObject<{
    name: z.ZodString;
    displayName: z.ZodOptional<z.ZodString>;
    canonicalName: z.ZodOptional<z.ZodString>;
    slug: z.ZodString;
    aliases: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    synonyms: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    icon: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    parentId: z.ZodOptional<z.ZodString>;
    isActive: z.ZodDefault<z.ZodBoolean>;
    listingType: z.ZodOptional<z.ZodArray<z.ZodEnum<any>, "many">>;
    serviceSelectionMode: z.ZodDefault<z.ZodEnum<["single", "multi"]>>;
    hasScreenSizes: z.ZodDefault<z.ZodBoolean>;
    filters: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        type: z.ZodEnum<["checkbox", "select", "range", "text", "number"]>;
        options: z.ZodOptional<z.ZodArray<z.ZodObject<{
            value: z.ZodString;
            label: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            value: string;
            label: string;
        }, {
            value: string;
            label: string;
        }>, "many">>;
        min: z.ZodOptional<z.ZodNumber>;
        max: z.ZodOptional<z.ZodNumber>;
        unit: z.ZodOptional<z.ZodString>;
        isRequired: z.ZodOptional<z.ZodBoolean>;
        showInFilters: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        type: "number" | "text" | "select" | "checkbox" | "range";
        id: string;
        name: string;
        options?: {
            value: string;
            label: string;
        }[] | undefined;
        max?: number | undefined;
        min?: number | undefined;
        isRequired?: boolean | undefined;
        unit?: string | undefined;
        showInFilters?: boolean | undefined;
    }, {
        type: "number" | "text" | "select" | "checkbox" | "range";
        id: string;
        name: string;
        options?: {
            value: string;
            label: string;
        }[] | undefined;
        max?: number | undefined;
        min?: number | undefined;
        isRequired?: boolean | undefined;
        unit?: string | undefined;
        showInFilters?: boolean | undefined;
    }>, "many">>;
    approvalStatus: z.ZodOptional<z.ZodEnum<["pending", "approved", "rejected"]>>;
}, "strict", z.ZodTypeAny, {
    name: string;
    isActive: boolean;
    slug: string;
    serviceSelectionMode: "single" | "multi";
    hasScreenSizes: boolean;
    listingType?: any[] | undefined;
    description?: string | undefined;
    displayName?: string | undefined;
    canonicalName?: string | undefined;
    aliases?: string[] | undefined;
    synonyms?: string[] | undefined;
    icon?: string | undefined;
    parentId?: string | undefined;
    filters?: {
        type: "number" | "text" | "select" | "checkbox" | "range";
        id: string;
        name: string;
        options?: {
            value: string;
            label: string;
        }[] | undefined;
        max?: number | undefined;
        min?: number | undefined;
        isRequired?: boolean | undefined;
        unit?: string | undefined;
        showInFilters?: boolean | undefined;
    }[] | undefined;
    approvalStatus?: "pending" | "rejected" | "approved" | undefined;
}, {
    name: string;
    slug: string;
    listingType?: any[] | undefined;
    description?: string | undefined;
    isActive?: boolean | undefined;
    displayName?: string | undefined;
    canonicalName?: string | undefined;
    aliases?: string[] | undefined;
    synonyms?: string[] | undefined;
    icon?: string | undefined;
    parentId?: string | undefined;
    serviceSelectionMode?: "single" | "multi" | undefined;
    hasScreenSizes?: boolean | undefined;
    filters?: {
        type: "number" | "text" | "select" | "checkbox" | "range";
        id: string;
        name: string;
        options?: {
            value: string;
            label: string;
        }[] | undefined;
        max?: number | undefined;
        min?: number | undefined;
        isRequired?: boolean | undefined;
        unit?: string | undefined;
        showInFilters?: boolean | undefined;
    }[] | undefined;
    approvalStatus?: "pending" | "rejected" | "approved" | undefined;
}>;
export declare const UpdateCategorySchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    displayName: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    canonicalName: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    slug: z.ZodOptional<z.ZodString>;
    aliases: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
    synonyms: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
    icon: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    parentId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    isActive: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    listingType: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodEnum<any>, "many">>>;
    serviceSelectionMode: z.ZodOptional<z.ZodDefault<z.ZodEnum<["single", "multi"]>>>;
    hasScreenSizes: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    filters: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        type: z.ZodEnum<["checkbox", "select", "range", "text", "number"]>;
        options: z.ZodOptional<z.ZodArray<z.ZodObject<{
            value: z.ZodString;
            label: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            value: string;
            label: string;
        }, {
            value: string;
            label: string;
        }>, "many">>;
        min: z.ZodOptional<z.ZodNumber>;
        max: z.ZodOptional<z.ZodNumber>;
        unit: z.ZodOptional<z.ZodString>;
        isRequired: z.ZodOptional<z.ZodBoolean>;
        showInFilters: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        type: "number" | "text" | "select" | "checkbox" | "range";
        id: string;
        name: string;
        options?: {
            value: string;
            label: string;
        }[] | undefined;
        max?: number | undefined;
        min?: number | undefined;
        isRequired?: boolean | undefined;
        unit?: string | undefined;
        showInFilters?: boolean | undefined;
    }, {
        type: "number" | "text" | "select" | "checkbox" | "range";
        id: string;
        name: string;
        options?: {
            value: string;
            label: string;
        }[] | undefined;
        max?: number | undefined;
        min?: number | undefined;
        isRequired?: boolean | undefined;
        unit?: string | undefined;
        showInFilters?: boolean | undefined;
    }>, "many">>>;
    approvalStatus: z.ZodOptional<z.ZodOptional<z.ZodEnum<["pending", "approved", "rejected"]>>>;
}, "strict", z.ZodTypeAny, {
    listingType?: any[] | undefined;
    name?: string | undefined;
    description?: string | undefined;
    isActive?: boolean | undefined;
    displayName?: string | undefined;
    canonicalName?: string | undefined;
    slug?: string | undefined;
    aliases?: string[] | undefined;
    synonyms?: string[] | undefined;
    icon?: string | undefined;
    parentId?: string | undefined;
    serviceSelectionMode?: "single" | "multi" | undefined;
    hasScreenSizes?: boolean | undefined;
    filters?: {
        type: "number" | "text" | "select" | "checkbox" | "range";
        id: string;
        name: string;
        options?: {
            value: string;
            label: string;
        }[] | undefined;
        max?: number | undefined;
        min?: number | undefined;
        isRequired?: boolean | undefined;
        unit?: string | undefined;
        showInFilters?: boolean | undefined;
    }[] | undefined;
    approvalStatus?: "pending" | "rejected" | "approved" | undefined;
}, {
    listingType?: any[] | undefined;
    name?: string | undefined;
    description?: string | undefined;
    isActive?: boolean | undefined;
    displayName?: string | undefined;
    canonicalName?: string | undefined;
    slug?: string | undefined;
    aliases?: string[] | undefined;
    synonyms?: string[] | undefined;
    icon?: string | undefined;
    parentId?: string | undefined;
    serviceSelectionMode?: "single" | "multi" | undefined;
    hasScreenSizes?: boolean | undefined;
    filters?: {
        type: "number" | "text" | "select" | "checkbox" | "range";
        id: string;
        name: string;
        options?: {
            value: string;
            label: string;
        }[] | undefined;
        max?: number | undefined;
        min?: number | undefined;
        isRequired?: boolean | undefined;
        unit?: string | undefined;
        showInFilters?: boolean | undefined;
    }[] | undefined;
    approvalStatus?: "pending" | "rejected" | "approved" | undefined;
}>;
export declare const CategorySchema: z.ZodObject<{
    name: z.ZodString;
    displayName: z.ZodOptional<z.ZodString>;
    canonicalName: z.ZodOptional<z.ZodString>;
    slug: z.ZodString;
    aliases: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    synonyms: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    icon: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    parentId: z.ZodOptional<z.ZodString>;
    isActive: z.ZodDefault<z.ZodBoolean>;
    listingType: z.ZodOptional<z.ZodArray<z.ZodEnum<any>, "many">>;
    serviceSelectionMode: z.ZodDefault<z.ZodEnum<["single", "multi"]>>;
    approvalStatus: z.ZodOptional<z.ZodEnum<["pending", "approved", "rejected"]>>;
} & {
    id: z.ZodString;
    isDeleted: z.ZodBoolean;
    filters: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        type: z.ZodEnum<["checkbox", "select", "range", "text", "number"]>;
        options: z.ZodOptional<z.ZodArray<z.ZodObject<{
            value: z.ZodString;
            label: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            value: string;
            label: string;
        }, {
            value: string;
            label: string;
        }>, "many">>;
        min: z.ZodOptional<z.ZodNumber>;
        max: z.ZodOptional<z.ZodNumber>;
        unit: z.ZodOptional<z.ZodString>;
        isRequired: z.ZodOptional<z.ZodBoolean>;
        showInFilters: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        type: "number" | "text" | "select" | "checkbox" | "range";
        id: string;
        name: string;
        options?: {
            value: string;
            label: string;
        }[] | undefined;
        max?: number | undefined;
        min?: number | undefined;
        isRequired?: boolean | undefined;
        unit?: string | undefined;
        showInFilters?: boolean | undefined;
    }, {
        type: "number" | "text" | "select" | "checkbox" | "range";
        id: string;
        name: string;
        options?: {
            value: string;
            label: string;
        }[] | undefined;
        max?: number | undefined;
        min?: number | undefined;
        isRequired?: boolean | undefined;
        unit?: string | undefined;
        showInFilters?: boolean | undefined;
    }>, "many">>;
    hasScreenSizes: z.ZodBoolean;
}, "strict", z.ZodTypeAny, {
    id: string;
    name: string;
    isDeleted: boolean;
    isActive: boolean;
    slug: string;
    serviceSelectionMode: "single" | "multi";
    hasScreenSizes: boolean;
    listingType?: any[] | undefined;
    description?: string | undefined;
    displayName?: string | undefined;
    canonicalName?: string | undefined;
    aliases?: string[] | undefined;
    synonyms?: string[] | undefined;
    icon?: string | undefined;
    parentId?: string | undefined;
    filters?: {
        type: "number" | "text" | "select" | "checkbox" | "range";
        id: string;
        name: string;
        options?: {
            value: string;
            label: string;
        }[] | undefined;
        max?: number | undefined;
        min?: number | undefined;
        isRequired?: boolean | undefined;
        unit?: string | undefined;
        showInFilters?: boolean | undefined;
    }[] | undefined;
    approvalStatus?: "pending" | "rejected" | "approved" | undefined;
}, {
    id: string;
    name: string;
    isDeleted: boolean;
    slug: string;
    hasScreenSizes: boolean;
    listingType?: any[] | undefined;
    description?: string | undefined;
    isActive?: boolean | undefined;
    displayName?: string | undefined;
    canonicalName?: string | undefined;
    aliases?: string[] | undefined;
    synonyms?: string[] | undefined;
    icon?: string | undefined;
    parentId?: string | undefined;
    serviceSelectionMode?: "single" | "multi" | undefined;
    filters?: {
        type: "number" | "text" | "select" | "checkbox" | "range";
        id: string;
        name: string;
        options?: {
            value: string;
            label: string;
        }[] | undefined;
        max?: number | undefined;
        min?: number | undefined;
        isRequired?: boolean | undefined;
        unit?: string | undefined;
        showInFilters?: boolean | undefined;
    }[] | undefined;
    approvalStatus?: "pending" | "rejected" | "approved" | undefined;
}>;
export declare const CreateBrandSchema: z.ZodObject<{
    name: z.ZodString;
    displayName: z.ZodOptional<z.ZodString>;
    canonicalName: z.ZodOptional<z.ZodString>;
    slug: z.ZodOptional<z.ZodString>;
    aliases: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    synonyms: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    categoryIds: z.ZodArray<z.ZodString, "many">;
    isActive: z.ZodDefault<z.ZodBoolean>;
    approvalStatus: z.ZodOptional<z.ZodEnum<["pending", "approved", "rejected"]>>;
}, "strict", z.ZodTypeAny, {
    name: string;
    isActive: boolean;
    categoryIds: string[];
    displayName?: string | undefined;
    canonicalName?: string | undefined;
    slug?: string | undefined;
    aliases?: string[] | undefined;
    synonyms?: string[] | undefined;
    approvalStatus?: "pending" | "rejected" | "approved" | undefined;
}, {
    name: string;
    categoryIds: string[];
    isActive?: boolean | undefined;
    displayName?: string | undefined;
    canonicalName?: string | undefined;
    slug?: string | undefined;
    aliases?: string[] | undefined;
    synonyms?: string[] | undefined;
    approvalStatus?: "pending" | "rejected" | "approved" | undefined;
}>;
export declare const UpdateBrandSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    displayName: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    canonicalName: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    slug: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    aliases: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
    synonyms: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
    categoryIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    isActive: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    approvalStatus: z.ZodOptional<z.ZodOptional<z.ZodEnum<["pending", "approved", "rejected"]>>>;
}, "strict", z.ZodTypeAny, {
    name?: string | undefined;
    isActive?: boolean | undefined;
    displayName?: string | undefined;
    canonicalName?: string | undefined;
    slug?: string | undefined;
    aliases?: string[] | undefined;
    synonyms?: string[] | undefined;
    approvalStatus?: "pending" | "rejected" | "approved" | undefined;
    categoryIds?: string[] | undefined;
}, {
    name?: string | undefined;
    isActive?: boolean | undefined;
    displayName?: string | undefined;
    canonicalName?: string | undefined;
    slug?: string | undefined;
    aliases?: string[] | undefined;
    synonyms?: string[] | undefined;
    approvalStatus?: "pending" | "rejected" | "approved" | undefined;
    categoryIds?: string[] | undefined;
}>;
export declare const BrandSchema: z.ZodObject<{
    name: z.ZodString;
    displayName: z.ZodOptional<z.ZodString>;
    canonicalName: z.ZodOptional<z.ZodString>;
    slug: z.ZodOptional<z.ZodString>;
    aliases: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    synonyms: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    categoryIds: z.ZodArray<z.ZodString, "many">;
    isActive: z.ZodDefault<z.ZodBoolean>;
    approvalStatus: z.ZodOptional<z.ZodEnum<["pending", "approved", "rejected"]>>;
} & {
    id: z.ZodString;
    isDeleted: z.ZodBoolean;
}, "strict", z.ZodTypeAny, {
    id: string;
    name: string;
    isDeleted: boolean;
    isActive: boolean;
    categoryIds: string[];
    displayName?: string | undefined;
    canonicalName?: string | undefined;
    slug?: string | undefined;
    aliases?: string[] | undefined;
    synonyms?: string[] | undefined;
    approvalStatus?: "pending" | "rejected" | "approved" | undefined;
}, {
    id: string;
    name: string;
    isDeleted: boolean;
    categoryIds: string[];
    isActive?: boolean | undefined;
    displayName?: string | undefined;
    canonicalName?: string | undefined;
    slug?: string | undefined;
    aliases?: string[] | undefined;
    synonyms?: string[] | undefined;
    approvalStatus?: "pending" | "rejected" | "approved" | undefined;
}>;
export declare const CreateModelSchema: z.ZodObject<{
    name: z.ZodString;
    displayName: z.ZodOptional<z.ZodString>;
    canonicalName: z.ZodOptional<z.ZodString>;
    slug: z.ZodOptional<z.ZodString>;
    aliases: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    synonyms: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    brandId: z.ZodString;
    categoryIds: z.ZodArray<z.ZodString, "many">;
    parentModelId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    variantOfModelId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    hierarchyPath: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    treeDepth: z.ZodOptional<z.ZodNumber>;
    variantType: z.ZodOptional<z.ZodString>;
    isParentModel: z.ZodOptional<z.ZodBoolean>;
    isActive: z.ZodDefault<z.ZodBoolean>;
    approvalStatus: z.ZodOptional<z.ZodEnum<["pending", "approved", "rejected"]>>;
}, "strict", z.ZodTypeAny, {
    name: string;
    isActive: boolean;
    categoryIds: string[];
    brandId: string;
    displayName?: string | undefined;
    canonicalName?: string | undefined;
    slug?: string | undefined;
    aliases?: string[] | undefined;
    synonyms?: string[] | undefined;
    approvalStatus?: "pending" | "rejected" | "approved" | undefined;
    parentModelId?: string | null | undefined;
    variantOfModelId?: string | null | undefined;
    hierarchyPath?: string[] | undefined;
    treeDepth?: number | undefined;
    variantType?: string | undefined;
    isParentModel?: boolean | undefined;
}, {
    name: string;
    categoryIds: string[];
    brandId: string;
    isActive?: boolean | undefined;
    displayName?: string | undefined;
    canonicalName?: string | undefined;
    slug?: string | undefined;
    aliases?: string[] | undefined;
    synonyms?: string[] | undefined;
    approvalStatus?: "pending" | "rejected" | "approved" | undefined;
    parentModelId?: string | null | undefined;
    variantOfModelId?: string | null | undefined;
    hierarchyPath?: string[] | undefined;
    treeDepth?: number | undefined;
    variantType?: string | undefined;
    isParentModel?: boolean | undefined;
}>;
export declare const UpdateModelSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    displayName: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    canonicalName: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    slug: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    aliases: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
    synonyms: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
    brandId: z.ZodOptional<z.ZodString>;
    categoryIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    parentModelId: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    variantOfModelId: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    hierarchyPath: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
    treeDepth: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    variantType: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    isParentModel: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
    isActive: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    approvalStatus: z.ZodOptional<z.ZodOptional<z.ZodEnum<["pending", "approved", "rejected"]>>>;
}, "strict", z.ZodTypeAny, {
    name?: string | undefined;
    isActive?: boolean | undefined;
    displayName?: string | undefined;
    canonicalName?: string | undefined;
    slug?: string | undefined;
    aliases?: string[] | undefined;
    synonyms?: string[] | undefined;
    approvalStatus?: "pending" | "rejected" | "approved" | undefined;
    categoryIds?: string[] | undefined;
    brandId?: string | undefined;
    parentModelId?: string | null | undefined;
    variantOfModelId?: string | null | undefined;
    hierarchyPath?: string[] | undefined;
    treeDepth?: number | undefined;
    variantType?: string | undefined;
    isParentModel?: boolean | undefined;
}, {
    name?: string | undefined;
    isActive?: boolean | undefined;
    displayName?: string | undefined;
    canonicalName?: string | undefined;
    slug?: string | undefined;
    aliases?: string[] | undefined;
    synonyms?: string[] | undefined;
    approvalStatus?: "pending" | "rejected" | "approved" | undefined;
    categoryIds?: string[] | undefined;
    brandId?: string | undefined;
    parentModelId?: string | null | undefined;
    variantOfModelId?: string | null | undefined;
    hierarchyPath?: string[] | undefined;
    treeDepth?: number | undefined;
    variantType?: string | undefined;
    isParentModel?: boolean | undefined;
}>;
export declare const ModelSchema: z.ZodObject<{
    name: z.ZodString;
    displayName: z.ZodOptional<z.ZodString>;
    canonicalName: z.ZodOptional<z.ZodString>;
    slug: z.ZodOptional<z.ZodString>;
    aliases: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    synonyms: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    brandId: z.ZodString;
    categoryIds: z.ZodArray<z.ZodString, "many">;
    parentModelId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    variantOfModelId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    hierarchyPath: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    treeDepth: z.ZodOptional<z.ZodNumber>;
    variantType: z.ZodOptional<z.ZodString>;
    isParentModel: z.ZodOptional<z.ZodBoolean>;
    isActive: z.ZodDefault<z.ZodBoolean>;
    approvalStatus: z.ZodOptional<z.ZodEnum<["pending", "approved", "rejected"]>>;
} & {
    id: z.ZodString;
    isDeleted: z.ZodBoolean;
}, "strict", z.ZodTypeAny, {
    id: string;
    name: string;
    isDeleted: boolean;
    isActive: boolean;
    categoryIds: string[];
    brandId: string;
    displayName?: string | undefined;
    canonicalName?: string | undefined;
    slug?: string | undefined;
    aliases?: string[] | undefined;
    synonyms?: string[] | undefined;
    approvalStatus?: "pending" | "rejected" | "approved" | undefined;
    parentModelId?: string | null | undefined;
    variantOfModelId?: string | null | undefined;
    hierarchyPath?: string[] | undefined;
    treeDepth?: number | undefined;
    variantType?: string | undefined;
    isParentModel?: boolean | undefined;
}, {
    id: string;
    name: string;
    isDeleted: boolean;
    categoryIds: string[];
    brandId: string;
    isActive?: boolean | undefined;
    displayName?: string | undefined;
    canonicalName?: string | undefined;
    slug?: string | undefined;
    aliases?: string[] | undefined;
    synonyms?: string[] | undefined;
    approvalStatus?: "pending" | "rejected" | "approved" | undefined;
    parentModelId?: string | null | undefined;
    variantOfModelId?: string | null | undefined;
    hierarchyPath?: string[] | undefined;
    treeDepth?: number | undefined;
    variantType?: string | undefined;
    isParentModel?: boolean | undefined;
}>;
export declare const CreateSparePartSchema: z.ZodObject<{
    name: z.ZodString;
    displayName: z.ZodOptional<z.ZodString>;
    canonicalName: z.ZodOptional<z.ZodString>;
    slug: z.ZodOptional<z.ZodString>;
    aliases: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    synonyms: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    listingType: z.ZodOptional<z.ZodArray<z.ZodEnum<any>, "many">>;
    categoryIds: z.ZodArray<z.ZodString, "many">;
    brandId: z.ZodOptional<z.ZodString>;
    modelId: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodDefault<z.ZodNumber>;
    isActive: z.ZodDefault<z.ZodBoolean>;
    approvalStatus: z.ZodOptional<z.ZodEnum<["pending", "approved", "rejected"]>>;
}, "strict", z.ZodTypeAny, {
    name: string;
    isActive: boolean;
    categoryIds: string[];
    sortOrder: number;
    listingType?: any[] | undefined;
    displayName?: string | undefined;
    canonicalName?: string | undefined;
    slug?: string | undefined;
    aliases?: string[] | undefined;
    synonyms?: string[] | undefined;
    approvalStatus?: "pending" | "rejected" | "approved" | undefined;
    brandId?: string | undefined;
    modelId?: string | undefined;
}, {
    name: string;
    categoryIds: string[];
    listingType?: any[] | undefined;
    isActive?: boolean | undefined;
    displayName?: string | undefined;
    canonicalName?: string | undefined;
    slug?: string | undefined;
    aliases?: string[] | undefined;
    synonyms?: string[] | undefined;
    approvalStatus?: "pending" | "rejected" | "approved" | undefined;
    brandId?: string | undefined;
    modelId?: string | undefined;
    sortOrder?: number | undefined;
}>;
export declare const UpdateSparePartSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    displayName: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    canonicalName: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    slug: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    aliases: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
    synonyms: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
    listingType: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodEnum<any>, "many">>>;
    categoryIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    brandId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    modelId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    sortOrder: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    isActive: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    approvalStatus: z.ZodOptional<z.ZodOptional<z.ZodEnum<["pending", "approved", "rejected"]>>>;
}, "strict", z.ZodTypeAny, {
    listingType?: any[] | undefined;
    name?: string | undefined;
    isActive?: boolean | undefined;
    displayName?: string | undefined;
    canonicalName?: string | undefined;
    slug?: string | undefined;
    aliases?: string[] | undefined;
    synonyms?: string[] | undefined;
    approvalStatus?: "pending" | "rejected" | "approved" | undefined;
    categoryIds?: string[] | undefined;
    brandId?: string | undefined;
    modelId?: string | undefined;
    sortOrder?: number | undefined;
}, {
    listingType?: any[] | undefined;
    name?: string | undefined;
    isActive?: boolean | undefined;
    displayName?: string | undefined;
    canonicalName?: string | undefined;
    slug?: string | undefined;
    aliases?: string[] | undefined;
    synonyms?: string[] | undefined;
    approvalStatus?: "pending" | "rejected" | "approved" | undefined;
    categoryIds?: string[] | undefined;
    brandId?: string | undefined;
    modelId?: string | undefined;
    sortOrder?: number | undefined;
}>;
export declare const SparePartSchema: z.ZodObject<{
    name: z.ZodString;
    displayName: z.ZodOptional<z.ZodString>;
    canonicalName: z.ZodOptional<z.ZodString>;
    slug: z.ZodOptional<z.ZodString>;
    aliases: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    synonyms: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    listingType: z.ZodOptional<z.ZodArray<z.ZodEnum<any>, "many">>;
    categoryIds: z.ZodArray<z.ZodString, "many">;
    brandId: z.ZodOptional<z.ZodString>;
    modelId: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodDefault<z.ZodNumber>;
    isActive: z.ZodDefault<z.ZodBoolean>;
    approvalStatus: z.ZodOptional<z.ZodEnum<["pending", "approved", "rejected"]>>;
} & {
    id: z.ZodString;
    isDeleted: z.ZodBoolean;
    usageCount: z.ZodNumber;
    createdAt: z.ZodOptional<z.ZodString>;
    updatedAt: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    id: string;
    name: string;
    isDeleted: boolean;
    isActive: boolean;
    categoryIds: string[];
    sortOrder: number;
    usageCount: number;
    listingType?: any[] | undefined;
    createdAt?: string | undefined;
    updatedAt?: string | undefined;
    displayName?: string | undefined;
    canonicalName?: string | undefined;
    slug?: string | undefined;
    aliases?: string[] | undefined;
    synonyms?: string[] | undefined;
    approvalStatus?: "pending" | "rejected" | "approved" | undefined;
    brandId?: string | undefined;
    modelId?: string | undefined;
}, {
    id: string;
    name: string;
    isDeleted: boolean;
    categoryIds: string[];
    usageCount: number;
    listingType?: any[] | undefined;
    createdAt?: string | undefined;
    updatedAt?: string | undefined;
    isActive?: boolean | undefined;
    displayName?: string | undefined;
    canonicalName?: string | undefined;
    slug?: string | undefined;
    aliases?: string[] | undefined;
    synonyms?: string[] | undefined;
    approvalStatus?: "pending" | "rejected" | "approved" | undefined;
    brandId?: string | undefined;
    modelId?: string | undefined;
    sortOrder?: number | undefined;
}>;
export type CategoryFilter = z.infer<typeof CategoryFilterSchema>;
export type CreateCategoryDTO = z.infer<typeof CreateCategorySchema>;
export type UpdateCategoryDTO = z.infer<typeof UpdateCategorySchema>;
export type Category = z.infer<typeof CategorySchema>;
export type CreateBrandDTO = z.infer<typeof CreateBrandSchema>;
export type UpdateBrandDTO = z.infer<typeof UpdateBrandSchema>;
export type Brand = z.infer<typeof BrandSchema>;
export type CreateModelDTO = z.infer<typeof CreateModelSchema>;
export type UpdateModelDTO = z.infer<typeof UpdateModelSchema>;
export type Model = z.infer<typeof ModelSchema>;
export type CreateSparePartDTO = z.infer<typeof CreateSparePartSchema>;
export type UpdateSparePartDTO = z.infer<typeof UpdateSparePartSchema>;
export type SparePart = z.infer<typeof SparePartSchema>;
