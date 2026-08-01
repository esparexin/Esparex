import { normalizeMobileVisibility } from '@esparex/shared';
// We will just try importing the package as a whole to see if typescript resolves it.
import * as Contracts from '@esparex/contracts';

export function testSharedImports() {
  console.log('Testing shared imports');
  const visibility = normalizeMobileVisibility('visible');
  console.log('Visibility:', visibility);
  console.log('Contracts loaded:', !!Contracts);
}
testSharedImports();
