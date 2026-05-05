import { z } from 'zod';
export declare const BaseAdPayloadSchema: z.ZodObject<{
    categoryId: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    sparePartId: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    brandId: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    modelId: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    screenSize: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    listingType: z.ZodOptional<z.ZodEnum<[import("../enums/listingType").ListingTypeValue, ...import("../enums/listingType").ListingTypeValue[]]>>;
    attributes: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    title: z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>;
    description: z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>;
    price: z.ZodNumber;
    images: z.ZodArray<z.ZodString, "many">;
    locationId: z.ZodOptional<z.ZodNever>;
    location: z.ZodObject<{
        locationId: z.ZodOptional<z.ZodString>;
        parentId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        path: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        name: z.ZodOptional<z.ZodString>;
        display: z.ZodOptional<z.ZodString>;
        city: z.ZodOptional<z.ZodString>;
        state: z.ZodOptional<z.ZodString>;
        country: z.ZodOptional<z.ZodString>;
        pincode: z.ZodOptional<z.ZodString>;
        level: z.ZodOptional<z.ZodEnum<["country", "state", "district", "city", "area", "village"]>>;
        isActive: z.ZodOptional<z.ZodBoolean>;
        verificationStatus: z.ZodOptional<z.ZodEnum<["pending", "verified", "rejected"]>>;
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
        isSnapped: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        path?: string[] | undefined;
        level?: "country" | "state" | "district" | "city" | "area" | "village" | undefined;
        name?: string | undefined;
        coordinates?: {
            type: "Point";
            coordinates: [number, number];
        } | undefined;
        isActive?: boolean | undefined;
        country?: string | undefined;
        state?: string | undefined;
        city?: string | undefined;
        pincode?: string | undefined;
        locationId?: string | undefined;
        display?: string | undefined;
        isSnapped?: boolean | undefined;
        parentId?: string | null | undefined;
        verificationStatus?: "pending" | "rejected" | "verified" | undefined;
    }, {
        path?: string[] | undefined;
        level?: "country" | "state" | "district" | "city" | "area" | "village" | undefined;
        name?: string | undefined;
        coordinates?: {
            type: "Point";
            coordinates: [number, number];
        } | undefined;
        isActive?: boolean | undefined;
        country?: string | undefined;
        state?: string | undefined;
        city?: string | undefined;
        pincode?: string | undefined;
        locationId?: string | undefined;
        display?: string | undefined;
        isSnapped?: boolean | undefined;
        parentId?: string | null | undefined;
        verificationStatus?: "pending" | "rejected" | "verified" | undefined;
    }>;
    spareParts: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    deviceCondition: z.ZodOptional<z.ZodEnum<["power_on", "power_off"]>>;
    isFree: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    location: {
        path?: string[] | undefined;
        level?: "country" | "state" | "district" | "city" | "area" | "village" | undefined;
        name?: string | undefined;
        coordinates?: {
            type: "Point";
            coordinates: [number, number];
        } | undefined;
        isActive?: boolean | undefined;
        country?: string | undefined;
        state?: string | undefined;
        city?: string | undefined;
        pincode?: string | undefined;
        locationId?: string | undefined;
        display?: string | undefined;
        isSnapped?: boolean | undefined;
        parentId?: string | null | undefined;
        verificationStatus?: "pending" | "rejected" | "verified" | undefined;
    };
    description: string;
    images: string[];
    title: string;
    price: number;
    isFree: boolean;
    categoryId?: string | undefined;
    brandId?: string | undefined;
    modelId?: string | undefined;
    sparePartId?: string | undefined;
    attributes?: Record<string, unknown> | undefined;
    locationId?: undefined;
    screenSize?: string | undefined;
    listingType?: import("../enums/listingType").ListingTypeValue | undefined;
    spareParts?: string[] | undefined;
    deviceCondition?: "power_on" | "power_off" | undefined;
}, {
    location: {
        path?: string[] | undefined;
        level?: "country" | "state" | "district" | "city" | "area" | "village" | undefined;
        name?: string | undefined;
        coordinates?: {
            type: "Point";
            coordinates: [number, number];
        } | undefined;
        isActive?: boolean | undefined;
        country?: string | undefined;
        state?: string | undefined;
        city?: string | undefined;
        pincode?: string | undefined;
        locationId?: string | undefined;
        display?: string | undefined;
        isSnapped?: boolean | undefined;
        parentId?: string | null | undefined;
        verificationStatus?: "pending" | "rejected" | "verified" | undefined;
    };
    description: string;
    images: string[];
    title: string;
    price: number;
    categoryId?: unknown;
    brandId?: unknown;
    modelId?: unknown;
    sparePartId?: unknown;
    attributes?: Record<string, unknown> | undefined;
    locationId?: undefined;
    screenSize?: unknown;
    listingType?: import("../enums/listingType").ListingTypeValue | undefined;
    spareParts?: string[] | undefined;
    deviceCondition?: "power_on" | "power_off" | undefined;
    isFree?: boolean | undefined;
}>;
export declare const AdPayloadSchema: z.ZodEffects<z.ZodObject<{
    categoryId: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    sparePartId: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    brandId: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    modelId: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    screenSize: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    listingType: z.ZodOptional<z.ZodEnum<[import("../enums/listingType").ListingTypeValue, ...import("../enums/listingType").ListingTypeValue[]]>>;
    attributes: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    title: z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>;
    description: z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>;
    price: z.ZodNumber;
    images: z.ZodArray<z.ZodString, "many">;
    locationId: z.ZodOptional<z.ZodNever>;
    location: z.ZodObject<{
        locationId: z.ZodOptional<z.ZodString>;
        parentId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        path: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        name: z.ZodOptional<z.ZodString>;
        display: z.ZodOptional<z.ZodString>;
        city: z.ZodOptional<z.ZodString>;
        state: z.ZodOptional<z.ZodString>;
        country: z.ZodOptional<z.ZodString>;
        pincode: z.ZodOptional<z.ZodString>;
        level: z.ZodOptional<z.ZodEnum<["country", "state", "district", "city", "area", "village"]>>;
        isActive: z.ZodOptional<z.ZodBoolean>;
        verificationStatus: z.ZodOptional<z.ZodEnum<["pending", "verified", "rejected"]>>;
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
        isSnapped: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        path?: string[] | undefined;
        level?: "country" | "state" | "district" | "city" | "area" | "village" | undefined;
        name?: string | undefined;
        coordinates?: {
            type: "Point";
            coordinates: [number, number];
        } | undefined;
        isActive?: boolean | undefined;
        country?: string | undefined;
        state?: string | undefined;
        city?: string | undefined;
        pincode?: string | undefined;
        locationId?: string | undefined;
        display?: string | undefined;
        isSnapped?: boolean | undefined;
        parentId?: string | null | undefined;
        verificationStatus?: "pending" | "rejected" | "verified" | undefined;
    }, {
        path?: string[] | undefined;
        level?: "country" | "state" | "district" | "city" | "area" | "village" | undefined;
        name?: string | undefined;
        coordinates?: {
            type: "Point";
            coordinates: [number, number];
        } | undefined;
        isActive?: boolean | undefined;
        country?: string | undefined;
        state?: string | undefined;
        city?: string | undefined;
        pincode?: string | undefined;
        locationId?: string | undefined;
        display?: string | undefined;
        isSnapped?: boolean | undefined;
        parentId?: string | null | undefined;
        verificationStatus?: "pending" | "rejected" | "verified" | undefined;
    }>;
    spareParts: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    deviceCondition: z.ZodOptional<z.ZodEnum<["power_on", "power_off"]>>;
    isFree: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    location: {
        path?: string[] | undefined;
        level?: "country" | "state" | "district" | "city" | "area" | "village" | undefined;
        name?: string | undefined;
        coordinates?: {
            type: "Point";
            coordinates: [number, number];
        } | undefined;
        isActive?: boolean | undefined;
        country?: string | undefined;
        state?: string | undefined;
        city?: string | undefined;
        pincode?: string | undefined;
        locationId?: string | undefined;
        display?: string | undefined;
        isSnapped?: boolean | undefined;
        parentId?: string | null | undefined;
        verificationStatus?: "pending" | "rejected" | "verified" | undefined;
    };
    description: string;
    images: string[];
    title: string;
    price: number;
    isFree: boolean;
    categoryId?: string | undefined;
    brandId?: string | undefined;
    modelId?: string | undefined;
    sparePartId?: string | undefined;
    attributes?: Record<string, unknown> | undefined;
    locationId?: undefined;
    screenSize?: string | undefined;
    listingType?: import("../enums/listingType").ListingTypeValue | undefined;
    spareParts?: string[] | undefined;
    deviceCondition?: "power_on" | "power_off" | undefined;
}, {
    location: {
        path?: string[] | undefined;
        level?: "country" | "state" | "district" | "city" | "area" | "village" | undefined;
        name?: string | undefined;
        coordinates?: {
            type: "Point";
            coordinates: [number, number];
        } | undefined;
        isActive?: boolean | undefined;
        country?: string | undefined;
        state?: string | undefined;
        city?: string | undefined;
        pincode?: string | undefined;
        locationId?: string | undefined;
        display?: string | undefined;
        isSnapped?: boolean | undefined;
        parentId?: string | null | undefined;
        verificationStatus?: "pending" | "rejected" | "verified" | undefined;
    };
    description: string;
    images: string[];
    title: string;
    price: number;
    categoryId?: unknown;
    brandId?: unknown;
    modelId?: unknown;
    sparePartId?: unknown;
    attributes?: Record<string, unknown> | undefined;
    locationId?: undefined;
    screenSize?: unknown;
    listingType?: import("../enums/listingType").ListingTypeValue | undefined;
    spareParts?: string[] | undefined;
    deviceCondition?: "power_on" | "power_off" | undefined;
    isFree?: boolean | undefined;
}>, {
    location: {
        path?: string[] | undefined;
        level?: "country" | "state" | "district" | "city" | "area" | "village" | undefined;
        name?: string | undefined;
        coordinates?: {
            type: "Point";
            coordinates: [number, number];
        } | undefined;
        isActive?: boolean | undefined;
        country?: string | undefined;
        state?: string | undefined;
        city?: string | undefined;
        pincode?: string | undefined;
        locationId?: string | undefined;
        display?: string | undefined;
        isSnapped?: boolean | undefined;
        parentId?: string | null | undefined;
        verificationStatus?: "pending" | "rejected" | "verified" | undefined;
    };
    description: string;
    images: string[];
    title: string;
    price: number;
    isFree: boolean;
    categoryId?: string | undefined;
    brandId?: string | undefined;
    modelId?: string | undefined;
    sparePartId?: string | undefined;
    attributes?: Record<string, unknown> | undefined;
    locationId?: undefined;
    screenSize?: string | undefined;
    listingType?: import("../enums/listingType").ListingTypeValue | undefined;
    spareParts?: string[] | undefined;
    deviceCondition?: "power_on" | "power_off" | undefined;
}, {
    location: {
        path?: string[] | undefined;
        level?: "country" | "state" | "district" | "city" | "area" | "village" | undefined;
        name?: string | undefined;
        coordinates?: {
            type: "Point";
            coordinates: [number, number];
        } | undefined;
        isActive?: boolean | undefined;
        country?: string | undefined;
        state?: string | undefined;
        city?: string | undefined;
        pincode?: string | undefined;
        locationId?: string | undefined;
        display?: string | undefined;
        isSnapped?: boolean | undefined;
        parentId?: string | null | undefined;
        verificationStatus?: "pending" | "rejected" | "verified" | undefined;
    };
    description: string;
    images: string[];
    title: string;
    price: number;
    categoryId?: unknown;
    brandId?: unknown;
    modelId?: unknown;
    sparePartId?: unknown;
    attributes?: Record<string, unknown> | undefined;
    locationId?: undefined;
    screenSize?: unknown;
    listingType?: import("../enums/listingType").ListingTypeValue | undefined;
    spareParts?: string[] | undefined;
    deviceCondition?: "power_on" | "power_off" | undefined;
    isFree?: boolean | undefined;
}>;
export declare const PartialAdPayloadSchema: z.ZodObject<{
    categoryId: z.ZodOptional<z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>>;
    sparePartId: z.ZodOptional<z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>>;
    brandId: z.ZodOptional<z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>>;
    modelId: z.ZodOptional<z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>>;
    screenSize: z.ZodOptional<z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>>;
    listingType: z.ZodOptional<z.ZodOptional<z.ZodEnum<[import("../enums/listingType").ListingTypeValue, ...import("../enums/listingType").ListingTypeValue[]]>>>;
    attributes: z.ZodOptional<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
    title: z.ZodOptional<z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>>;
    description: z.ZodOptional<z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>>;
    price: z.ZodOptional<z.ZodNumber>;
    images: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    locationId: z.ZodOptional<z.ZodOptional<z.ZodNever>>;
    location: z.ZodOptional<z.ZodObject<{
        locationId: z.ZodOptional<z.ZodString>;
        parentId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        path: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        name: z.ZodOptional<z.ZodString>;
        display: z.ZodOptional<z.ZodString>;
        city: z.ZodOptional<z.ZodString>;
        state: z.ZodOptional<z.ZodString>;
        country: z.ZodOptional<z.ZodString>;
        pincode: z.ZodOptional<z.ZodString>;
        level: z.ZodOptional<z.ZodEnum<["country", "state", "district", "city", "area", "village"]>>;
        isActive: z.ZodOptional<z.ZodBoolean>;
        verificationStatus: z.ZodOptional<z.ZodEnum<["pending", "verified", "rejected"]>>;
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
        isSnapped: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        path?: string[] | undefined;
        level?: "country" | "state" | "district" | "city" | "area" | "village" | undefined;
        name?: string | undefined;
        coordinates?: {
            type: "Point";
            coordinates: [number, number];
        } | undefined;
        isActive?: boolean | undefined;
        country?: string | undefined;
        state?: string | undefined;
        city?: string | undefined;
        pincode?: string | undefined;
        locationId?: string | undefined;
        display?: string | undefined;
        isSnapped?: boolean | undefined;
        parentId?: string | null | undefined;
        verificationStatus?: "pending" | "rejected" | "verified" | undefined;
    }, {
        path?: string[] | undefined;
        level?: "country" | "state" | "district" | "city" | "area" | "village" | undefined;
        name?: string | undefined;
        coordinates?: {
            type: "Point";
            coordinates: [number, number];
        } | undefined;
        isActive?: boolean | undefined;
        country?: string | undefined;
        state?: string | undefined;
        city?: string | undefined;
        pincode?: string | undefined;
        locationId?: string | undefined;
        display?: string | undefined;
        isSnapped?: boolean | undefined;
        parentId?: string | null | undefined;
        verificationStatus?: "pending" | "rejected" | "verified" | undefined;
    }>>;
    spareParts: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
    deviceCondition: z.ZodOptional<z.ZodOptional<z.ZodEnum<["power_on", "power_off"]>>>;
    isFree: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    location?: {
        path?: string[] | undefined;
        level?: "country" | "state" | "district" | "city" | "area" | "village" | undefined;
        name?: string | undefined;
        coordinates?: {
            type: "Point";
            coordinates: [number, number];
        } | undefined;
        isActive?: boolean | undefined;
        country?: string | undefined;
        state?: string | undefined;
        city?: string | undefined;
        pincode?: string | undefined;
        locationId?: string | undefined;
        display?: string | undefined;
        isSnapped?: boolean | undefined;
        parentId?: string | null | undefined;
        verificationStatus?: "pending" | "rejected" | "verified" | undefined;
    } | undefined;
    categoryId?: string | undefined;
    brandId?: string | undefined;
    modelId?: string | undefined;
    sparePartId?: string | undefined;
    description?: string | undefined;
    attributes?: Record<string, unknown> | undefined;
    locationId?: undefined;
    images?: string[] | undefined;
    screenSize?: string | undefined;
    listingType?: import("../enums/listingType").ListingTypeValue | undefined;
    title?: string | undefined;
    price?: number | undefined;
    spareParts?: string[] | undefined;
    deviceCondition?: "power_on" | "power_off" | undefined;
    isFree?: boolean | undefined;
}, {
    location?: {
        path?: string[] | undefined;
        level?: "country" | "state" | "district" | "city" | "area" | "village" | undefined;
        name?: string | undefined;
        coordinates?: {
            type: "Point";
            coordinates: [number, number];
        } | undefined;
        isActive?: boolean | undefined;
        country?: string | undefined;
        state?: string | undefined;
        city?: string | undefined;
        pincode?: string | undefined;
        locationId?: string | undefined;
        display?: string | undefined;
        isSnapped?: boolean | undefined;
        parentId?: string | null | undefined;
        verificationStatus?: "pending" | "rejected" | "verified" | undefined;
    } | undefined;
    categoryId?: unknown;
    brandId?: unknown;
    modelId?: unknown;
    sparePartId?: unknown;
    description?: string | undefined;
    attributes?: Record<string, unknown> | undefined;
    locationId?: undefined;
    images?: string[] | undefined;
    screenSize?: unknown;
    listingType?: import("../enums/listingType").ListingTypeValue | undefined;
    title?: string | undefined;
    price?: number | undefined;
    spareParts?: string[] | undefined;
    deviceCondition?: "power_on" | "power_off" | undefined;
    isFree?: boolean | undefined;
}>;
export type BaseAdPayload = z.infer<typeof BaseAdPayloadSchema>;
export type AdPayload = z.infer<typeof AdPayloadSchema>;
export type PartialAdPayload = z.infer<typeof PartialAdPayloadSchema>;
//# sourceMappingURL=adPayload.schema.d.ts.map