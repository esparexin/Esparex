"use client";

import { useEffect } from "react";
import { isNativeShell } from "@/lib/runtime/nativeShell";

function isLocalhost(hostname: string) {
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

export function PwaRegister() {
    useEffect(() => {
        if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
            return;
        }

        const shouldDisableOnThisHost =
            isNativeShell() ||
            process.env.NODE_ENV !== "production" ||
            isLocalhost(window.location.hostname) ||
            window.location.protocol !== "https:";

        if (shouldDisableOnThisHost) {
            void navigator.serviceWorker
                .getRegistrations()
                .then(async (registrations) => {
                    await Promise.all(registrations.map((r) => r.unregister()));
                    if ("caches" in window) {
                        const cacheKeys = await caches.keys();
                        await Promise.all(
                            cacheKeys
                                .filter((k) => k.startsWith("temporary-"))
                                .map((k) => caches.delete(k))
                        );
                    }
                })
                .catch(() => {
                    // Cleanup failures should not block app render.
                });
            return;
        }

        let isRefreshing = false;
        const handleControllerChange = () => {
            if (isRefreshing) return;
            isRefreshing = true;
            window.location.reload();
        };

        navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);

        let visibilityListener: (() => void) | null = null;

        navigator.serviceWorker
            .register("/sw.js", { updateViaCache: "none" })
            .then((registration) => {
                // Check for updates immediately after registration
                void registration.update().catch(() => {});

                // If a waiting worker already exists, prompt it to activate
                if (registration.waiting) {
                    registration.waiting.postMessage({ type: "SKIP_WAITING" });
                }

                // If a new worker is installing, activate it once installed
                registration.addEventListener("updatefound", () => {
                    const installingWorker = registration.installing;
                    if (!installingWorker) return;
                    installingWorker.addEventListener("statechange", () => {
                        if (installingWorker.state === "installed" && navigator.serviceWorker.controller) {
                            installingWorker.postMessage({ type: "SKIP_WAITING" });
                        }
                    });
                });

                // Check for updates when tab is restored/foregrounded on mobile
                visibilityListener = () => {
                    if (document.visibilityState === "visible") {
                        void registration.update().catch(() => {});
                    }
                };
                document.addEventListener("visibilitychange", visibilityListener);
            })
            .catch(() => {
                // Registration failures should not block app render.
            });

        return () => {
            navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
            if (visibilityListener) {
                document.removeEventListener("visibilitychange", visibilityListener);
            }
        };
    }, []);

    return null;
}
