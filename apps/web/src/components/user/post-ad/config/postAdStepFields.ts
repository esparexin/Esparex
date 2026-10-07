/**
 * SSOT: Post Ad Wizard — Step-to-Field Mapping
 *
 * Single source of truth for which form fields belong to which wizard step.
 * Consumed by:
 *   - usePostAdStepNavigation (targeted trigger() on Continue)
 *
 * When adding a new step or field, update this file only.
 */

import type { AdPayload as PostAdFormData } from "@/schemas/adPayload.schema";
import type { Path } from "react-hook-form";

/** Canonical step-to-field ownership. Step numbers are 1-indexed. */
const POST_AD_STEP_FIELDS: Record<number, ReadonlyArray<Path<PostAdFormData>>> = {
    1: [
        "categoryId",
        "category",
        "brandId",
        "brand",
        "modelId",
        "model",
        "deviceCondition",
        "screenSize",
        "spareParts",
        "attributes",
    ],
    2: [
        "title",
        "description",
        "images",
        "location",
        "price",
        "isFree",
    ],
} as const;

/** Returns all field paths owned by a given step. */
export function getStepFields(step: number): ReadonlyArray<Path<PostAdFormData>> {
    return POST_AD_STEP_FIELDS[step] ?? [];
}

