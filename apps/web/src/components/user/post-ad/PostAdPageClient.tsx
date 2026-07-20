"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PostAdWizard } from "@/components/user/post-ad/PostAdWizard";
import { getPageRoute, type UserPage } from "@/lib/routeUtils";
import { buildAccountListingRoute } from "@/lib/accountListingRoutes";
import { trackPostAdEvent } from "@/lib/analytics/trackPostAd";

export default function PostAdPageClient() {
    const router = useRouter();

    useEffect(() => {
        trackPostAdEvent({ event: "post_ad_opened", source: "navbar" });
    }, []);

    const navigateTo = (page: UserPage, adId?: string | number) => {
        if (page === "my-ads") {
            void router.push(buildAccountListingRoute("ads", "pending"));
            return;
        }
        const route = getPageRoute(page, { adId });
        void router.push(route);
    };

    return <PostAdWizard navigateTo={navigateTo} />;
}
