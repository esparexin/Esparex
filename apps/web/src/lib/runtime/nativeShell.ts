type CapacitorBridge = {
    isNativePlatform?: () => boolean;
    getPlatform?: () => string;
    platform?: string;
};

type CapacitorWindow = Window & {
    Capacitor?: CapacitorBridge;
};

function getCapacitorBridge(): CapacitorBridge | null {
    if (typeof window === "undefined") {
        return null;
    }

    return (window as CapacitorWindow).Capacitor ?? null;
}

export function isNativeShell(): boolean {
    const bridge = getCapacitorBridge();
    if (!bridge) {
        return false;
    }

    if (typeof bridge.isNativePlatform === "function") {
        return bridge.isNativePlatform();
    }

    const platform =
        typeof bridge.getPlatform === "function"
            ? bridge.getPlatform()
            : typeof bridge.platform === "string"
              ? bridge.platform
              : "web";

    return platform === "ios" || platform === "android";
}
