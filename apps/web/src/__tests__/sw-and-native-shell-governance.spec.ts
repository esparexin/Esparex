import { describe, it, expect, vi, afterEach } from "vitest";
import { isNativeShell } from "@/lib/runtime/nativeShell";

describe("Native Shell & Android In-App Browser Detection Governance", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does not identify standard Android browsers as native shell", () => {
    const androidChromeUA =
      "Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.6613.88 Mobile Safari/537.36";
    vi.stubGlobal("navigator", { userAgent: androidChromeUA });
    expect(isNativeShell()).toBe(false);
  });

  it("does not falsely identify Android in-app browsers (containing '; wv') as Esparex native shell", () => {
    // WhatsApp, Gmail, Facebook, Instagram, LinkedIn in-app webviews include '; wv'
    const androidInAppWebViewUA =
      "Mozilla/5.0 (Linux; U; Android 14; en-us; SM-S918B Build/UP1A.231005.007) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/128.0.6613.88 Mobile Safari/537.36; wv";
    vi.stubGlobal("navigator", { userAgent: androidInAppWebViewUA });
    expect(isNativeShell()).toBe(false);
  });

  it("does not identify iOS Safari as native shell", () => {
    const iosSafariUA =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
    vi.stubGlobal("navigator", { userAgent: iosSafariUA });
    expect(isNativeShell()).toBe(false);
  });

  it("correctly identifies native app via window.ReactNativeWebView injection", () => {
    vi.stubGlobal("window", {
      ReactNativeWebView: { postMessage: vi.fn() },
    });
    vi.stubGlobal("navigator", { userAgent: "Mozilla/5.0" });
    expect(isNativeShell()).toBe(true);
  });

  it("correctly identifies native app via EsparexNativeApp User-Agent token", () => {
    const nativeAppUA =
      "Mozilla/5.0 (Linux; Android 14; EsparexNativeApp/1.0.0) Mobile Safari/537.36";
    vi.stubGlobal("window", {});
    vi.stubGlobal("navigator", { userAgent: nativeAppUA });
    expect(isNativeShell()).toBe(true);
  });
});

describe("Next.js next.config.mjs Cache-Control Header Governance for Service Worker", () => {
  it("verifies sw.js and manifest.json have no-cache headers configured", async () => {
    const nextConfigModule = await import("../../next.config.mjs");
    const nextConfig = nextConfigModule.default;
    expect(nextConfig.headers).toBeDefined();
    if (!nextConfig.headers) return;

    const headersConfig = await nextConfig.headers();

    const swHeader = headersConfig.find((h: { source: string }) => h.source === "/sw.js");
    expect(swHeader).toBeDefined();
    if (!swHeader) return;

    const swCacheControl = swHeader.headers.find(
      (h: { key: string }) => h.key.toLowerCase() === "cache-control"
    );
    expect(swCacheControl).toBeDefined();
    if (!swCacheControl) return;

    expect(swCacheControl.value).toContain("no-cache");
    expect(swCacheControl.value).toContain("no-store");
    expect(swCacheControl.value).toContain("must-revalidate");

    const manifestHeader = headersConfig.find((h: { source: string }) => h.source === "/manifest.json");
    expect(manifestHeader).toBeDefined();
    if (!manifestHeader) return;

    const manifestCacheControl = manifestHeader.headers.find(
      (h: { key: string }) => h.key.toLowerCase() === "cache-control"
    );
    expect(manifestCacheControl).toBeDefined();
    if (!manifestCacheControl) return;

    expect(manifestCacheControl.value).toContain("no-cache");
  });
});
