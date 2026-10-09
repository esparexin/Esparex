"use client";

import { usePwaServiceWorker } from "@/hooks/usePwaServiceWorker";

export function PwaRegister() {
    usePwaServiceWorker();
    return null;
}
