"use client";

import type { User } from "@/types/User";

import { notificationApi } from "@/lib/api/user/notifications";

type WebPushStatus =
    | "connected"
    | "disabled"
    | "unsupported"
    | "unconfigured"
    | "permission-default"
    | "permission-denied"
    | "no-token"
    | "error";

type PushCapableUser = User & {
    notificationSettings?: {
        pushNotifications?: boolean;
    };
};

type SyncBrowserPushOptions = {
    user: PushCapableUser | null | undefined;
    interactive?: boolean;
};

type SyncBrowserPushResult = {
    status: WebPushStatus;
    reason?: string;
};

type FirebaseWebConfig = {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    measurementId?: string;
    vapidKey: string;
};

const FCM_TOKEN_STORAGE_KEY = "esparex_fcm_token";
const FCM_REGISTRATION_STORAGE_KEY = "esparex_fcm_registration_v1";

let foregroundListenerAttached = false;

const getFirebaseWebConfig = (): FirebaseWebConfig | null => {
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim();
    const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim();
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
    const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim();
    const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim();
    const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.trim();
    const measurementId = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID?.trim();
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY?.trim();

    if (!apiKey || !authDomain || !projectId || !storageBucket || !messagingSenderId || !appId || !vapidKey) {
        return null;
    }

    return {
        apiKey,
        authDomain,
        projectId,
        storageBucket,
        messagingSenderId,
        appId,
        ...(measurementId ? { measurementId } : {}),
        vapidKey,
    };
};

export const isBrowserPushSupported = () =>
    typeof window !== "undefined" &&
    typeof navigator !== "undefined" &&
    window.isSecureContext &&
    "Notification" in window &&
    "serviceWorker" in navigator;

export const isBrowserPushConfigured = () => getFirebaseWebConfig() !== null;

const waitForServiceWorkerReady = async (timeoutMs = 5000): Promise<ServiceWorkerRegistration | null> => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
        return null;
    }

    const existing = await navigator.serviceWorker.getRegistration();
    if (existing?.active) {
        return existing;
    }

    return await new Promise((resolve) => {
        let settled = false;
        const finish = (value: ServiceWorkerRegistration | null) => {
            if (settled) return;
            settled = true;
            resolve(value);
        };

        const timer = window.setTimeout(() => finish(null), timeoutMs);

        navigator.serviceWorker.ready
            .then((registration) => {
                window.clearTimeout(timer);
                finish(registration);
            })
            .catch(() => {
                window.clearTimeout(timer);
                finish(null);
            });
    });
};

const readRegistrationCache = (): { userId?: string; token?: string } => {
    if (typeof window === "undefined") {
        return {};
    }

    try {
        const raw = window.localStorage.getItem(FCM_REGISTRATION_STORAGE_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw) as { userId?: string; token?: string };
        return typeof parsed === "object" && parsed !== null ? parsed : {};
    } catch {
        return {};
    }
};

const writeRegistrationCache = (userId: string, token: string) => {
    if (typeof window === "undefined") {
        return;
    }

    window.localStorage.setItem(FCM_TOKEN_STORAGE_KEY, token);
    window.localStorage.setItem(FCM_REGISTRATION_STORAGE_KEY, JSON.stringify({ userId, token }));
};

export const clearBrowserPushCache = () => {
    if (typeof window === "undefined") {
        return;
    }

    window.localStorage.removeItem(FCM_TOKEN_STORAGE_KEY);
    window.localStorage.removeItem(FCM_REGISTRATION_STORAGE_KEY);
};

const getMessagingRuntime = async () => {
    const config = getFirebaseWebConfig();
    if (!config || !isBrowserPushSupported()) {
        return null;
    }

    const [{ getApps, initializeApp }, messagingModule] = await Promise.all([
        import("firebase/app"),
        import("firebase/messaging"),
    ]);

    const supported = await messagingModule.isSupported().catch(() => false);
    if (!supported) {
        return null;
    }

    const existingApp = getApps()[0];
    const app =
        existingApp ??
        initializeApp({
            apiKey: config.apiKey,
            authDomain: config.authDomain,
            projectId: config.projectId,
            storageBucket: config.storageBucket,
            messagingSenderId: config.messagingSenderId,
            appId: config.appId,
            ...(config.measurementId ? { measurementId: config.measurementId } : {}),
        });

    return {
        config,
        module: messagingModule,
        messaging: messagingModule.getMessaging(app),
    };
};

export const describeWebPushStatus = (status: WebPushStatus): string | null => {
    switch (status) {
        case "connected":
            return "Browser push is enabled for this account.";
        case "disabled":
            return "Push delivery is turned off in your notification settings.";
        case "unconfigured":
            return "Browser push is not configured for this web environment yet.";
        case "unsupported":
            return "Browser push is not supported on this device, browser, or connection.";
        case "permission-default":
            return "Allow browser notifications to enable push delivery on web.";
        case "permission-denied":
            return "Browser notifications are blocked for this site. Enable them in browser settings.";
        case "no-token":
            return "The browser did not issue a push token. Try again after reloading the page.";
        case "error":
            return "Browser push could not be connected right now.";
        default:
            return null;
    }
};

export const syncBrowserPushRegistration = async ({
    user,
    interactive = false,
}: SyncBrowserPushOptions): Promise<SyncBrowserPushResult> => {
    if (!user?.id) {
        return { status: "unsupported" };
    }

    if (user.notificationSettings?.pushNotifications === false) {
        clearBrowserPushCache();
        return { status: "disabled" };
    }

    if (!isBrowserPushSupported()) {
        return {
            status: "unsupported",
            reason: describeWebPushStatus("unsupported") ?? undefined,
        };
    }

    const runtime = await getMessagingRuntime();
    if (!runtime) {
        return {
            status: getFirebaseWebConfig() ? "unsupported" : "unconfigured",
            reason: getFirebaseWebConfig()
                ? describeWebPushStatus("unsupported") ?? undefined
                : describeWebPushStatus("unconfigured") ?? undefined,
        };
    }

    let permission = window.Notification.permission;
    if (permission === "default" && interactive) {
        permission = await window.Notification.requestPermission();
    }

    if (permission === "default") {
        return {
            status: "permission-default",
            reason: describeWebPushStatus("permission-default") ?? undefined,
        };
    }

    if (permission !== "granted") {
        return {
            status: "permission-denied",
            reason: describeWebPushStatus("permission-denied") ?? undefined,
        };
    }

    const registration = await waitForServiceWorkerReady();
    if (!registration) {
        return {
            status: "unsupported",
            reason: "The web push service worker is not active yet.",
        };
    }

    try {
        const token = await runtime.module.getToken(runtime.messaging, {
            vapidKey: runtime.config.vapidKey,
            serviceWorkerRegistration: registration,
        });

        if (!token) {
            clearBrowserPushCache();
            return {
                status: "no-token",
                reason: describeWebPushStatus("no-token") ?? undefined,
            };
        }

        const cached = readRegistrationCache();
        if (cached.userId === user.id && cached.token === token) {
            window.localStorage.setItem(FCM_TOKEN_STORAGE_KEY, token);
            return { status: "connected" };
        }

        await notificationApi.registerToken(token, "web");
        writeRegistrationCache(user.id, token);

        return { status: "connected" };
    } catch {
        return {
            status: "error",
            reason: describeWebPushStatus("error") ?? undefined,
        };
    }
};

export const ensureForegroundPushListener = async (onNotification: () => void) => {
    if (foregroundListenerAttached || !isBrowserPushSupported()) {
        return;
    }

    const runtime = await getMessagingRuntime();
    if (!runtime) {
        return;
    }

    foregroundListenerAttached = true;
    runtime.module.onMessage(runtime.messaging, () => {
        onNotification();
    });
};
