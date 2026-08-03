/**
 * SSOT: Post Ad Wizard — Step-to-Field Mapping
 *
 * Single source of truth for which form fields belong to which wizard step.
 * Consumed by:
 *   - ValidationSummary       (filters error banner to current-step fields only)
 *   - usePostAdStepNavigation (targeted trigger() on Continue)
 *
 * When adding a new step or field, update this file only.
 */

import type { AdPayload as PostAdFormData } from "@/schemas/adPayload.schema";
import type { Path } from "react-hook-form";

/** Canonical step-to-field ownership. Step numbers are 1-indexed. */
export const POST_AD_STEP_FIELDS: Record<number, ReadonlyArray<Path<PostAdFormData>>> = {
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

/**
 * Returns true if a given field path belongs to a given step.
 * Handles nested paths: "attributes.someFilterId" → matches step 1 via "attributes".
 */
export function isFieldInStep(fieldPath: string, step: number): boolean {
    const fields = POST_AD_STEP_FIELDS[step];
    if (!fields) return false;
    return (fields as ReadonlyArray<string>).some(
        (f) => fieldPath === f || fieldPath.startsWith(`${f}.`)
    );
}
