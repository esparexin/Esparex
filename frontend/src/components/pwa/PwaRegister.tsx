"use client";

import { useEffect } from "react";

export function PwaRegister() {
    useEffect(() => {
        if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
            return;
        }

        navigator.serviceWorker.register("/sw.js").catch(() => {
            // Registration failures should not block app render.
        });
    }, []);

    return null;
}
