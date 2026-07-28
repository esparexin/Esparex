"use client";

import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { PostAdWizard } from "@/components/user/post-ad/PostAdWizard";
import { getPageRoute, type UserPage } from "@/lib/routeUtils";
import { buildAccountListingRoute } from "@/lib/accountListingRoutes";

interface PostAdModalContextType {
    isPostAdOpen: boolean;
    openPostAd: () => void;
    closePostAd: () => void;
}

const PostAdModalContext = createContext<PostAdModalContextType | undefined>(undefined);

export function PostAdModalProvider({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();

    const openPostAd = useCallback(() => {
        setIsOpen(true);
    }, []);

    const closePostAd = useCallback(() => {
        setIsOpen(false);
    }, []);

    const navigateTo = useCallback((page: UserPage, adId?: string | number) => {
        setIsOpen(false);
        if (page === "my-ads") {
            void router.push(buildAccountListingRoute("ads", "pending"));
            return;
        }
        const route = getPageRoute(page, { adId });
        void router.push(route);
    }, [router]);

    const value = useMemo(
        () => ({ isPostAdOpen: isOpen, openPostAd, closePostAd }),
        [isOpen, openPostAd, closePostAd]
    );

    return (
        <PostAdModalContext.Provider value={value}>
            {children}
            {isOpen && (
                <PostAdWizard navigateTo={navigateTo} />
            )}
        </PostAdModalContext.Provider>
    );
}

export function usePostAdModal() {
    const context = useContext(PostAdModalContext);
    if (context === undefined) {
        throw new Error("usePostAdModal must be used within a PostAdModalProvider");
    }
    return context;
}
