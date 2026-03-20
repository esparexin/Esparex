"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import { useNavigation } from "@/context/NavigationContext";
import { UserPage, getPageRoute, SellerType } from "@/lib/routeUtils";

export function useAppNavigation() {
    const router = useRouter();
    const pathname = usePathname();
    const { confirmNavigation } = useNavigation();
    const navigatingRef = useRef(false);

    useEffect(() => {
        navigatingRef.current = false;
    }, [pathname]);

    /**
     * Unified navigation function handling:
     * 1. Route mapping (via getPageRoute)
     * 2. Unsaved changes confirmation (via useNavigation)
     * 3. Next.js App Router navigation
     * 
     * Signature matches the legacy prop structure used in HeaderWrapper and AdDetail
     */
    const navigateTo = useCallback((
        page: UserPage,
        adId?: string | number,
        category?: string,
        businessId?: string,
        serviceId?: string,
        _sellerId?: string,
        _sellerType?: SellerType
    ) => {
        const routeParams = {
            adId,
            serviceId,
            category
        };

        const path =
            page === "public-profile" && businessId
                ? getPageRoute(page, { businessSlug: businessId, businessId })
                : getPageRoute(page, routeParams);

        if (pathname === path || navigatingRef.current) {
            return;
        }

        const performNavigation = () => {
            if (navigatingRef.current) {
                return;
            }

            navigatingRef.current = true;
            // Special cases that might need custom handling before routing
            // (e.g. logging, analytics hooks could go here)

            if (page === "public-profile" && businessId) {
                void router.push(path);
                return;
            }
            void router.push(path);
        };

        confirmNavigation(performNavigation);
    }, [confirmNavigation, pathname, router]);

    return { navigateTo };
}
