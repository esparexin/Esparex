import { z } from 'zod';
export declare const smartAlertCriteriaSchema: z.ZodEffects<z.ZodObject<{
    keywords: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    category: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    brand: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    model: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    categoryId: z.ZodOptional<z.ZodString>;
    brandId: z.ZodOptional<z.ZodString>;
    modelId: z.ZodOptional<z.ZodString>;
    minPrice: z.ZodOptional<z.ZodNumber>;
    maxPrice: z.ZodOptional<z.ZodNumber>;
    condition: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    location: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    locationId: z.ZodOptional<z.ZodString>;
    state: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    coordinates: z.ZodOptional<z.ZodObject<{
        type: z.ZodLiteral<"Point">;
        coordinates: z.ZodEffects<z.ZodTuple<[z.ZodEffects<z.ZodNumber, number, number>, z.ZodEffects<z.ZodNumber, number, number>], null>, [number, number], [number, number]>;
    }, "strip", z.ZodTypeAny, {
        type: "Point";
        coordinates: [number, number];
    }, {
        type: "Point";
        coordinates: [number, number];
    }>>;
}, "strip", z.ZodTypeAny, {
    model?: string | undefined;
    location?: string | undefined;
    coordinates?: {
        type: "Point";
        coordinates: [number, number];
    } | undefined;
    locationId?: string | undefined;
    state?: string | undefined;
    brandId?: string | undefined;
    modelId?: string | undefined;
    categoryId?: string | undefined;
    minPrice?: number | undefined;
    maxPrice?: number | undefined;
    category?: string | undefined;
    brand?: string | undefined;
    keywords?: string | undefined;
    condition?: string | undefined;
}, {
    model?: unknown;
    location?: unknown;
    coordinates?: {
        type: "Point";
        coordinates: [number, number];
    } | undefined;
    locationId?: string | undefined;
    state?: unknown;
    brandId?: string | undefined;
    modelId?: string | undefined;
    categoryId?: string | undefined;
    minPrice?: number | undefined;
    maxPrice?: number | undefined;
    category?: unknown;
    brand?: unknown;
    keywords?: unknown;
    condition?: unknown;
}>, {
    model?: string | undefined;
    location?: string | undefined;
    coordinates?: {
        type: "Point";
        coordinates: [number, number];
    } | undefined;
    locationId?: string | undefined;
    state?: string | undefined;
    brandId?: string | undefined;
    modelId?: string | undefined;
    categoryId?: string | undefined;
    minPrice?: number | undefined;
    maxPrice?: number | undefined;
    category?: string | undefined;
    brand?: string | undefined;
    keywords?: string | undefined;
    condition?: string | undefined;
}, {
    model?: unknown;
    location?: unknown;
    coordinates?: {
        type: "Point";
        coordinates: [number, number];
    } | undefined;
    locationId?: string | undefined;
    state?: unknown;
    brandId?: string | undefined;
    modelId?: string | undefined;
    categoryId?: string | undefined;
    minPrice?: number | undefined;
    maxPrice?: number | undefined;
    category?: unknown;
    brand?: unknown;
    keywords?: unknown;
    condition?: unknown;
}>;
export declare const smartAlertBodySchema: z.ZodObject<{
    alertName: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    name: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    criteria: z.ZodOptional<z.ZodEffects<z.ZodObject<{
        keywords: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
        category: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
        brand: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
        model: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
        categoryId: z.ZodOptional<z.ZodString>;
        brandId: z.ZodOptional<z.ZodString>;
        modelId: z.ZodOptional<z.ZodString>;
        minPrice: z.ZodOptional<z.ZodNumber>;
        maxPrice: z.ZodOptional<z.ZodNumber>;
        condition: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
        location: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
        locationId: z.ZodOptional<z.ZodString>;
        state: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
        coordinates: z.ZodOptional<z.ZodObject<{
            type: z.ZodLiteral<"Point">;
            coordinates: z.ZodEffects<z.ZodTuple<[z.ZodEffects<z.ZodNumber, number, number>, z.ZodEffects<z.ZodNumber, number, number>], null>, [number, number], [number, number]>;
        }, "strip", z.ZodTypeAny, {
            type: "Point";
            coordinates: [number, number];
        }, {
            type: "Point";
            coordinates: [number, number];
        }>>;
    }, "strip", z.ZodTypeAny, {
        model?: string | undefined;
        location?: string | undefined;
        coordinates?: {
            type: "Point";
            coordinates: [number, number];
        } | undefined;
        locationId?: string | undefined;
        state?: string | undefined;
        brandId?: string | undefined;
        modelId?: string | undefined;
        categoryId?: string | undefined;
        minPrice?: number | undefined;
        maxPrice?: number | undefined;
        category?: string | undefined;
        brand?: string | undefined;
        keywords?: string | undefined;
        condition?: string | undefined;
    }, {
        model?: unknown;
        location?: unknown;
        coordinates?: {
            type: "Point";
            coordinates: [number, number];
        } | undefined;
        locationId?: string | undefined;
        state?: unknown;
        brandId?: string | undefined;
        modelId?: string | undefined;
        categoryId?: string | undefined;
        minPrice?: number | undefined;
        maxPrice?: number | undefined;
        category?: unknown;
        brand?: unknown;
        keywords?: unknown;
        condition?: unknown;
    }>, {
        model?: string | undefined;
        location?: string | undefined;
        coordinates?: {
            type: "Point";
            coordinates: [number, number];
        } | undefined;
        locationId?: string | undefined;
        state?: string | undefined;
        brandId?: string | undefined;
        modelId?: string | undefined;
        categoryId?: string | undefined;
        minPrice?: number | undefined;
        maxPrice?: number | undefined;
        category?: string | undefined;
        brand?: string | undefined;
        keywords?: string | undefined;
        condition?: string | undefined;
    }, {
        model?: unknown;
        location?: unknown;
        coordinates?: {
            type: "Point";
            coordinates: [number, number];
        } | undefined;
        locationId?: string | undefined;
        state?: unknown;
        brandId?: string | undefined;
        modelId?: string | undefined;
        categoryId?: string | undefined;
        minPrice?: number | undefined;
        maxPrice?: number | undefined;
        category?: unknown;
        brand?: unknown;
        keywords?: unknown;
        condition?: unknown;
    }>>;
    frequency: z.ZodOptional<z.ZodEnum<["daily", "instant"]>>;
    coordinates: z.ZodOptional<z.ZodObject<{
        type: z.ZodLiteral<"Point">;
        coordinates: z.ZodEffects<z.ZodTuple<[z.ZodEffects<z.ZodNumber, number, number>, z.ZodEffects<z.ZodNumber, number, number>], null>, [number, number], [number, number]>;
    }, "strip", z.ZodTypeAny, {
        type: "Point";
        coordinates: [number, number];
    }, {
        type: "Point";
        coordinates: [number, number];
    }>>;
    radiusKm: z.ZodOptional<z.ZodNumber>;
    notificationChannels: z.ZodOptional<z.ZodArray<z.ZodEnum<["email", "sms", "push"]>, "many">>;
}, "strict", z.ZodTypeAny, {
    frequency?: "instant" | "daily" | undefined;
    name?: string | undefined;
    coordinates?: {
        type: "Point";
        coordinates: [number, number];
    } | undefined;
    notificationChannels?: ("push" | "email" | "sms")[] | undefined;
    alertName?: string | undefined;
    criteria?: {
        model?: string | undefined;
        location?: string | undefined;
        coordinates?: {
            type: "Point";
            coordinates: [number, number];
        } | undefined;
        locationId?: string | undefined;
        state?: string | undefined;
        brandId?: string | undefined;
        modelId?: string | undefined;
        categoryId?: string | undefined;
        minPrice?: number | undefined;
        maxPrice?: number | undefined;
        category?: string | undefined;
        brand?: string | undefined;
        keywords?: string | undefined;
        condition?: string | undefined;
    } | undefined;
    radiusKm?: number | undefined;
}, {
    frequency?: "instant" | "daily" | undefined;
    name?: unknown;
    coordinates?: {
        type: "Point";
        coordinates: [number, number];
    } | undefined;
    notificationChannels?: ("push" | "email" | "sms")[] | undefined;
    alertName?: unknown;
    criteria?: {
        model?: unknown;
        location?: unknown;
        coordinates?: {
            type: "Point";
            coordinates: [number, number];
        } | undefined;
        locationId?: string | undefined;
        state?: unknown;
        brandId?: string | undefined;
        modelId?: string | undefined;
        categoryId?: string | undefined;
        minPrice?: number | undefined;
        maxPrice?: number | undefined;
        category?: unknown;
        brand?: unknown;
        keywords?: unknown;
        condition?: unknown;
    } | undefined;
    radiusKm?: number | undefined;
}>;
export declare const SmartAlertCreateSchema: z.ZodEffects<z.ZodEffects<z.ZodObject<{
    alertName: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    name: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    criteria: z.ZodOptional<z.ZodEffects<z.ZodObject<{
        keywords: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
        category: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
        brand: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
        model: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
        categoryId: z.ZodOptional<z.ZodString>;
        brandId: z.ZodOptional<z.ZodString>;
        modelId: z.ZodOptional<z.ZodString>;
        minPrice: z.ZodOptional<z.ZodNumber>;
        maxPrice: z.ZodOptional<z.ZodNumber>;
        condition: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
        location: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
        locationId: z.ZodOptional<z.ZodString>;
        state: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
        coordinates: z.ZodOptional<z.ZodObject<{
            type: z.ZodLiteral<"Point">;
            coordinates: z.ZodEffects<z.ZodTuple<[z.ZodEffects<z.ZodNumber, number, number>, z.ZodEffects<z.ZodNumber, number, number>], null>, [number, number], [number, number]>;
        }, "strip", z.ZodTypeAny, {
            type: "Point";
            coordinates: [number, number];
        }, {
            type: "Point";
            coordinates: [number, number];
        }>>;
    }, "strip", z.ZodTypeAny, {
        model?: string | undefined;
        location?: string | undefined;
        coordinates?: {
            type: "Point";
            coordinates: [number, number];
        } | undefined;
        locationId?: string | undefined;
        state?: string | undefined;
        brandId?: string | undefined;
        modelId?: string | undefined;
        categoryId?: string | undefined;
        minPrice?: number | undefined;
        maxPrice?: number | undefined;
        category?: string | undefined;
        brand?: string | undefined;
        keywords?: string | undefined;
        condition?: string | undefined;
    }, {
        model?: unknown;
        location?: unknown;
        coordinates?: {
            type: "Point";
            coordinates: [number, number];
        } | undefined;
        locationId?: string | undefined;
        state?: unknown;
        brandId?: string | undefined;
        modelId?: string | undefined;
        categoryId?: string | undefined;
        minPrice?: number | undefined;
        maxPrice?: number | undefined;
        category?: unknown;
        brand?: unknown;
        keywords?: unknown;
        condition?: unknown;
    }>, {
        model?: string | undefined;
        location?: string | undefined;
        coordinates?: {
            type: "Point";
            coordinates: [number, number];
        } | undefined;
        locationId?: string | undefined;
        state?: string | undefined;
        brandId?: string | undefined;
        modelId?: string | undefined;
        categoryId?: string | undefined;
        minPrice?: number | undefined;
        maxPrice?: number | undefined;
        category?: string | undefined;
        brand?: string | undefined;
        keywords?: string | undefined;
        condition?: string | undefined;
    }, {
        model?: unknown;
        location?: unknown;
        coordinates?: {
            type: "Point";
            coordinates: [number, number];
        } | undefined;
        locationId?: string | undefined;
        state?: unknown;
        brandId?: string | undefined;
        modelId?: string | undefined;
        categoryId?: string | undefined;
        minPrice?: number | undefined;
        maxPrice?: number | undefined;
        category?: unknown;
        brand?: unknown;
        keywords?: unknown;
        condition?: unknown;
    }>>;
    frequency: z.ZodOptional<z.ZodEnum<["daily", "instant"]>>;
    coordinates: z.ZodOptional<z.ZodObject<{
        type: z.ZodLiteral<"Point">;
        coordinates: z.ZodEffects<z.ZodTuple<[z.ZodEffects<z.ZodNumber, number, number>, z.ZodEffects<z.ZodNumber, number, number>], null>, [number, number], [number, number]>;
    }, "strip", z.ZodTypeAny, {
        type: "Point";
        coordinates: [number, number];
    }, {
        type: "Point";
        coordinates: [number, number];
    }>>;
    radiusKm: z.ZodOptional<z.ZodNumber>;
    notificationChannels: z.ZodOptional<z.ZodArray<z.ZodEnum<["email", "sms", "push"]>, "many">>;
}, "strict", z.ZodTypeAny, {
    frequency?: "instant" | "daily" | undefined;
    name?: string | undefined;
    coordinates?: {
        type: "Point";
        coordinates: [number, number];
    } | undefined;
    notificationChannels?: ("push" | "email" | "sms")[] | undefined;
    alertName?: string | undefined;
    criteria?: {
        model?: string | undefined;
        location?: string | undefined;
        coordinates?: {
            type: "Point";
            coordinates: [number, number];
        } | undefined;
        locationId?: string | undefined;
        state?: string | undefined;
        brandId?: string | undefined;
        modelId?: string | undefined;
        categoryId?: string | undefined;
        minPrice?: number | undefined;
        maxPrice?: number | undefined;
        category?: string | undefined;
        brand?: string | undefined;
        keywords?: string | undefined;
        condition?: string | undefined;
    } | undefined;
    radiusKm?: number | undefined;
}, {
    frequency?: "instant" | "daily" | undefined;
    name?: unknown;
    coordinates?: {
        type: "Point";
        coordinates: [number, number];
    } | undefined;
    notificationChannels?: ("push" | "email" | "sms")[] | undefined;
    alertName?: unknown;
    criteria?: {
        model?: unknown;
        location?: unknown;
        coordinates?: {
            type: "Point";
            coordinates: [number, number];
        } | undefined;
        locationId?: string | undefined;
        state?: unknown;
        brandId?: string | undefined;
        modelId?: string | undefined;
        categoryId?: string | undefined;
        minPrice?: number | undefined;
        maxPrice?: number | undefined;
        category?: unknown;
        brand?: unknown;
        keywords?: unknown;
        condition?: unknown;
    } | undefined;
    radiusKm?: number | undefined;
}>, {
    frequency?: "instant" | "daily" | undefined;
    name?: string | undefined;
    coordinates?: {
        type: "Point";
        coordinates: [number, number];
    } | undefined;
    notificationChannels?: ("push" | "email" | "sms")[] | undefined;
    alertName?: string | undefined;
    criteria?: {
        model?: string | undefined;
        location?: string | undefined;
        coordinates?: {
            type: "Point";
            coordinates: [number, number];
        } | undefined;
        locationId?: string | undefined;
        state?: string | undefined;
        brandId?: string | undefined;
        modelId?: string | undefined;
        categoryId?: string | undefined;
        minPrice?: number | undefined;
        maxPrice?: number | undefined;
        category?: string | undefined;
        brand?: string | undefined;
        keywords?: string | undefined;
        condition?: string | undefined;
    } | undefined;
    radiusKm?: number | undefined;
}, {
    frequency?: "instant" | "daily" | undefined;
    name?: unknown;
    coordinates?: {
        type: "Point";
        coordinates: [number, number];
    } | undefined;
    notificationChannels?: ("push" | "email" | "sms")[] | undefined;
    alertName?: unknown;
    criteria?: {
        model?: unknown;
        location?: unknown;
        coordinates?: {
            type: "Point";
            coordinates: [number, number];
        } | undefined;
        locationId?: string | undefined;
        state?: unknown;
        brandId?: string | undefined;
        modelId?: string | undefined;
        categoryId?: string | undefined;
        minPrice?: number | undefined;
        maxPrice?: number | undefined;
        category?: unknown;
        brand?: unknown;
        keywords?: unknown;
        condition?: unknown;
    } | undefined;
    radiusKm?: number | undefined;
}>, {
    frequency?: "instant" | "daily" | undefined;
    name: string | undefined;
    coordinates?: {
        type: "Point";
        coordinates: [number, number];
    } | undefined;
    notificationChannels?: ("push" | "email" | "sms")[] | undefined;
    alertName?: string | undefined;
    criteria?: {
        model?: string | undefined;
        location?: string | undefined;
        coordinates?: {
            type: "Point";
            coordinates: [number, number];
        } | undefined;
        locationId?: string | undefined;
        state?: string | undefined;
        brandId?: string | undefined;
        modelId?: string | undefined;
        categoryId?: string | undefined;
        minPrice?: number | undefined;
        maxPrice?: number | undefined;
        category?: string | undefined;
        brand?: string | undefined;
        keywords?: string | undefined;
        condition?: string | undefined;
    } | undefined;
    radiusKm?: number | undefined;
}, {
    frequency?: "instant" | "daily" | undefined;
    name?: unknown;
    coordinates?: {
        type: "Point";
        coordinates: [number, number];
    } | undefined;
    notificationChannels?: ("push" | "email" | "sms")[] | undefined;
    alertName?: unknown;
    criteria?: {
        model?: unknown;
        location?: unknown;
        coordinates?: {
            type: "Point";
            coordinates: [number, number];
        } | undefined;
        locationId?: string | undefined;
        state?: unknown;
        brandId?: string | undefined;
        modelId?: string | undefined;
        categoryId?: string | undefined;
        minPrice?: number | undefined;
        maxPrice?: number | undefined;
        category?: unknown;
        brand?: unknown;
        keywords?: unknown;
        condition?: unknown;
    } | undefined;
    radiusKm?: number | undefined;
}>;
export declare const SmartAlertUpdateSchema: z.ZodEffects<z.ZodEffects<z.ZodObject<{
    alertName: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    name: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    criteria: z.ZodOptional<z.ZodEffects<z.ZodObject<{
        keywords: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
        category: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
        brand: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
        model: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
        categoryId: z.ZodOptional<z.ZodString>;
        brandId: z.ZodOptional<z.ZodString>;
        modelId: z.ZodOptional<z.ZodString>;
        minPrice: z.ZodOptional<z.ZodNumber>;
        maxPrice: z.ZodOptional<z.ZodNumber>;
        condition: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
        location: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
        locationId: z.ZodOptional<z.ZodString>;
        state: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
        coordinates: z.ZodOptional<z.ZodObject<{
            type: z.ZodLiteral<"Point">;
            coordinates: z.ZodEffects<z.ZodTuple<[z.ZodEffects<z.ZodNumber, number, number>, z.ZodEffects<z.ZodNumber, number, number>], null>, [number, number], [number, number]>;
        }, "strip", z.ZodTypeAny, {
            type: "Point";
            coordinates: [number, number];
        }, {
            type: "Point";
            coordinates: [number, number];
        }>>;
    }, "strip", z.ZodTypeAny, {
        model?: string | undefined;
        location?: string | undefined;
        coordinates?: {
            type: "Point";
            coordinates: [number, number];
        } | undefined;
        locationId?: string | undefined;
        state?: string | undefined;
        brandId?: string | undefined;
        modelId?: string | undefined;
        categoryId?: string | undefined;
        minPrice?: number | undefined;
        maxPrice?: number | undefined;
        category?: string | undefined;
        brand?: string | undefined;
        keywords?: string | undefined;
        condition?: string | undefined;
    }, {
        model?: unknown;
        location?: unknown;
        coordinates?: {
            type: "Point";
            coordinates: [number, number];
        } | undefined;
        locationId?: string | undefined;
        state?: unknown;
        brandId?: string | undefined;
        modelId?: string | undefined;
        categoryId?: string | undefined;
        minPrice?: number | undefined;
        maxPrice?: number | undefined;
        category?: unknown;
        brand?: unknown;
        keywords?: unknown;
        condition?: unknown;
    }>, {
        model?: string | undefined;
        location?: string | undefined;
        coordinates?: {
            type: "Point";
            coordinates: [number, number];
        } | undefined;
        locationId?: string | undefined;
        state?: string | undefined;
        brandId?: string | undefined;
        modelId?: string | undefined;
        categoryId?: string | undefined;
        minPrice?: number | undefined;
        maxPrice?: number | undefined;
        category?: string | undefined;
        brand?: string | undefined;
        keywords?: string | undefined;
        condition?: string | undefined;
    }, {
        model?: unknown;
        location?: unknown;
        coordinates?: {
            type: "Point";
            coordinates: [number, number];
        } | undefined;
        locationId?: string | undefined;
        state?: unknown;
        brandId?: string | undefined;
        modelId?: string | undefined;
        categoryId?: string | undefined;
        minPrice?: number | undefined;
        maxPrice?: number | undefined;
        category?: unknown;
        brand?: unknown;
        keywords?: unknown;
        condition?: unknown;
    }>>;
    frequency: z.ZodOptional<z.ZodEnum<["daily", "instant"]>>;
    coordinates: z.ZodOptional<z.ZodObject<{
        type: z.ZodLiteral<"Point">;
        coordinates: z.ZodEffects<z.ZodTuple<[z.ZodEffects<z.ZodNumber, number, number>, z.ZodEffects<z.ZodNumber, number, number>], null>, [number, number], [number, number]>;
    }, "strip", z.ZodTypeAny, {
        type: "Point";
        coordinates: [number, number];
    }, {
        type: "Point";
        coordinates: [number, number];
    }>>;
    radiusKm: z.ZodOptional<z.ZodNumber>;
    notificationChannels: z.ZodOptional<z.ZodArray<z.ZodEnum<["email", "sms", "push"]>, "many">>;
}, "strict", z.ZodTypeAny, {
    frequency?: "instant" | "daily" | undefined;
    name?: string | undefined;
    coordinates?: {
        type: "Point";
        coordinates: [number, number];
    } | undefined;
    notificationChannels?: ("push" | "email" | "sms")[] | undefined;
    alertName?: string | undefined;
    criteria?: {
        model?: string | undefined;
        location?: string | undefined;
        coordinates?: {
            type: "Point";
            coordinates: [number, number];
        } | undefined;
        locationId?: string | undefined;
        state?: string | undefined;
        brandId?: string | undefined;
        modelId?: string | undefined;
        categoryId?: string | undefined;
        minPrice?: number | undefined;
        maxPrice?: number | undefined;
        category?: string | undefined;
        brand?: string | undefined;
        keywords?: string | undefined;
        condition?: string | undefined;
    } | undefined;
    radiusKm?: number | undefined;
}, {
    frequency?: "instant" | "daily" | undefined;
    name?: unknown;
    coordinates?: {
        type: "Point";
        coordinates: [number, number];
    } | undefined;
    notificationChannels?: ("push" | "email" | "sms")[] | undefined;
    alertName?: unknown;
    criteria?: {
        model?: unknown;
        location?: unknown;
        coordinates?: {
            type: "Point";
            coordinates: [number, number];
        } | undefined;
        locationId?: string | undefined;
        state?: unknown;
        brandId?: string | undefined;
        modelId?: string | undefined;
        categoryId?: string | undefined;
        minPrice?: number | undefined;
        maxPrice?: number | undefined;
        category?: unknown;
        brand?: unknown;
        keywords?: unknown;
        condition?: unknown;
    } | undefined;
    radiusKm?: number | undefined;
}>, {
    frequency?: "instant" | "daily" | undefined;
    name?: string | undefined;
    coordinates?: {
        type: "Point";
        coordinates: [number, number];
    } | undefined;
    notificationChannels?: ("push" | "email" | "sms")[] | undefined;
    alertName?: string | undefined;
    criteria?: {
        model?: string | undefined;
        location?: string | undefined;
        coordinates?: {
            type: "Point";
            coordinates: [number, number];
        } | undefined;
        locationId?: string | undefined;
        state?: string | undefined;
        brandId?: string | undefined;
        modelId?: string | undefined;
        categoryId?: string | undefined;
        minPrice?: number | undefined;
        maxPrice?: number | undefined;
        category?: string | undefined;
        brand?: string | undefined;
        keywords?: string | undefined;
        condition?: string | undefined;
    } | undefined;
    radiusKm?: number | undefined;
}, {
    frequency?: "instant" | "daily" | undefined;
    name?: unknown;
    coordinates?: {
        type: "Point";
        coordinates: [number, number];
    } | undefined;
    notificationChannels?: ("push" | "email" | "sms")[] | undefined;
    alertName?: unknown;
    criteria?: {
        model?: unknown;
        location?: unknown;
        coordinates?: {
            type: "Point";
            coordinates: [number, number];
        } | undefined;
        locationId?: string | undefined;
        state?: unknown;
        brandId?: string | undefined;
        modelId?: string | undefined;
        categoryId?: string | undefined;
        minPrice?: number | undefined;
        maxPrice?: number | undefined;
        category?: unknown;
        brand?: unknown;
        keywords?: unknown;
        condition?: unknown;
    } | undefined;
    radiusKm?: number | undefined;
}>, {
    frequency?: "instant" | "daily" | undefined;
    name: string | undefined;
    coordinates?: {
        type: "Point";
        coordinates: [number, number];
    } | undefined;
    notificationChannels?: ("push" | "email" | "sms")[] | undefined;
    alertName?: string | undefined;
    criteria?: {
        model?: string | undefined;
        location?: string | undefined;
        coordinates?: {
            type: "Point";
            coordinates: [number, number];
        } | undefined;
        locationId?: string | undefined;
        state?: string | undefined;
        brandId?: string | undefined;
        modelId?: string | undefined;
        categoryId?: string | undefined;
        minPrice?: number | undefined;
        maxPrice?: number | undefined;
        category?: string | undefined;
        brand?: string | undefined;
        keywords?: string | undefined;
        condition?: string | undefined;
    } | undefined;
    radiusKm?: number | undefined;
}, {
    frequency?: "instant" | "daily" | undefined;
    name?: unknown;
    coordinates?: {
        type: "Point";
        coordinates: [number, number];
    } | undefined;
    notificationChannels?: ("push" | "email" | "sms")[] | undefined;
    alertName?: unknown;
    criteria?: {
        model?: unknown;
        location?: unknown;
        coordinates?: {
            type: "Point";
            coordinates: [number, number];
        } | undefined;
        locationId?: string | undefined;
        state?: unknown;
        brandId?: string | undefined;
        modelId?: string | undefined;
        categoryId?: string | undefined;
        minPrice?: number | undefined;
        maxPrice?: number | undefined;
        category?: unknown;
        brand?: unknown;
        keywords?: unknown;
        condition?: unknown;
    } | undefined;
    radiusKm?: number | undefined;
}>;
export type SmartAlertCreatePayload = z.infer<typeof SmartAlertCreateSchema>;
export type SmartAlertUpdatePayload = z.infer<typeof SmartAlertUpdateSchema>;
export declare const SmartAlertDeliveryLogSchema: z.ZodObject<{
    _id: z.ZodString;
    alertId: z.ZodUnion<[z.ZodString, z.ZodObject<{
        _id: z.ZodString;
        name: z.ZodString;
        criteria: z.ZodRecord<z.ZodString, z.ZodAny>;
        user: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        _id: string;
        name: string;
        criteria: Record<string, any>;
        user?: string | undefined;
    }, {
        _id: string;
        name: string;
        criteria: Record<string, any>;
        user?: string | undefined;
    }>]>;
    adId: z.ZodUnion<[z.ZodString, z.ZodObject<{
        _id: z.ZodString;
        title: z.ZodString;
        price: z.ZodNumber;
        location: z.ZodOptional<z.ZodString>;
        status: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        status: string;
        _id: string;
        title: string;
        price: number;
        location?: string | undefined;
    }, {
        status: string;
        _id: string;
        title: string;
        price: number;
        location?: string | undefined;
    }>]>;
    deliveredAt: z.ZodUnion<[z.ZodString, z.ZodDate]>;
    userName: z.ZodOptional<z.ZodString>;
    userEmail: z.ZodOptional<z.ZodString>;
    adTitle: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    _id: string;
    alertId: string | {
        _id: string;
        name: string;
        criteria: Record<string, any>;
        user?: string | undefined;
    };
    adId: string | {
        status: string;
        _id: string;
        title: string;
        price: number;
        location?: string | undefined;
    };
    deliveredAt: string | Date;
    userName?: string | undefined;
    userEmail?: string | undefined;
    adTitle?: string | undefined;
}, {
    _id: string;
    alertId: string | {
        _id: string;
        name: string;
        criteria: Record<string, any>;
        user?: string | undefined;
    };
    adId: string | {
        status: string;
        _id: string;
        title: string;
        price: number;
        location?: string | undefined;
    };
    deliveredAt: string | Date;
    userName?: string | undefined;
    userEmail?: string | undefined;
    adTitle?: string | undefined;
}>;
export type SmartAlertDeliveryLogDTO = z.infer<typeof SmartAlertDeliveryLogSchema>;
