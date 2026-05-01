"use client";

import { usePathname } from "next/navigation";
import { BottomActionsBar } from "@/components/BottomActionsBar";
import { BackendStatusBanner } from "@/components/common/BackendStatusBanner";
import { ConnectivityBanner } from "@/components/common/ConnectivityBanner";
import { MobileBottomNav } from "@/components/mobile/MobileBottomNav";
import { getMobileChromePolicy } from "@/lib/mobile/chromePolicy";

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
            <BackendStatusBanner />
            <ConnectivityBanner apiUnavailable={apiUnavailable} />
            <MobileBottomNav enabled={policy.showMobileBottomNav} />
            <BottomActionsBar enabled={policy.showBottomActionsBar} />
        </>
    );
}
