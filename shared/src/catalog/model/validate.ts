import { validateCatalogName } from '../common/validation';

export function validateModelName(name: string): { ok: boolean; reason?: string } {
    return validateCatalogName(name);
}
