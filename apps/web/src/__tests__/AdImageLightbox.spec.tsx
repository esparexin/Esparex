import { describe, expect, it } from "vitest";
import { AdImageLightbox } from "@/components/user/listing-detail/AdImageLightbox";
import { Z_INDEX } from "@esparex/ui";

describe("AdImageLightbox Dialog SSOT & Architecture Audit", () => {
  it("exports AdImageLightbox component as a canonical functional component", () => {
    expect(typeof AdImageLightbox).toBe("function");
  });

  it("verifies sheet/dialog overlay z-index token invariant covers userHeader", () => {
    // Lightbox uses sheetOverlay (1050) and sheetContent (1051), strictly above userHeader (999)
    expect(Z_INDEX.sheetOverlay).toBe(1050);
    expect(Z_INDEX.sheetContent).toBe(1051);
    expect(Z_INDEX.userHeader).toBe(999);

    expect(Z_INDEX.sheetOverlay).toBeGreaterThan(Z_INDEX.userHeader);
    expect(Z_INDEX.sheetContent).toBeGreaterThan(Z_INDEX.sheetOverlay);
  });
});
