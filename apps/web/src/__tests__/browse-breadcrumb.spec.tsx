import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { BrowseBreadcrumb } from "../components/user/BrowseBreadcrumb";

describe("BrowseBreadcrumb component logic", () => {
  it("exports BrowseBreadcrumb component function", () => {
    expect(typeof BrowseBreadcrumb).toBe("function");
  });

  it("renders keyword and location in title when searching with query", () => {
    const html = renderToStaticMarkup(
      <BrowseBreadcrumb query="iphone" locationLabel="Visakhapatnam" />
    );

    expect(html).toContain("&quot;iphone&quot;");
    expect(html).toContain("Visakhapatnam");
    expect(html).not.toContain("All Categories");
  });

  it("renders keyword in category with location when both query and category are present", () => {
    const html = renderToStaticMarkup(
      <BrowseBreadcrumb query="iphone" categoryName="Mobiles" locationLabel="Visakhapatnam" />
    );

    expect(html).toContain("&quot;iphone&quot; in Mobiles");
    expect(html).toContain("Visakhapatnam");
    expect(html).toContain("Mobiles");
  });

  it("renders category name and location when query is absent", () => {
    const html = renderToStaticMarkup(
      <BrowseBreadcrumb categoryName="Mobiles" locationLabel="Visakhapatnam" />
    );

    expect(html).toContain("Mobiles");
    expect(html).toContain("Visakhapatnam");
    expect(html).not.toContain("&quot;");
  });

  it("falls back to All Categories when both query and category are absent", () => {
    const html = renderToStaticMarkup(
      <BrowseBreadcrumb locationLabel="Visakhapatnam" />
    );

    expect(html).toContain("All Categories");
    expect(html).toContain("Visakhapatnam");
  });

  it("does not render location text when location is unavailable", () => {
    const html = renderToStaticMarkup(
      <BrowseBreadcrumb query="laptop" locationLabel="Location unavailable" />
    );

    expect(html).toContain("&quot;laptop&quot;");
    expect(html).not.toContain("Location unavailable");
  });
});
