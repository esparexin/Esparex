"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { getMobileChromePolicy } from "@/lib/mobile/chromePolicy";

const DeferredMobileBottomNav = dynamic(
    () => import("@/components/mobile/MobileBottomNav").then((mod) => mod.MobileBottomNav),
    { ssr: false, loading: () => null }
);

const DeferredBottomActionsBar = dynamic(
    () => import("@/components/BottomActionsBar").then((mod) => mod.BottomActionsBar),
    { ssr: false, loading: () => null }
);

const DeferredBackendStatusBanner = dynamic(
    () => import("@/components/common/BackendStatusBanner").then((mod) => mod.BackendStatusBanner),
    { ssr: false, loading: () => null }
);

const DeferredConnectivityBanner = dynamic(
    () => import("@/components/common/ConnectivityBanner").then((mod) => mod.ConnectivityBanner),
    { ssr: false, loading: () => null }
);

interface ClientChromeLoaderProps {
    apiUnavailable?: boolean;
}

export function ClientChromeLoader({
    apiUnavailable = false,
}: ClientChromeLoaderProps) {
    const pathname = usePathname();
    const policy = getMobileChromePolicy(pathname);

    return (
        <>
            <DeferredBackendStatusBanner />
            <DeferredConnectivityBanner apiUnavailable={apiUnavailable} />
            <DeferredMobileBottomNav enabled={policy.showMobileBottomNav} />
            <DeferredBottomActionsBar />
        </>
    );
}
