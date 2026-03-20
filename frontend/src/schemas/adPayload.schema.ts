import { z } from "zod";
import {
    AdPayloadSchema as SharedAdPayloadSchema,
    BaseAdPayloadSchema as SharedBaseAdPayloadSchema,
    PartialAdPayloadSchema as SharedPartialAdPayloadSchema,
} from "@shared/schemas/adPayload.schema";

// Re-export shared schemas directly as v4 standalone schemas.
// DO NOT extend/intersect these with v3 z.object() — that mixes Zod v3 and v4
// schema objects and causes runtime _parse/_run TypeError failures.
export const BaseAdPayloadSchema = SharedBaseAdPayloadSchema;
export const AdPayloadSchema = SharedAdPayloadSchema;
export const PartialAdPayloadSchema = SharedPartialAdPayloadSchema;

// Frontend-specific UI display fields (category/brand/model names, not IDs).
// These are tracked in component state and not included in the Zod schema
// to avoid v3+v4 mixing. Add them to local form state as needed.
export type AdFormExtras = {
    category?: string;
    brand?: string;
    model?: string;
};

// Frontend forms work with schema input types (pre-transform/preprocess values).
export type AdPayload = z.input<typeof AdPayloadSchema> & AdFormExtras;
export type BaseAdPayload = z.input<typeof BaseAdPayloadSchema> & AdFormExtras;
export type PartialAdPayload = z.input<typeof PartialAdPayloadSchema> & AdFormExtras;
