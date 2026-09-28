"use client";

import { useEffect } from "react";
import { isNativeShell } from "@/lib/runtime/nativeShell";

function isLocalhost(hostname: string) {
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

/** Registers (or unregisters) the PWA service worker based on the current environment. */
export function usePwaServiceWorker() {
    useEffect(() => {
        if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

        const shouldDisable =
            isNativeShell() ||
            process.env.NODE_ENV !== "production" ||
            isLocalhost(window.location.hostname) ||
            window.location.protocol !== "https:";

        if (shouldDisable) {
            void navigator.serviceWorker
                .getRegistrations()
                .then(async (regs) => {
                    await Promise.all(regs.map((r) => r.unregister()));
                    if ("caches" in window) {
                        const keys = await caches.keys();
                        await Promise.all(
                            keys.filter((k) => k.startsWith("temporary-")).map((k) => caches.delete(k))
                        );
                    }
                })
                .catch(() => {});
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
                void registration.update().catch(() => {});
                if (registration.waiting) registration.waiting.postMessage({ type: "SKIP_WAITING" });

                registration.addEventListener("updatefound", () => {
                    const worker = registration.installing;
                    if (!worker) return;
                    worker.addEventListener("statechange", () => {
                        if (worker.state === "installed" && navigator.serviceWorker.controller) {
                            worker.postMessage({ type: "SKIP_WAITING" });
                        }
                    });
                });

                visibilityListener = () => {
                    if (document.visibilityState === "visible") void registration.update().catch(() => {});
                };
                document.addEventListener("visibilitychange", visibilityListener);
            })
            .catch(() => {});

        return () => {
            navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
            if (visibilityListener) document.removeEventListener("visibilitychange", visibilityListener);
        };
    }, []);
}
