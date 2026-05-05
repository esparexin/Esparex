import { z } from 'zod';
import { ObjectIdSchema } from '../schemas/catalog.schema';

/**
 * Shared validator for service types to ensure consistency between
 * frontend selection and backend processing.
 */
export const ServiceTypeSelectionSchema = z.array(z.string().min(1).max(120))
    .min(1, 'At least one service type is required')
    .max(20, 'Maximum 20 service types allowed');

export const ServiceTypeIdSelectionSchema = z.array(ObjectIdSchema)
    .min(1, 'At least one service type is required')
    .max(20, 'Maximum 20 service types allowed');

/**
 * Validation logic to check if the selection matches the category's mode.
 */
export function validateServiceSelectionMode(
    count: number,
    mode: 'single' | 'multi' = 'multi'
): { valid: boolean; message?: string } {
    if (mode === 'single' && count > 1) {
        return { valid: false, message: 'This category only allows selecting a single service type' };
    }
    if (count === 0) {
        return { valid: false, message: 'At least one service type is required' };
    }
    return { valid: true };
}
