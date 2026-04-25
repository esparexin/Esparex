import { z } from "zod";
export declare const ObjectIdSchema: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodString>;
export declare const CategoryFilterSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    type: z.ZodEnum<{
        number: "number";
        text: "text";
        select: "select";
        range: "range";
        checkbox: "checkbox";
    }>;
    options: z.ZodOptional<z.ZodArray<z.ZodObject<{
        value: z.ZodString;
        label: z.ZodString;
    }, z.core.$strip>>>;
    min: z.ZodOptional<z.ZodNumber>;
    max: z.ZodOptional<z.ZodNumber>;
    unit: z.ZodOptional<z.ZodString>;
    isRequired: z.ZodOptional<z.ZodBoolean>;
    showInFilters: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare const CATEGORY_TYPES: readonly ["AD", "SPARE_PART", "SERVICE", "OTHER"];
export declare const CategoryTypeEnum: z.ZodEnum<{
    OTHER: "OTHER";
    AD: "AD";
    SERVICE: "SERVICE";
    SPARE_PART: "SPARE_PART";
}>;
export type CategoryType = z.infer<typeof CategoryTypeEnum>;
export declare const CreateCategorySchema: z.ZodObject<{
    name: z.ZodString;
    slug: z.ZodString;
    type: z.ZodDefault<z.ZodEnum<{
        OTHER: "OTHER";
        AD: "AD";
        SERVICE: "SERVICE";
        SPARE_PART: "SPARE_PART";
    }>>;
    icon: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    parentId: z.ZodOptional<z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodString>>;
    isActive: z.ZodDefault<z.ZodBoolean>;
    listingType: z.ZodOptional<z.ZodArray<z.ZodEnum<{
        ad: "ad";
        service: "service";
        spare_part: "spare_part";
    }>>>;
    serviceSelectionMode: z.ZodDefault<z.ZodEnum<{
        single: "single";
        multi: "multi";
    }>>;
    hasScreenSizes: z.ZodDefault<z.ZodBoolean>;
    filters: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        type: z.ZodEnum<{
            number: "number";
            text: "text";
            select: "select";
            range: "range";
            checkbox: "checkbox";
        }>;
        options: z.ZodOptional<z.ZodArray<z.ZodObject<{
            value: z.ZodString;
            label: z.ZodString;
        }, z.core.$strip>>>;
        min: z.ZodOptional<z.ZodNumber>;
        max: z.ZodOptional<z.ZodNumber>;
        unit: z.ZodOptional<z.ZodString>;
        isRequired: z.ZodOptional<z.ZodBoolean>;
        showInFilters: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strip>>>;
}, z.core.$strict>;
export declare const UpdateCategorySchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    slug: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodDefault<z.ZodEnum<{
        OTHER: "OTHER";
        AD: "AD";
        SERVICE: "SERVICE";
        SPARE_PART: "SPARE_PART";
    }>>>;
    icon: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    parentId: z.ZodOptional<z.ZodOptional<z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodString>>>;
    isActive: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    listingType: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodEnum<{
        ad: "ad";
        service: "service";
        spare_part: "spare_part";
    }>>>>;
    serviceSelectionMode: z.ZodOptional<z.ZodDefault<z.ZodEnum<{
        single: "single";
        multi: "multi";
    }>>>;
    hasScreenSizes: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    filters: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        type: z.ZodEnum<{
            number: "number";
            text: "text";
            select: "select";
            range: "range";
            checkbox: "checkbox";
        }>;
        options: z.ZodOptional<z.ZodArray<z.ZodObject<{
            value: z.ZodString;
            label: z.ZodString;
        }, z.core.$strip>>>;
        min: z.ZodOptional<z.ZodNumber>;
        max: z.ZodOptional<z.ZodNumber>;
        unit: z.ZodOptional<z.ZodString>;
        isRequired: z.ZodOptional<z.ZodBoolean>;
        showInFilters: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strip>>>>;
}, z.core.$strict>;
export declare const CategorySchema: z.ZodObject<{
    name: z.ZodString;
    slug: z.ZodString;
    type: z.ZodDefault<z.ZodEnum<{
        OTHER: "OTHER";
        AD: "AD";
        SERVICE: "SERVICE";
        SPARE_PART: "SPARE_PART";
    }>>;
    icon: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    parentId: z.ZodOptional<z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodString>>;
    isActive: z.ZodDefault<z.ZodBoolean>;
    listingType: z.ZodOptional<z.ZodArray<z.ZodEnum<{
        ad: "ad";
        service: "service";
        spare_part: "spare_part";
    }>>>;
    serviceSelectionMode: z.ZodDefault<z.ZodEnum<{
        single: "single";
        multi: "multi";
    }>>;
    id: z.ZodString;
    isDeleted: z.ZodBoolean;
    filters: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        type: z.ZodEnum<{
            number: "number";
            text: "text";
            select: "select";
            range: "range";
            checkbox: "checkbox";
        }>;
        options: z.ZodOptional<z.ZodArray<z.ZodObject<{
            value: z.ZodString;
            label: z.ZodString;
        }, z.core.$strip>>>;
        min: z.ZodOptional<z.ZodNumber>;
        max: z.ZodOptional<z.ZodNumber>;
        unit: z.ZodOptional<z.ZodString>;
        isRequired: z.ZodOptional<z.ZodBoolean>;
        showInFilters: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strip>>>;
    hasScreenSizes: z.ZodBoolean;
}, z.core.$strict>;
export declare const CreateBrandSchema: z.ZodObject<{
    name: z.ZodString;
    categoryIds: z.ZodArray<z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodString>>;
    isActive: z.ZodDefault<z.ZodBoolean>;
    status: z.ZodDefault<z.ZodEnum<{
        pending: "pending";
        live: "live";
        rejected: "rejected";
        inactive: "inactive";
    }>>;
}, z.core.$strict>;
export declare const UpdateBrandSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    categoryIds: z.ZodOptional<z.ZodArray<z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodString>>>;
    isActive: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    status: z.ZodOptional<z.ZodDefault<z.ZodEnum<{
        pending: "pending";
        live: "live";
        rejected: "rejected";
        inactive: "inactive";
    }>>>;
}, z.core.$strict>;
export declare const BrandSchema: z.ZodObject<{
    name: z.ZodString;
    categoryIds: z.ZodArray<z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodString>>;
    isActive: z.ZodDefault<z.ZodBoolean>;
    status: z.ZodDefault<z.ZodEnum<{
        pending: "pending";
        live: "live";
        rejected: "rejected";
        inactive: "inactive";
    }>>;
    id: z.ZodString;
    isDeleted: z.ZodBoolean;
}, z.core.$strict>;
export declare const CreateModelSchema: z.ZodObject<{
    name: z.ZodString;
    brandId: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodString>;
    categoryIds: z.ZodArray<z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodString>>;
    isActive: z.ZodDefault<z.ZodBoolean>;
    status: z.ZodDefault<z.ZodEnum<{
        pending: "pending";
        live: "live";
        rejected: "rejected";
        inactive: "inactive";
    }>>;
}, z.core.$strict>;
export declare const UpdateModelSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    brandId: z.ZodOptional<z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodString>>;
    categoryIds: z.ZodOptional<z.ZodArray<z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodString>>>;
    isActive: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    status: z.ZodOptional<z.ZodDefault<z.ZodEnum<{
        pending: "pending";
        live: "live";
        rejected: "rejected";
        inactive: "inactive";
    }>>>;
}, z.core.$strict>;
export declare const ModelSchema: z.ZodObject<{
    name: z.ZodString;
    brandId: z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodString>;
    categoryIds: z.ZodArray<z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodString>>;
    isActive: z.ZodDefault<z.ZodBoolean>;
    status: z.ZodDefault<z.ZodEnum<{
        pending: "pending";
        live: "live";
        rejected: "rejected";
        inactive: "inactive";
    }>>;
    id: z.ZodString;
    isDeleted: z.ZodBoolean;
}, z.core.$strict>;
export declare const CreateSparePartSchema: z.ZodObject<{
    name: z.ZodString;
    slug: z.ZodOptional<z.ZodString>;
    listingType: z.ZodOptional<z.ZodArray<z.ZodEnum<{
        ad: "ad";
        spare_part: "spare_part";
    }>>>;
    categoryIds: z.ZodArray<z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodString>>;
    brandId: z.ZodOptional<z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodString>>;
    modelId: z.ZodOptional<z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodString>>;
    sortOrder: z.ZodDefault<z.ZodNumber>;
    isActive: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strict>;
export declare const UpdateSparePartSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    slug: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    listingType: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodEnum<{
        ad: "ad";
        spare_part: "spare_part";
    }>>>>;
    categoryIds: z.ZodOptional<z.ZodArray<z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodString>>>;
    brandId: z.ZodOptional<z.ZodOptional<z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodString>>>;
    modelId: z.ZodOptional<z.ZodOptional<z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodString>>>;
    sortOrder: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    isActive: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
}, z.core.$strict>;
export declare const SparePartSchema: z.ZodObject<{
    name: z.ZodString;
    slug: z.ZodOptional<z.ZodString>;
    listingType: z.ZodOptional<z.ZodArray<z.ZodEnum<{
        ad: "ad";
        spare_part: "spare_part";
    }>>>;
    categoryIds: z.ZodArray<z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodString>>;
    brandId: z.ZodOptional<z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodString>>;
    modelId: z.ZodOptional<z.ZodPipe<z.ZodTransform<{} | undefined, unknown>, z.ZodString>>;
    sortOrder: z.ZodDefault<z.ZodNumber>;
    isActive: z.ZodDefault<z.ZodBoolean>;
    id: z.ZodString;
    isDeleted: z.ZodBoolean;
    usageCount: z.ZodNumber;
    createdAt: z.ZodOptional<z.ZodString>;
    updatedAt: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
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
