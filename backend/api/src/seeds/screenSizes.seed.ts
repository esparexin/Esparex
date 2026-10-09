/**
 * Screen Sizes Seed — thin caller (P1-8, DECISION-GATE §2/§5).
 * Seed write logic lives in the catalog domain (`CatalogSeedService.seedScreenSizes`);
 * this module delegates. No direct model imports.
 */
import { CatalogSeedService } from "@esparex/core";

export async function seedScreenSizes() {
    return CatalogSeedService.seedScreenSizes();
}
