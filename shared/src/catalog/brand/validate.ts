import { validateCatalogName } from '../common/validation';

export function validateBrandName(name: string): { ok: boolean; reason?: string } {
    return validateCatalogName(name);
}
