import { describe, expect, it } from "vitest";

import { getMobileChromePolicy } from "@/lib/mobile/chromePolicy";

describe("mobile chrome policy", () => {
    it("enables the listing action bar across all listing detail route families", () => {
        expect(getMobileChromePolicy("/ads/iphone-15-123").showContextActionBar).toBe(true);
        expect(getMobileChromePolicy("/services/board-repair-123").showContextActionBar).toBe(true);
        expect(getMobileChromePolicy("/spare-part-listings/display-123").showContextActionBar).toBe(true);
    });
});
