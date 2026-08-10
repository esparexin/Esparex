type NativeShellWindow = Window & {
    ReactNativeWebView?: unknown;
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

    // Native user-agent fallback
    if (typeof navigator !== "undefined" && navigator.userAgent) {
        return /EsparexNativeApp|wv/i.test(navigator.userAgent);
    }

    return false;
}

