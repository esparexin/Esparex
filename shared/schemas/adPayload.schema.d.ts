import { z } from 'zod';
export declare const BaseAdPayloadSchema: z.ZodObject<{
    categoryId: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodOptional<z.ZodString>>;
    sparePartId: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodOptional<z.ZodString>>;
    brandId: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodOptional<z.ZodString>>;
    modelId: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodOptional<z.ZodString>>;
    screenSize: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodOptional<z.ZodString>>;
    listingType: z.ZodOptional<z.ZodEnum<{
        ad: "ad";
        service: "service";
        spare_part: "spare_part";
    }>>;
    attributes: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    title: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
    description: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
    price: z.ZodNumber;
    images: z.ZodArray<z.ZodString>;
    locationId: z.ZodOptional<z.ZodNever>;
    location: z.ZodObject<{
        locationId: z.ZodOptional<z.ZodString>;
        parentId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        path: z.ZodOptional<z.ZodArray<z.ZodString>>;
        name: z.ZodOptional<z.ZodString>;
        display: z.ZodOptional<z.ZodString>;
        city: z.ZodOptional<z.ZodString>;
        state: z.ZodOptional<z.ZodString>;
        country: z.ZodOptional<z.ZodString>;
        pincode: z.ZodOptional<z.ZodString>;
        level: z.ZodOptional<z.ZodEnum<{
            country: "country";
            state: "state";
            district: "district";
            city: "city";
            area: "area";
            village: "village";
        }>>;
        isActive: z.ZodOptional<z.ZodBoolean>;
        verificationStatus: z.ZodOptional<z.ZodEnum<{
            pending: "pending";
            rejected: "rejected";
            verified: "verified";
        }>>;
        coordinates: z.ZodOptional<z.ZodObject<{
            type: z.ZodLiteral<"Point">;
            coordinates: z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>;
        }, z.core.$strip>>;
    }, z.core.$strip>;
    spareParts: z.ZodOptional<z.ZodArray<z.ZodString>>;
    deviceCondition: z.ZodOptional<z.ZodEnum<{
        power_on: "power_on";
        power_off: "power_off";
    }>>;
    isFree: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strip>;
export declare const AdPayloadSchema: z.ZodObject<{
    categoryId: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodOptional<z.ZodString>>;
    sparePartId: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodOptional<z.ZodString>>;
    brandId: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodOptional<z.ZodString>>;
    modelId: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodOptional<z.ZodString>>;
    screenSize: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodOptional<z.ZodString>>;
    listingType: z.ZodOptional<z.ZodEnum<{
        ad: "ad";
        service: "service";
        spare_part: "spare_part";
    }>>;
    attributes: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    title: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
    description: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
    price: z.ZodNumber;
    images: z.ZodArray<z.ZodString>;
    locationId: z.ZodOptional<z.ZodNever>;
    location: z.ZodObject<{
        locationId: z.ZodOptional<z.ZodString>;
        parentId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        path: z.ZodOptional<z.ZodArray<z.ZodString>>;
        name: z.ZodOptional<z.ZodString>;
        display: z.ZodOptional<z.ZodString>;
        city: z.ZodOptional<z.ZodString>;
        state: z.ZodOptional<z.ZodString>;
        country: z.ZodOptional<z.ZodString>;
        pincode: z.ZodOptional<z.ZodString>;
        level: z.ZodOptional<z.ZodEnum<{
            country: "country";
            state: "state";
            district: "district";
            city: "city";
            area: "area";
            village: "village";
        }>>;
        isActive: z.ZodOptional<z.ZodBoolean>;
        verificationStatus: z.ZodOptional<z.ZodEnum<{
            pending: "pending";
            rejected: "rejected";
            verified: "verified";
        }>>;
        coordinates: z.ZodOptional<z.ZodObject<{
            type: z.ZodLiteral<"Point">;
            coordinates: z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>;
        }, z.core.$strip>>;
    }, z.core.$strip>;
    spareParts: z.ZodOptional<z.ZodArray<z.ZodString>>;
    deviceCondition: z.ZodOptional<z.ZodEnum<{
        power_on: "power_on";
        power_off: "power_off";
    }>>;
    isFree: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strip>;
export declare const PartialAdPayloadSchema: z.ZodObject<{
    categoryId: z.ZodOptional<z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodOptional<z.ZodString>>>;
    sparePartId: z.ZodOptional<z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodOptional<z.ZodString>>>;
    brandId: z.ZodOptional<z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodOptional<z.ZodString>>>;
    modelId: z.ZodOptional<z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodOptional<z.ZodString>>>;
    screenSize: z.ZodOptional<z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodOptional<z.ZodString>>>;
    listingType: z.ZodOptional<z.ZodOptional<z.ZodEnum<{
        ad: "ad";
        service: "service";
        spare_part: "spare_part";
    }>>>;
    attributes: z.ZodOptional<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
    title: z.ZodOptional<z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>>;
    description: z.ZodOptional<z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>>;
    price: z.ZodOptional<z.ZodNumber>;
    images: z.ZodOptional<z.ZodArray<z.ZodString>>;
    locationId: z.ZodOptional<z.ZodOptional<z.ZodNever>>;
    location: z.ZodOptional<z.ZodObject<{
        locationId: z.ZodOptional<z.ZodString>;
        parentId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        path: z.ZodOptional<z.ZodArray<z.ZodString>>;
        name: z.ZodOptional<z.ZodString>;
        display: z.ZodOptional<z.ZodString>;
        city: z.ZodOptional<z.ZodString>;
        state: z.ZodOptional<z.ZodString>;
        country: z.ZodOptional<z.ZodString>;
        pincode: z.ZodOptional<z.ZodString>;
        level: z.ZodOptional<z.ZodEnum<{
            country: "country";
            state: "state";
            district: "district";
            city: "city";
            area: "area";
            village: "village";
        }>>;
        isActive: z.ZodOptional<z.ZodBoolean>;
        verificationStatus: z.ZodOptional<z.ZodEnum<{
            pending: "pending";
            rejected: "rejected";
            verified: "verified";
        }>>;
        coordinates: z.ZodOptional<z.ZodObject<{
            type: z.ZodLiteral<"Point">;
            coordinates: z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
    spareParts: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString>>>;
    deviceCondition: z.ZodOptional<z.ZodOptional<z.ZodEnum<{
        power_on: "power_on";
        power_off: "power_off";
    }>>>;
    isFree: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
}, z.core.$strip>;
export type BaseAdPayload = z.infer<typeof BaseAdPayloadSchema>;
export type AdPayload = z.infer<typeof AdPayloadSchema>;
export type PartialAdPayload = z.infer<typeof PartialAdPayloadSchema>;
