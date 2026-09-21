import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { SmartAlertsTab } from "@/components/user/profile/tabs/SmartAlertsTab";
import type { SmartAlertListItem, SmartAlertFormData } from "@/components/user/profile/types";

// Mock next/navigation
vi.mock("next/navigation", () => ({
    useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
    useSearchParams: () => new URLSearchParams(),
}));

// Mock SmartAlertModalContext
vi.mock("@/context/SmartAlertModalContext", () => ({
    useSmartAlertModal: () => ({
        registerTabHandler: vi.fn(),
        isSmartAlertOpen: false,
        closeSmartAlertModal: vi.fn(),
    }),
}));

// Mock useSmartAlertMatches
const mockMatchesHook = vi.fn();
vi.mock("@/hooks/useSmartAlertMatches", () => ({
    useSmartAlertMatches: (options: unknown) => mockMatchesHook(options),
}));

describe("SmartAlertsTab - Sub-Tabs & Dedicated Matched Listings UX", () => {
    const defaultForm: SmartAlertFormData = {
        name: "",
        category: "All",
        keywords: "",
        location: "",
        radiusKm: 25,
        notificationChannels: ["in-app"],
    };

    const mockAlerts: SmartAlertListItem[] = [
        {
            id: "alert-001",
            name: "iPhone Deals",
            active: true,
            category: "Smartphones",
            location: "San Jose, CA",
            radiusKm: 25,
            keywords: "iPhone",
            createdAt: "2026-09-18T10:00:00Z",
            notificationChannels: ["in-app", "push"],
        },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        mockMatchesHook.mockReturnValue({
            data: {
                matches: [
                    {
                        id: "notif-001",
                        alertId: "alert-001",
                        alertName: "iPhone Deals",
                        deliveredAt: new Date("2026-09-20T10:00:00Z"),
                        isRead: false,
                        adId: "ad-101",
                        actionUrl: "/ads/ad-101",
                        ad: {
                            id: "ad-101",
                            title: "iPhone 13 Pro 128GB",
                            price: 650,
                            currency: "USD",
                            images: ["https://example.com/ad.jpg"],
                            status: "active",
                            location: { city: "San Jose", state: "CA", display: "San Jose, CA" },
                        },
                    },
                ],
                total: 1,
                page: 1,
                limit: 4,
                totalPages: 1,
            },
            isLoading: false,
        });
    });

    it("renders both sub-tab toggles: Alert Rules and Matched Listings with counts", () => {
        const html = renderToStaticMarkup(
            <SmartAlertsTab
                smartAlerts={mockAlerts}
                savedSearches={[]}
                smartAlertForm={defaultForm}
                updateSmartAlertForm={vi.fn()}
                handleCreateAlert={vi.fn()}
                handleToggleAlertStatus={vi.fn()}
                handleDeleteAlert={vi.fn()}
                handleDeleteSavedSearch={vi.fn()}
                handleEditAlert={vi.fn()}
                editingAlertId={null}
                resetAlertForm={vi.fn()}
                setActiveTab={vi.fn()}
            />
        );

        // Sub-tabs must be present with accessible tab semantics
        expect(html).toContain('role="tablist"');
        expect(html).toContain("Alert Rules (1)");
        expect(html).toContain("Matched Listings (1)");
    });

    it("renders active alert cards inside the Alert Rules sub-tab with View Matches button", () => {
        const html = renderToStaticMarkup(
            <SmartAlertsTab
                smartAlerts={mockAlerts}
                savedSearches={[]}
                smartAlertForm={defaultForm}
                updateSmartAlertForm={vi.fn()}
                handleCreateAlert={vi.fn()}
                handleToggleAlertStatus={vi.fn()}
                handleDeleteAlert={vi.fn()}
                handleDeleteSavedSearch={vi.fn()}
                handleEditAlert={vi.fn()}
                editingAlertId={null}
                resetAlertForm={vi.fn()}
                setActiveTab={vi.fn()}
            />
        );

        // Alert Rule card content
        expect(html).toContain("iPhone Deals");
        expect(html).toContain("Active");
        expect(html).toContain("View Matches");
        expect(html).toContain("Smartphones");
    });

    it("renders server-driven quota and renewal date even when alerts list length differs", () => {
        const html = renderToStaticMarkup(
            <SmartAlertsTab
                smartAlerts={mockAlerts} // 1 alert currently
                savedSearches={[]}
                smartAlertForm={defaultForm}
                updateSmartAlertForm={vi.fn()}
                handleCreateAlert={vi.fn()}
                handleToggleAlertStatus={vi.fn()}
                handleDeleteAlert={vi.fn()}
                handleDeleteSavedSearch={vi.fn()}
                handleEditAlert={vi.fn()}
                editingAlertId={null}
                resetAlertForm={vi.fn()}
                setActiveTab={vi.fn()}
                quota={{
                    limit: 5,
                    used: 4,
                    remaining: 1, // 4 consumed in month, 1 remains (even if only 1 alert document exists)
                    resetsAt: "2026-10-01T00:00:00.000Z",
                }}
            />
        );

        // Expect server-driven 1 of 5 remaining with renewal text, not 4 of 5 (5 - 1)
        expect(html).toContain("1 of 5 free alert slots remaining");
        expect(html).toContain("Renews");
        expect(html).toContain("max-w-3xl");
    });
});
