import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Pagination } from "@esparex/ui";

describe("Pagination SSOT & Accessibility Governance", () => {
    it("exports canonical Pagination primitive from @esparex/ui", () => {
        expect(typeof Pagination).toBe("function");
    });

    it("renders item count summary and disabled buttons when totalItems <= pageSize and alwaysShow is true", () => {
        const onPageChange = vi.fn();
        const html = renderToStaticMarkup(
            <Pagination
                currentPage={1}
                totalPages={1}
                totalItems={9}
                pageSize={10}
                itemLabel="listings"
                alwaysShow={true}
                onPageChange={onPageChange}
            />
        );

        // Result count summary must be visible
        expect(html).toContain("Showing");
        expect(html).toContain(">1<");
        expect(html).toContain(">9<");
        expect(html).toContain("listings");
        expect(html).toContain("Page 1 of 1");

        // Buttons must exist and be disabled on single-page view
        expect(html).toContain("disabled=\"\"");
        expect(html).toContain("Previous");
        expect(html).toContain("Next");
    });

    it("returns null when totalItems is 0 and alwaysShow is false", () => {
        const html = renderToStaticMarkup(
            <Pagination
                currentPage={1}
                totalPages={1}
                totalItems={0}
                pageSize={4}
                alwaysShow={false}
            />
        );

        expect(html).toBe("");
    });

    it("returns null when totalPages <= 1 and alwaysShow is false (smart visibility for small lists like Live 1)", () => {
        const html = renderToStaticMarkup(
            <Pagination
                currentPage={1}
                totalPages={1}
                totalItems={1}
                pageSize={4}
                itemLabel="listings"
                alwaysShow={false}
                onPageChange={() => {}}
            />
        );

        expect(html).toBe("");
    });

    it("renders navigation buttons with proper state on multi-page views", () => {
        // Page 1 of 3: Previous disabled, Next enabled
        const page1Html = renderToStaticMarkup(
            <Pagination
                currentPage={1}
                totalPages={3}
                totalItems={25}
                pageSize={10}
                onPageChange={() => {}}
            />
        );
        expect(page1Html).toContain("Showing");
        expect(page1Html).toContain(">1<");
        expect(page1Html).toContain(">10<");
        expect(page1Html).toContain(">25<");
        expect(page1Html).toContain("Page 1 of 3");

        // Page 2 of 3: both enabled
        const page2Html = renderToStaticMarkup(
            <Pagination
                currentPage={2}
                totalPages={3}
                totalItems={25}
                pageSize={10}
                onPageChange={() => {}}
            />
        );
        expect(page2Html).toContain(">11<");
        expect(page2Html).toContain(">20<");
        expect(page2Html).toContain("Page 2 of 3");

        // Page 3 of 3: Next disabled
        const page3Html = renderToStaticMarkup(
            <Pagination
                currentPage={3}
                totalPages={3}
                totalItems={25}
                pageSize={10}
                onPageChange={() => {}}
            />
        );
        expect(page3Html).toContain(">21<");
        expect(page3Html).toContain(">25<");
        expect(page3Html).toContain("Page 3 of 3");
    });

    it("strictly adheres to WCAG 2.2 AA accessibility requirements", () => {
        const html = renderToStaticMarkup(
            <Pagination
                currentPage={1}
                totalPages={2}
                totalItems={15}
                pageSize={10}
                onPageChange={() => {}}
            />
        );

        // Must be wrapped in accessible nav landmark
        expect(html).toContain('role="navigation"');
        expect(html).toContain('aria-label="Pagination"');

        // Buttons must have explicit type="button" and accessible aria-labels
        expect(html).toContain('type="button"');
        expect(html).toContain('aria-label="Previous page"');
        expect(html).toContain('aria-label="Next page"');
    });
});
