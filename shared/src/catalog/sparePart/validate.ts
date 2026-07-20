import { validateCatalogName } from '../common/validation';

export function validateSparePartName(name: string): { ok: boolean; reason?: string } {
    return validateCatalogName(name);
}
