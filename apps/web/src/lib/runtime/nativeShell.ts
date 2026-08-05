type NativeShellWindow = Window & {
    ReactNativeWebView?: unknown;
    Capacitor?: {
        isNativePlatform?: () => boolean;
        getPlatform?: () => string;
        platform?: string;
    };
};

export function isNativeShell(): boolean {
    if (typeof window === "undefined") {
        return false;
    }

    const win = window as NativeShellWindow;

    // React Native WebView bridge injection
    if (win.ReactNativeWebView !== undefined) {
        return true;
    }

    // Fallback bridge check
    if (win.Capacitor) {
        if (typeof win.Capacitor.isNativePlatform === "function") {
            return win.Capacitor.isNativePlatform();
        }
        const platform =
            typeof win.Capacitor.getPlatform === "function"
                ? win.Capacitor.getPlatform()
                : typeof win.Capacitor.platform === "string"
                  ? win.Capacitor.platform
                  : "web";
        return platform === "ios" || platform === "android";
    }

    // Native user-agent fallback
    if (typeof navigator !== "undefined" && navigator.userAgent) {
        return /EsparexNativeApp|wv/i.test(navigator.userAgent);
    }

    return false;
}
