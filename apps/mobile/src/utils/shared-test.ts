import { normalizeMobileVisibility } from '@esparex/shared';
import * as Contracts from '@esparex/contracts';

/**
 * Utility function to verify shared workspace package resolution.
 */
export function testSharedImports(): boolean {
  const visibility = normalizeMobileVisibility('show');
  const contractsLoaded = !!Contracts;
  return visibility === 'show' && contractsLoaded;
}
