import { describe, expect, it } from "vitest";
import { ListingDescriptionCard, TAB_KEYS, SERVICE_TAB_KEYS, SPARE_PART_TAB_KEYS } from "@/components/user/listing-detail/ListingDescriptionCard";
import { extractSparePartItems } from "@/components/user/listing-detail/ListingWorkingSparePartsTab";
import { ListingDescriptionTab } from "@/components/user/listing-detail/ListingDescriptionTab";
import { ListingWorkingSparePartsTab } from "@/components/user/listing-detail/ListingWorkingSparePartsTab";
import { AdSchema } from "@esparex/contracts";

describe("ListingDescriptionCard Tab Architecture & Structure", () => {
  it("exports ListingDescriptionCard and modular tab components", () => {
    expect(typeof ListingDescriptionCard).toBe("function");
    expect(typeof ListingDescriptionTab).toBe("function");
    expect(typeof ListingWorkingSparePartsTab).toBe("function");
  });

  it("enforces canonical tab sequence for general ads: Repair Shops -> Description -> Working Spare Parts", () => {
    expect(TAB_KEYS).toEqual(["repair-shops", "description", "spare-parts"]);
    expect(TAB_KEYS[0]).toBe("repair-shops");
    expect(TAB_KEYS[1]).toBe("description");
    expect(TAB_KEYS[2]).toBe("spare-parts");
  });

  it("enforces canonical tab sequence for services: About This Service -> Other Service Centers", () => {
    expect(SERVICE_TAB_KEYS).toEqual(["about-service", "service-centers"]);
    expect(SERVICE_TAB_KEYS[0]).toBe("about-service");
    expect(SERVICE_TAB_KEYS[1]).toBe("service-centers");
  });

  it("enforces canonical tab sequence for spare parts: Part Details -> Description", () => {
    expect(SPARE_PART_TAB_KEYS).toEqual(["part-details", "description"]);
    expect(SPARE_PART_TAB_KEYS[0]).toBe("part-details");
    expect(SPARE_PART_TAB_KEYS[1]).toBe("description");
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
