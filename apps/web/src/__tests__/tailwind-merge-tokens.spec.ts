import { describe, expect, it } from "vitest";
import { cn } from "@esparex/ui";

describe("tailwind-merge design token collision audit", () => {
    it("preserves custom font-size tokens when merged with text colors", () => {
        expect(cn("text-caption", "text-foreground")).toBe("text-caption text-foreground");
        expect(cn("text-caption", "text-foreground-secondary")).toBe("text-caption text-foreground-secondary");
        expect(cn("text-caption", "text-foreground-tertiary")).toBe("text-caption text-foreground-tertiary");
        expect(cn("text-caption", "text-foreground-subtle")).toBe("text-caption text-foreground-subtle");
        expect(cn("text-tiny", "text-muted-foreground")).toBe("text-tiny text-muted-foreground");
        expect(cn("text-small", "text-slate-700")).toBe("text-small text-slate-700");
        expect(cn("text-body", "text-slate-800")).toBe("text-body text-slate-800");
        expect(cn("text-body-lg", "text-foreground")).toBe("text-body-lg text-foreground");
        expect(cn("text-h4", "text-slate-900")).toBe("text-h4 text-slate-900");
        expect(cn("text-h3", "text-foreground")).toBe("text-h3 text-foreground");
        expect(cn("text-h2", "text-foreground")).toBe("text-h2 text-foreground");
        expect(cn("text-h1", "text-foreground")).toBe("text-h1 text-foreground");
        expect(cn("text-display", "text-foreground")).toBe("text-display text-foreground");
        expect(cn("text-2xs", "text-foreground-subtle")).toBe("text-2xs text-foreground-subtle");
    });

    it("correctly overrides conflicting font-size tokens", () => {
        expect(cn("text-tiny", "text-caption")).toBe("text-caption");
        expect(cn("text-caption", "text-body")).toBe("text-body");
        expect(cn("text-body", "text-h2")).toBe("text-h2");
    });

    it("correctly overrides conflicting custom text colors", () => {
        expect(cn("text-foreground", "text-foreground-secondary")).toBe("text-foreground-secondary");
        expect(cn("text-foreground-secondary", "text-foreground-tertiary")).toBe("text-foreground-tertiary");
        expect(cn("text-slate-500", "text-foreground-subtle")).toBe("text-foreground-subtle");
        expect(cn("text-link", "text-link-dark")).toBe("text-link-dark");
    });

    it("correctly overrides conflicting custom shadows", () => {
        expect(cn("shadow-2xs", "shadow-xs")).toBe("shadow-xs");
        expect(cn("shadow-xs", "shadow-premium")).toBe("shadow-premium");
        expect(cn("shadow-md", "shadow-premium")).toBe("shadow-premium");
    });

    it("correctly overrides conflicting custom border colors", () => {
        expect(cn("border-slate-200", "border-border")).toBe("border-border");
        expect(cn("border-border", "border-primary")).toBe("border-primary");
    });
});
