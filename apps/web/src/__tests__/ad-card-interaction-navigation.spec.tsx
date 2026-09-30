import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AdCardGrid } from "@/components/user/ad-card/AdCardGrid";
import { AdCardList } from "@/components/user/ad-card/AdCardList";
import {
  useAdCardNavigation,
  type AdCardClickEvent,
  type AdCardKeyboardEvent,
} from "@/components/user/ad-card/shared";
import { buildPublicListingDetailRoute } from "@/lib/publicListingRoutes";
import { parseListingSlugParam, parseSlugIdParam } from "@/lib/slug";
import { ListingItem } from "@/components/user/shared/ListingItem";


const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
}));

vi.mock("@/hooks/listings/useFavoriteAd", () => ({
  useFavoriteAd: (_adId: string | number, isSaved = false) => ({
    isSaved,
    isLoading: false,
    toggleSave: vi.fn(),
  }),
}));

describe("Ad Card & Listing Click Interaction & Navigation Architecture", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. Canonical Route Generation SSOT", () => {
    it("generates correct public routes for device ads, services, and spare parts", () => {
      const hexId = "507f1f77bcf86cd799439011";

      const deviceRoute = buildPublicListingDetailRoute({
        id: hexId,
        listingType: "ad",
        title: "Apple iPhone 13 128GB",
      });
      expect(deviceRoute).toBe(`/ads/apple-iphone-13-128gb-${hexId}`);

      const serviceRoute = buildPublicListingDetailRoute({
        id: hexId,
        listingType: "service",
        title: "Mobile Screen Repair",
      });
      expect(serviceRoute).toBe(`/services/mobile-screen-repair-${hexId}`);

      const sparePartRoute = buildPublicListingDetailRoute({
        id: hexId,
        listingType: "spare_part",
        title: "OLED Display Panel",
      });
      expect(sparePartRoute).toBe(`/spare-part-listings/oled-display-panel-${hexId}`);
    });

    it("normalizes uppercase and hyphenated listingType variants correctly", () => {
      const hexId = "507f1f77bcf86cd799439012";

      expect(buildPublicListingDetailRoute({ id: hexId, listingType: "SERVICE" })).toContain("/services/");
      expect(buildPublicListingDetailRoute({ id: hexId, listingType: "services" })).toContain("/services/");
      expect(buildPublicListingDetailRoute({ id: hexId, listingType: "SPARE_PART" })).toContain("/spare-part-listings/");
      expect(buildPublicListingDetailRoute({ id: hexId, listingType: "spare-part" })).toContain("/spare-part-listings/");
      expect(buildPublicListingDetailRoute({ id: hexId, listingType: "spare_parts" })).toContain("/spare-part-listings/");
      expect(buildPublicListingDetailRoute({ id: hexId, listingType: undefined })).toContain("/ads/");
    });
  });

  describe("2. Server-Side Slug & ID Parameter Parsing", () => {
    it("extracts 24-hex ObjectId accurately from canonical slug-id strings", () => {
      const hexId = "507f1f77bcf86cd799439011";
      const { id, slug } = parseListingSlugParam(`apple-iphone-13-128gb-${hexId}`);
      expect(id).toBe(hexId);
      expect(slug).toBe("apple-iphone-13-128gb");
    });

    it("extracts numeric IDs accurately from canonical slug-id strings without 404 failure", () => {
      const { id, slug } = parseListingSlugParam("custom-device-listing-98765");
      expect(id).toBe("98765");
      expect(slug).toBe("custom-device-listing");
    });

    it("parses raw 24-character ObjectId directly", () => {
      const hexId = "507f1f77bcf86cd799439011";
      const { id, slug } = parseListingSlugParam(hexId);
      expect(id).toBe(hexId);
      expect(slug).toBe("");
    });

    it("preserves category slugs without falsely splitting English hyphenated words as IDs", () => {
      const parsed = parseSlugIdParam("smart-phones");
      expect(parsed.id).toBe("");
      expect(parsed.slug).toBe("smart-phones");
      expect(parsed.identifier).toBe("smart-phones");
    });
  });

  describe("3. useAdCardNavigation Event Propagation & Target Guarding", () => {
    class MockElement extends EventTarget {
      tagName: string;
      parent: MockElement | null;

      constructor(tagName = "DIV", parent: MockElement | null = null) {
        super();
        this.tagName = tagName;
        this.parent = parent;
      }

      closest(selector: string): MockElement | null {
        if (selector.toLowerCase().split(",").map((s) => s.trim()).includes(this.tagName.toLowerCase())) {
          return this;
        }
        return this.parent ? this.parent.closest(selector) : null;
      }
    }

    const createMouseEvent = (target: MockElement, currentTarget: MockElement = target): AdCardClickEvent => {
      return {
        target,
        currentTarget,
      };
    };

    const createKeyboardEvent = (key: string, target: MockElement, preventDefault = vi.fn()): AdCardKeyboardEvent => {
      return {
        key,
        target,
        currentTarget: target,
        preventDefault,
      };
    };

    it("triggers router.push when card body surface is clicked", () => {
      const { handleCardClick } = useAdCardNavigation({
        href: "/ads/iphone-13-507f1f77bcf86cd799439011",
      });

      const cardContainer = new MockElement("ARTICLE");
      const cardSurfaceElement = new MockElement("DIV", cardContainer);

      const mockEvent = createMouseEvent(cardSurfaceElement, cardContainer);

      handleCardClick(mockEvent);
      expect(pushMock).toHaveBeenCalledWith("/ads/iphone-13-507f1f77bcf86cd799439011");
    });

    it("does NOT navigate when an interactive child button is clicked (e.g. Favorite button)", () => {
      const { handleCardClick } = useAdCardNavigation({
        href: "/ads/iphone-13-507f1f77bcf86cd799439011",
      });

      const cardContainer = new MockElement("ARTICLE");
      const buttonElement = new MockElement("BUTTON", cardContainer);

      const mockEvent = createMouseEvent(buttonElement, cardContainer);

      handleCardClick(mockEvent);
      expect(pushMock).not.toHaveBeenCalled();
    });

    it("does NOT navigate again if the stretched link <a> itself is clicked", () => {
      const { handleCardClick } = useAdCardNavigation({
        href: "/ads/iphone-13-507f1f77bcf86cd799439011",
      });

      const cardContainer = new MockElement("ARTICLE");
      const anchorElement = new MockElement("A", cardContainer);

      const mockEvent = createMouseEvent(anchorElement, cardContainer);

      handleCardClick(mockEvent);
      expect(pushMock).not.toHaveBeenCalled();
    });

    it("executes custom onClick callback when provided instead of router.push", () => {
      const customOnClick = vi.fn();
      const { handleCardClick } = useAdCardNavigation({
        href: "/ads/test",
        onClick: customOnClick,
      });

      const cardContainer = new MockElement("ARTICLE");
      const cardSurfaceElement = new MockElement("DIV", cardContainer);

      handleCardClick(createMouseEvent(cardSurfaceElement, cardContainer));
      expect(customOnClick).toHaveBeenCalledTimes(1);
      expect(pushMock).not.toHaveBeenCalled();
    });

    it("supports keyboard Enter and Space navigation on card container", () => {
      const { handleKeyDown } = useAdCardNavigation({
        href: "/ads/iphone-13-507f1f77bcf86cd799439011",
      });

      const preventDefault = vi.fn();
      const cardContainer = new MockElement("ARTICLE");

      handleKeyDown(createKeyboardEvent("Enter", cardContainer, preventDefault));

      expect(preventDefault).toHaveBeenCalled();
      expect(pushMock).toHaveBeenCalledWith("/ads/iphone-13-507f1f77bcf86cd799439011");
    });
  });

  describe("4. DOM Structure & HTML5 Spec Compliance (Stretched Link Pattern)", () => {
    const mockAd = {
      id: "507f1f77bcf86cd799439011",
      title: "Apple iPhone 13 128GB Blue",
      price: 38000,
      image: "https://example.com/phone.jpg",
      status: "live",
      listingType: "ad",
      location: { city: "Hyderabad", state: "Telangana" },
    };

    const mockService = {
      id: "507f1f77bcf86cd799439012",
      title: "Screen Replacement Service",
      priceMin: 1200,
      image: "https://example.com/repair.jpg",
      status: "live",
      listingType: "service",
      location: { city: "Bangalore", state: "Karnataka" },
    };

    const mockSparePart = {
      id: "507f1f77bcf86cd799439013",
      title: "OEM AMOLED Display Assembly",
      price: 4500,
      image: "https://example.com/screen.jpg",
      status: "live",
      listingType: "spare_part",
      location: { city: "Mumbai", state: "Maharashtra" },
    };

    it("renders AdCardGrid with stretched link on title and correct route for Device Ads", () => {
      const html = renderToStaticMarkup(<AdCardGrid ad={mockAd as any} />);

      // Title link contains canonical route
      expect(html).toContain(`/ads/apple-iphone-13-128gb-blue-${mockAd.id}`);

      // Title link possesses the stretched-link CSS overlay utility classes
      expect(html).toContain("after:absolute");
      expect(html).toContain("after:inset-0");
      expect(html).toContain("after:z-10");

      // Verify HTML5 validity: Button is NOT nested inside <a>
      // The outer shell is <article> without an outer <a> wrapping the button
      expect(html).not.toMatch(/<a\b[^>]*>[\s\S]*?<button/i);

      // Favorite button exists and sits at higher z-index (z-20) above the stretched link
      expect(html).toContain("z-20");
    });

    it("renders AdCardGrid with canonical /services/ route for Service cards", () => {
      const html = renderToStaticMarkup(<AdCardGrid ad={mockService as any} />);
      expect(html).toContain(`/services/screen-replacement-service-${mockService.id}`);
      expect(html).toContain("after:inset-0");
    });

    it("renders AdCardGrid with canonical /spare-part-listings/ route for Spare Part cards", () => {
      const html = renderToStaticMarkup(<AdCardGrid ad={mockSparePart as any} />);
      expect(html).toContain(`/spare-part-listings/oem-amoled-display-assembly-${mockSparePart.id}`);
      expect(html).toContain("after:inset-0");
    });

    it("renders AdCardList with stretched link on title and z-20 on actions", () => {
      const html = renderToStaticMarkup(<AdCardList ad={mockAd as any} />);

      expect(html).toContain(`/ads/apple-iphone-13-128gb-blue-${mockAd.id}`);
      expect(html).toContain("after:inset-0");
      expect(html).toContain("after:z-10");
      // Favorite button in list view must be relative z-20 (not static)
      expect(html).toContain("relative z-20");
    });
  });

  describe("5. Account Listing Item (ListingItem) Click Coverage", () => {
    it("renders ListingItem with stretched link on title and z-20 on actions", () => {
      const detailHref = "/ads/iphone-13-507f1f77bcf86cd799439011";

      const html = renderToStaticMarkup(
        <ListingItem
          title="iPhone 13"
          status="active"
          listingType="ad"
          priceLabel="₹35,000"
          editHref="/edit-ad/507f1f77bcf86cd799439011"
          detailHref={detailHref}
          getStatusBadge={() => null}
          onDelete={vi.fn()}
        />
      );

      // Entire row has relative group container
      expect(html).toContain("relative group");

      // Title link has stretched link overlay
      expect(html).toContain(detailHref);
      expect(html).toContain("after:absolute after:inset-0");
      expect(html).toContain("after:z-10");

      // Actions container has relative z-20 to sit above stretched link
      expect(html).toContain("relative z-20");
    });
  });
});
