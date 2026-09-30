"use client";

import { usePathname } from "next/navigation";
import { BottomActionsBar } from "@/components/BottomActionsBar";
import { StatusBannerHost } from "@/components/common/StatusBannerHost";
import { MobileBottomNav } from "@/components/mobile/MobileBottomNav";
import { getMobileChromePolicy } from "@/lib/mobile/chromePolicy";
import { isWizardPathname } from "@/lib/routeUtils";

interface ClientChromeLoaderProps {
    apiUnavailable?: boolean;
}

export function ClientChromeLoader({ apiUnavailable = false }: ClientChromeLoaderProps) {
    const pathname = usePathname();
    const policy = getMobileChromePolicy(pathname);

    return (
        <>
            <StatusBannerHost
                apiUnavailable={apiUnavailable}
                hasCompactHeader={!policy.showMobileSearch}
                hideHeader={isWizardPathname(pathname)}
            />
            <MobileBottomNav enabled={policy.showMobileBottomNav} />
            <BottomActionsBar enabled={policy.showBottomActionsBar} />
        </>
    );
}
