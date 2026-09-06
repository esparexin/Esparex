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

        // Tailwind v4 syntax 'max-h-(--radix...)' does not compile in Tailwind v3
        expect(fileContent).not.toContain("max-h-(--radix-dropdown-menu-content-available-height)");
        expect(fileContent).not.toContain("origin-(--radix-dropdown-menu-content-transform-origin)");

        // Tailwind v3 requires square brackets 'max-h-[var(--...)]'
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

    it("ensures BusinessPostFAB directs Create Smart Alert to ?action=create and auto-closes on click", () => {
        const fabPath = path.resolve(
            __dirname,
            "../components/layout/BusinessPostFAB.tsx"
        );
        const fileContent = fs.readFileSync(fabPath, "utf-8");

        expect(fileContent).toContain('href: "/account/alerts?action=create"');
        expect(fileContent).toContain("onClick={() => setIsOpen(false)}");
    });

    it("ensures SmartAlertsTab observes action=create to auto-open dialog and cleans up URL on close", () => {
        const tabPath = path.resolve(
            __dirname,
            "../components/user/profile/tabs/SmartAlertsTab.tsx"
        );
        const fileContent = fs.readFileSync(tabPath, "utf-8");

        expect(fileContent).toContain('searchParams?.get("action") === "create"');
        expect(fileContent).toContain("resetAlertForm()");
        expect(fileContent).toContain("setIsDialogOpen(true)");
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
});
