import { z } from "zod";
import {
    AdPayloadSchema as SharedAdPayloadSchema,
    BaseAdPayloadSchema as SharedBaseAdPayloadSchema,
    PartialAdPayloadSchema as SharedPartialAdPayloadSchema,
} from "@esparex/shared/schemas/adPayload.schema";

// Re-export shared schemas directly so frontend form code consumes the same
// contract objects without rebuilding them locally.
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

type RemovedPostAdFields = "sparePartId";

// Frontend forms work with schema input types (pre-transform/preprocess values),
// but the current Post Ad UI no longer collects single spare-part IDs.
export type AdPayload = Omit<z.input<typeof AdPayloadSchema>, RemovedPostAdFields> & AdFormExtras;
export type BaseAdPayload = Omit<z.input<typeof BaseAdPayloadSchema>, RemovedPostAdFields> & AdFormExtras;
export type PartialAdPayload = Omit<z.input<typeof PartialAdPayloadSchema>, RemovedPostAdFields> & AdFormExtras;
