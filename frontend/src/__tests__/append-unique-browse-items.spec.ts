import { describe, expect, it } from "vitest";

import { appendUniqueBrowseItems } from "@/lib/browse/appendUniqueBrowseItems";

describe("appendUniqueBrowseItems", () => {
  it("keeps new unique items while skipping duplicate ids", () => {
    expect(
      appendUniqueBrowseItems(
        [{ id: "one" }, { id: "two" }],
        [{ id: "two" }, { id: "three" }]
      )
    ).toEqual([{ id: "one" }, { id: "two" }, { id: "three" }]);
  });

  it("falls back to _id when id is absent", () => {
    expect(
      appendUniqueBrowseItems(
        [{ _id: "one" }],
        [{ _id: "one" }, { _id: "two" }]
      )
    ).toEqual([{ _id: "one" }, { _id: "two" }]);
  });
});
