"use client";

import { useRouter } from "next/navigation";
import { PostAdWizard } from "@/components/user/post-ad/PostAdWizard";
import { getPageRoute, type UserPage } from "@/lib/routeUtils";

export default function PostAdPageClient() {
    const router = useRouter();

    const navigateTo = (page: UserPage, adId?: string | number) => {
        const route = getPageRoute(page, { adId });
        void router.push(route);
    };

    return <PostAdWizard navigateTo={navigateTo} />;
}
