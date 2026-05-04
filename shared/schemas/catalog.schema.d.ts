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
    type: "number" | "text" | "select" | "range" | "checkbox";
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
    type: "number" | "text" | "select" | "range" | "checkbox";
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
export declare const CATEGORY_TYPES: readonly ["AD", "SPARE_PART", "SERVICE", "OTHER"];
export declare const CategoryTypeEnum: z.ZodEnum<["AD", "SPARE_PART", "SERVICE", "OTHER"]>;
export type CategoryType = z.infer<typeof CategoryTypeEnum>;
export declare const CreateCategorySchema: z.ZodObject<{
    name: z.ZodString;
    slug: z.ZodString;
    type: z.ZodDefault<z.ZodEnum<["AD", "SPARE_PART", "SERVICE", "OTHER"]>>;
    icon: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    parentId: z.ZodOptional<z.ZodString>;
    isActive: z.ZodDefault<z.ZodBoolean>;
    listingType: z.ZodOptional<z.ZodArray<z.ZodEnum<[import("../enums/listingType").ListingTypeValue, ...import("../enums/listingType").ListingTypeValue[]]>, "many">>;
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
        type: "number" | "text" | "select" | "range" | "checkbox";
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
        type: "number" | "text" | "select" | "range" | "checkbox";
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
}, "strict", z.ZodTypeAny, {
    type: "OTHER" | "AD" | "SERVICE" | "SPARE_PART";
    name: string;
    isActive: boolean;
    slug: string;
    serviceSelectionMode: "single" | "multi";
    hasScreenSizes: boolean;
    description?: string | undefined;
    parentId?: string | undefined;
    listingType?: import("../enums/listingType").ListingTypeValue[] | undefined;
    icon?: string | undefined;
    filters?: {
        type: "number" | "text" | "select" | "range" | "checkbox";
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
}, {
    name: string;
    slug: string;
    type?: "OTHER" | "AD" | "SERVICE" | "SPARE_PART" | undefined;
    description?: string | undefined;
    isActive?: boolean | undefined;
    parentId?: string | undefined;
    listingType?: import("../enums/listingType").ListingTypeValue[] | undefined;
    icon?: string | undefined;
    filters?: {
        type: "number" | "text" | "select" | "range" | "checkbox";
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
    serviceSelectionMode?: "single" | "multi" | undefined;
    hasScreenSizes?: boolean | undefined;
}>;
export declare const UpdateCategorySchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    slug: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodDefault<z.ZodEnum<["AD", "SPARE_PART", "SERVICE", "OTHER"]>>>;
    icon: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    parentId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    isActive: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    listingType: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodEnum<[import("../enums/listingType").ListingTypeValue, ...import("../enums/listingType").ListingTypeValue[]]>, "many">>>;
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
        type: "number" | "text" | "select" | "range" | "checkbox";
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
        type: "number" | "text" | "select" | "range" | "checkbox";
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
}, "strict", z.ZodTypeAny, {
    type?: "OTHER" | "AD" | "SERVICE" | "SPARE_PART" | undefined;
    description?: string | undefined;
    name?: string | undefined;
    isActive?: boolean | undefined;
    parentId?: string | undefined;
    listingType?: import("../enums/listingType").ListingTypeValue[] | undefined;
    slug?: string | undefined;
    icon?: string | undefined;
    filters?: {
        type: "number" | "text" | "select" | "range" | "checkbox";
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
    serviceSelectionMode?: "single" | "multi" | undefined;
    hasScreenSizes?: boolean | undefined;
}, {
    type?: "OTHER" | "AD" | "SERVICE" | "SPARE_PART" | undefined;
    description?: string | undefined;
    name?: string | undefined;
    isActive?: boolean | undefined;
    parentId?: string | undefined;
    listingType?: import("../enums/listingType").ListingTypeValue[] | undefined;
    slug?: string | undefined;
    icon?: string | undefined;
    filters?: {
        type: "number" | "text" | "select" | "range" | "checkbox";
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
    serviceSelectionMode?: "single" | "multi" | undefined;
    hasScreenSizes?: boolean | undefined;
}>;
export declare const CategorySchema: z.ZodObject<{
    name: z.ZodString;
    slug: z.ZodString;
    type: z.ZodDefault<z.ZodEnum<["AD", "SPARE_PART", "SERVICE", "OTHER"]>>;
    icon: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    parentId: z.ZodOptional<z.ZodString>;
    isActive: z.ZodDefault<z.ZodBoolean>;
    listingType: z.ZodOptional<z.ZodArray<z.ZodEnum<[import("../enums/listingType").ListingTypeValue, ...import("../enums/listingType").ListingTypeValue[]]>, "many">>;
    serviceSelectionMode: z.ZodDefault<z.ZodEnum<["single", "multi"]>>;
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
        type: "number" | "text" | "select" | "range" | "checkbox";
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
        type: "number" | "text" | "select" | "range" | "checkbox";
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
    type: "OTHER" | "AD" | "SERVICE" | "SPARE_PART";
    id: string;
    name: string;
    isDeleted: boolean;
    isActive: boolean;
    slug: string;
    serviceSelectionMode: "single" | "multi";
    hasScreenSizes: boolean;
    description?: string | undefined;
    parentId?: string | undefined;
    listingType?: import("../enums/listingType").ListingTypeValue[] | undefined;
    icon?: string | undefined;
    filters?: {
        type: "number" | "text" | "select" | "range" | "checkbox";
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
}, {
    id: string;
    name: string;
    isDeleted: boolean;
    slug: string;
    hasScreenSizes: boolean;
    type?: "OTHER" | "AD" | "SERVICE" | "SPARE_PART" | undefined;
    description?: string | undefined;
    isActive?: boolean | undefined;
    parentId?: string | undefined;
    listingType?: import("../enums/listingType").ListingTypeValue[] | undefined;
    icon?: string | undefined;
    filters?: {
        type: "number" | "text" | "select" | "range" | "checkbox";
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
    serviceSelectionMode?: "single" | "multi" | undefined;
}>;
export declare const CreateBrandSchema: z.ZodObject<{
    name: z.ZodString;
    categoryIds: z.ZodArray<z.ZodString, "many">;
    isActive: z.ZodDefault<z.ZodBoolean>;
    status: z.ZodDefault<z.ZodEnum<["live", "pending", "rejected", "inactive"]>>;
}, "strict", z.ZodTypeAny, {
    status: "pending" | "live" | "rejected" | "inactive";
    categoryIds: string[];
    name: string;
    isActive: boolean;
}, {
    categoryIds: string[];
    name: string;
    status?: "pending" | "live" | "rejected" | "inactive" | undefined;
    isActive?: boolean | undefined;
}>;
export declare const UpdateBrandSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    categoryIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    isActive: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    status: z.ZodOptional<z.ZodDefault<z.ZodEnum<["live", "pending", "rejected", "inactive"]>>>;
}, "strict", z.ZodTypeAny, {
    status?: "pending" | "live" | "rejected" | "inactive" | undefined;
    categoryIds?: string[] | undefined;
    name?: string | undefined;
    isActive?: boolean | undefined;
}, {
    status?: "pending" | "live" | "rejected" | "inactive" | undefined;
    categoryIds?: string[] | undefined;
    name?: string | undefined;
    isActive?: boolean | undefined;
}>;
export declare const BrandSchema: z.ZodObject<{
    name: z.ZodString;
    categoryIds: z.ZodArray<z.ZodString, "many">;
    isActive: z.ZodDefault<z.ZodBoolean>;
    status: z.ZodDefault<z.ZodEnum<["live", "pending", "rejected", "inactive"]>>;
} & {
    id: z.ZodString;
    isDeleted: z.ZodBoolean;
}, "strict", z.ZodTypeAny, {
    status: "pending" | "live" | "rejected" | "inactive";
    id: string;
    categoryIds: string[];
    name: string;
    isDeleted: boolean;
    isActive: boolean;
}, {
    id: string;
    categoryIds: string[];
    name: string;
    isDeleted: boolean;
    status?: "pending" | "live" | "rejected" | "inactive" | undefined;
    isActive?: boolean | undefined;
}>;
export declare const CreateModelSchema: z.ZodObject<{
    name: z.ZodString;
    brandId: z.ZodString;
    categoryIds: z.ZodArray<z.ZodString, "many">;
    isActive: z.ZodDefault<z.ZodBoolean>;
    status: z.ZodDefault<z.ZodEnum<["live", "pending", "rejected", "inactive"]>>;
}, "strict", z.ZodTypeAny, {
    status: "pending" | "live" | "rejected" | "inactive";
    categoryIds: string[];
    brandId: string;
    name: string;
    isActive: boolean;
}, {
    categoryIds: string[];
    brandId: string;
    name: string;
    status?: "pending" | "live" | "rejected" | "inactive" | undefined;
    isActive?: boolean | undefined;
}>;
export declare const UpdateModelSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    brandId: z.ZodOptional<z.ZodString>;
    categoryIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    isActive: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    status: z.ZodOptional<z.ZodDefault<z.ZodEnum<["live", "pending", "rejected", "inactive"]>>>;
}, "strict", z.ZodTypeAny, {
    status?: "pending" | "live" | "rejected" | "inactive" | undefined;
    categoryIds?: string[] | undefined;
    brandId?: string | undefined;
    name?: string | undefined;
    isActive?: boolean | undefined;
}, {
    status?: "pending" | "live" | "rejected" | "inactive" | undefined;
    categoryIds?: string[] | undefined;
    brandId?: string | undefined;
    name?: string | undefined;
    isActive?: boolean | undefined;
}>;
export declare const ModelSchema: z.ZodObject<{
    name: z.ZodString;
    brandId: z.ZodString;
    categoryIds: z.ZodArray<z.ZodString, "many">;
    isActive: z.ZodDefault<z.ZodBoolean>;
    status: z.ZodDefault<z.ZodEnum<["live", "pending", "rejected", "inactive"]>>;
} & {
    id: z.ZodString;
    isDeleted: z.ZodBoolean;
}, "strict", z.ZodTypeAny, {
    status: "pending" | "live" | "rejected" | "inactive";
    id: string;
    categoryIds: string[];
    brandId: string;
    name: string;
    isDeleted: boolean;
    isActive: boolean;
}, {
    id: string;
    categoryIds: string[];
    brandId: string;
    name: string;
    isDeleted: boolean;
    status?: "pending" | "live" | "rejected" | "inactive" | undefined;
    isActive?: boolean | undefined;
}>;
export declare const CreateSparePartSchema: z.ZodObject<{
    name: z.ZodString;
    slug: z.ZodOptional<z.ZodString>;
    listingType: z.ZodOptional<z.ZodArray<z.ZodEnum<["ad", "spare_part"]>, "many">>;
    categoryIds: z.ZodArray<z.ZodString, "many">;
    brandId: z.ZodOptional<z.ZodString>;
    modelId: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodDefault<z.ZodNumber>;
    isActive: z.ZodDefault<z.ZodBoolean>;
}, "strict", z.ZodTypeAny, {
    categoryIds: string[];
    name: string;
    isActive: boolean;
    sortOrder: number;
    brandId?: string | undefined;
    modelId?: string | undefined;
    listingType?: ("ad" | "spare_part")[] | undefined;
    slug?: string | undefined;
}, {
    categoryIds: string[];
    name: string;
    brandId?: string | undefined;
    modelId?: string | undefined;
    isActive?: boolean | undefined;
    sortOrder?: number | undefined;
    listingType?: ("ad" | "spare_part")[] | undefined;
    slug?: string | undefined;
}>;
export declare const UpdateSparePartSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    slug: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    listingType: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodEnum<["ad", "spare_part"]>, "many">>>;
    categoryIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    brandId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    modelId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    sortOrder: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    isActive: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
}, "strict", z.ZodTypeAny, {
    categoryIds?: string[] | undefined;
    brandId?: string | undefined;
    modelId?: string | undefined;
    name?: string | undefined;
    isActive?: boolean | undefined;
    sortOrder?: number | undefined;
    listingType?: ("ad" | "spare_part")[] | undefined;
    slug?: string | undefined;
}, {
    categoryIds?: string[] | undefined;
    brandId?: string | undefined;
    modelId?: string | undefined;
    name?: string | undefined;
    isActive?: boolean | undefined;
    sortOrder?: number | undefined;
    listingType?: ("ad" | "spare_part")[] | undefined;
    slug?: string | undefined;
}>;
export declare const SparePartSchema: z.ZodObject<{
    name: z.ZodString;
    slug: z.ZodOptional<z.ZodString>;
    listingType: z.ZodOptional<z.ZodArray<z.ZodEnum<["ad", "spare_part"]>, "many">>;
    categoryIds: z.ZodArray<z.ZodString, "many">;
    brandId: z.ZodOptional<z.ZodString>;
    modelId: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodDefault<z.ZodNumber>;
    isActive: z.ZodDefault<z.ZodBoolean>;
} & {
    id: z.ZodString;
    isDeleted: z.ZodBoolean;
    usageCount: z.ZodNumber;
    createdAt: z.ZodOptional<z.ZodString>;
    updatedAt: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    id: string;
    categoryIds: string[];
    name: string;
    isDeleted: boolean;
    isActive: boolean;
    sortOrder: number;
    usageCount: number;
    brandId?: string | undefined;
    modelId?: string | undefined;
    updatedAt?: string | undefined;
    createdAt?: string | undefined;
    listingType?: ("ad" | "spare_part")[] | undefined;
    slug?: string | undefined;
}, {
    id: string;
    categoryIds: string[];
    name: string;
    isDeleted: boolean;
    usageCount: number;
    brandId?: string | undefined;
    modelId?: string | undefined;
    updatedAt?: string | undefined;
    isActive?: boolean | undefined;
    createdAt?: string | undefined;
    sortOrder?: number | undefined;
    listingType?: ("ad" | "spare_part")[] | undefined;
    slug?: string | undefined;
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
//# sourceMappingURL=catalog.schema.d.ts.map