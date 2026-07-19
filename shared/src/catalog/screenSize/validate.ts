import { validateCatalogName } from '../common/validation';

export function validateScreenSizeName(name: string): { ok: boolean; reason?: string } {
    return validateCatalogName(name);
}
