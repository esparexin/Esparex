import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("Dropdown Navigation & Viewport Constraint Regression Suite", () => {
    it("ensures DropdownMenu uses valid Tailwind v3 arbitrary value syntax for viewport height and origin", () => {
        const dropdownFilePath = path.resolve(
            __dirname,
            "../../../../packages/ui/src/navigation/DropdownMenu.tsx"
        );
        const fileContent = fs.readFileSync(dropdownFilePath, "utf-8");

        // Tailwind v4 syntax does not compile in Tailwind v3
        expect(fileContent).not.toContain("max-h-(--radix-dropdown-menu-content-available-height)");
        expect(fileContent).not.toContain("origin-(--radix-dropdown-menu-content-transform-origin)");

        // Tailwind v3 requires square brackets for arbitrary variables
        expect(fileContent).toContain("max-h-[var(--radix-dropdown-menu-content-available-height)]");
        expect(fileContent).toContain("origin-[var(--radix-dropdown-menu-content-transform-origin)]");
    });

    it("ensures HeaderSearchDropdown is constrained with max-height and overflow scroll", () => {
        const headerDropdownPath = path.resolve(
            __dirname,
            "../components/user/header/HeaderSearchDropdown.tsx"
        );
        const fileContent = fs.readFileSync(headerDropdownPath, "utf-8");

        expect(fileContent).toContain("max-h-[min(320px,60vh)]");
        expect(fileContent).toContain("overflow-y-auto");
        expect(fileContent).toContain("overscroll-contain");
    });

    it("ensures EntitySearchCombobox scrolls active option into view on keyboard navigation", () => {
        const comboboxPath = path.resolve(
            __dirname,
            "../components/user/EntitySearchCombobox.tsx"
        );
        const fileContent = fs.readFileSync(comboboxPath, "utf-8");

        expect(fileContent).toContain("scrollIntoView({ block: \"nearest\", behavior: \"smooth\" })");
        expect(fileContent).toContain("select-option-");
    });

    it("ensures BusinessPostFAB triggers in-app Smart Alert modal without navigating away and auto-closes on click", () => {
        const fabPath = path.resolve(
            __dirname,
            "../components/layout/BusinessPostFAB.tsx"
        );
        const fileContent = fs.readFileSync(fabPath, "utf-8");

        expect(fileContent).toContain("openSmartAlertModal({ autoFocusCategory: true })");
        expect(fileContent).toContain("setIsOpen(false)");
    });

    it("ensures SmartAlertsTab observes action=create to auto-open dialog and cleans up URL on close", () => {
        const tabPath = path.resolve(
            __dirname,
            "../components/user/profile/tabs/SmartAlertsTab.tsx"
        );
        const fileContent = fs.readFileSync(tabPath, "utf-8");

        expect(fileContent).toContain('searchParams?.get("action") === "create"');
        expect(fileContent).toContain("resetAlertForm()");
        expect(fileContent).toContain("isInternalOpen || isCreateAction");
        expect(fileContent).toContain('router.replace("/account/alerts", { scroll: false })');
    });

    it("ensures NotificationBellDropdown configures non-modal dropdown and guards against trigger loop", () => {
        const notificationPath = path.resolve(
            __dirname,
            "../components/user/NotificationBellDropdown.tsx"
        );
        const fileContent = fs.readFileSync(notificationPath, "utf-8");

        expect(fileContent).toContain("modal={false}");
        expect(fileContent).toContain("onPointerDownOutside");
        expect(fileContent).toContain('closest(\'[data-slot="dropdown-menu-trigger"]\')');
        expect(fileContent).toContain("onInteractOutside");
    });

    it("ensures EntitySearchCombobox pre-focuses and scrolls to pre-selected value on open", () => {
        const comboboxPath = path.resolve(
            __dirname,
            "../components/user/EntitySearchCombobox.tsx"
        );
        const fileContent = fs.readFileSync(comboboxPath, "utf-8");

        expect(fileContent).toContain("if (!isListOpen || !value) return;");
        expect(fileContent).toContain("setActiveIndex(idx)");
    });

    it("ensures HeaderAccountMenu configures non-modal dropdown with trigger protection", () => {
        const accountMenuPath = path.resolve(
            __dirname,
            "../components/user/header/HeaderAccountMenu.tsx"
        );
        const fileContent = fs.readFileSync(accountMenuPath, "utf-8");

        expect(fileContent).toContain("<DropdownMenu modal={false}>");
        expect(fileContent).toContain("onPointerDownOutside");
        expect(fileContent).toContain('closest(\'[data-slot="dropdown-menu-trigger"]\')');
    });

    it("ensures LocationSelector protects input text from colliding with action buttons via right padding and truncation", () => {
        const locationPath = path.resolve(
            __dirname,
            "../components/location/LocationSelector.tsx"
        );
        const fileContent = fs.readFileSync(locationPath, "utf-8");

        expect(fileContent).toContain("pr-28 sm:pr-32");
        expect(fileContent).toContain("truncate");
    });

    it("ensures EntitySearchCombobox generates instance-unique listbox IDs and reserves indicator padding", () => {
        const comboboxPath = path.resolve(
            __dirname,
            "../components/user/EntitySearchCombobox.tsx"
        );
        const fileContent = fs.readFileSync(comboboxPath, "utf-8");

        expect(fileContent).toContain("select-options-list-${sanitizedTitle}");
        expect(fileContent).toContain("pr-14");
    });

    it("ensures SmartAlertCategoryBrandModelFields isolates category and pairs brand/model in responsive grid", () => {
        const fieldsPath = path.resolve(
            __dirname,
            "../components/user/profile/dialogs/SmartAlertCategoryBrandModelFields.tsx"
        );
        const fileContent = fs.readFileSync(fieldsPath, "utf-8");

        expect(fileContent).toContain("grid grid-cols-1 sm:grid-cols-2 gap-3.5 relative z-10");
        expect(fileContent).toContain("relative z-20");
    });

    it("ensures CreateSmartAlertDialog constrains dialog width and reserves content scroll padding", () => {
        const dialogPath = path.resolve(
            __dirname,
            "../components/user/profile/dialogs/CreateSmartAlertDialog.tsx"
        );
        const fileContent = fs.readFileSync(dialogPath, "utf-8");

        expect(fileContent).toContain("max-w-[500px]");
        expect(fileContent).toContain("pr-2 sm:pr-2.5");
    });

    it("ensures BusinessListingGatePage renders BusinessListingPageBackdrop behind dialogs", () => {
        const gatePath = path.resolve(
            __dirname,
            "../components/user/BusinessListingGatePage.tsx"
        );
        const fileContent = fs.readFileSync(gatePath, "utf-8");

        expect(fileContent).toContain("BusinessListingPageBackdrop");
        expect(fileContent).toContain("<BusinessListingPageBackdrop listingType={listingTypeLabel} />");
    });

    it("ensures UserAppProviders registers SmartAlertModalProvider", () => {
        const providersPath = path.resolve(
            __dirname,
            "../components/providers/UserAppProviders.tsx"
        );
        const fileContent = fs.readFileSync(providersPath, "utf-8");

        expect(fileContent).toContain("SmartAlertModalProvider");
        expect(fileContent).toContain("<SmartAlertModalProvider>");
    });

    it("ensures useListingFormOrchestration injects business location and canonical listingType", () => {
        const orchPath = path.resolve(
            __dirname,
            "../components/user/shared/useListingFormOrchestration.ts"
        );
        const fileContent = fs.readFileSync(orchPath, "utf-8");

        expect(fileContent).toContain("businessData?.location");
        expect(fileContent).toContain("LISTING_TYPE.SERVICE");
        expect(fileContent).toContain("LISTING_TYPE.SPARE_PART");
        expect(fileContent).toContain("toCanonicalGeoPoint");
    });
});

