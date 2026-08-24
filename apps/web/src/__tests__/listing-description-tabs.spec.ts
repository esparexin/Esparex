import { describe, expect, it } from "vitest";
import { ListingDescriptionCard } from "@/components/user/listing-detail/ListingDescriptionCard";
import { extractSparePartItems } from "@/components/user/listing-detail/ListingWorkingSparePartsTab";
import { ListingDescriptionTab } from "@/components/user/listing-detail/ListingDescriptionTab";
import { ListingWorkingSparePartsTab } from "@/components/user/listing-detail/ListingWorkingSparePartsTab";
import { AdSchema } from "@esparex/contracts";

describe("ListingDescriptionCard 3-Tab Architecture & Structure", () => {
  it("exports ListingDescriptionCard and modular tab components", () => {
    expect(typeof ListingDescriptionCard).toBe("function");
    expect(typeof ListingDescriptionTab).toBe("function");
    expect(typeof ListingWorkingSparePartsTab).toBe("function");
  });

  it("extracts spare parts from snapshot and array correctly", () => {
    const mockAd = AdSchema.parse({
      id: "test-ad-1",
      title: "MacBook for parts",
      price: 1000,
      description: "Working SSD and motherboard",
      images: [],
      sellerId: "user-1",
      status: "live",
      createdAt: new Date().toISOString(),
      location: { city: "Guntur" },
      sparePartsSnapshot: [
        { _id: "sp-1", id: "sp-1", name: "SSD", brand: "Apple" },
      ],
      spareParts: [
        "Motherboard",
      ],
    });

    const items = extractSparePartItems(mockAd);
    expect(items.length).toBe(2);
    expect(items[0]?.name).toBe("SSD");
    expect(items[0]?.brand).toBe("Apple");
    expect(items[1]?.name).toBe("Motherboard");
  });
});
