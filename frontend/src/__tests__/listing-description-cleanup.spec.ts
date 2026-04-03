import { describe, expect, it } from "vitest";

import { cleanupListingDescription } from "@/lib/listings/descriptionCleanup";

describe("cleanupListingDescription", () => {
  it("removes consecutive duplicate paragraphs", () => {
    const description = [
      "You are working inside the Esparex marketplace codebase.",
      "You are working inside the Esparex marketplace codebase.",
      "Bring your own seller details.",
    ].join("\n\n");

    expect(cleanupListingDescription(description)).toBe([
      "You are working inside the Esparex marketplace codebase.",
      "Bring your own seller details.",
    ].join("\n\n"));
  });

  it("collapses a paragraph composed of the same sentence repeated verbatim", () => {
    const repeated = "You are working inside the Esparex marketplace codebase.";
    expect(cleanupListingDescription(repeated.repeat(2))).toBe(repeated);
  });

  it("keeps unique paragraphs unchanged", () => {
    const description = [
      "Original device box included.",
      "Battery health is 89 percent.",
    ].join("\n\n");

    expect(cleanupListingDescription(description)).toBe(description);
  });
});
