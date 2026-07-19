import { validateCatalogName } from '../common/validation';

export function validateServiceTypeName(name: string): { ok: boolean; reason?: string } {
    return validateCatalogName(name);
}
