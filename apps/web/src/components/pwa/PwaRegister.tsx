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
            void navigator.serviceWorker.getRegistrations().then(async (registrations) => {
                await Promise.all(registrations.map((registration) => registration.unregister()));

                if ("caches" in window) {
                    const cacheKeys = await caches.keys();
                    await Promise.all(
                        cacheKeys
                            .filter((cacheKey) => cacheKey.startsWith("temporary-"))
                            .map((cacheKey) => caches.delete(cacheKey))
                    );
                }
            }).catch(() => {
                // Cleanup failures should not block app render.
            });

            return;
        }

            window.location.reload();
        };

        navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);

        };
    }, []);

    return null;
}
