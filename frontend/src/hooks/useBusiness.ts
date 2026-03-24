import { useState, useEffect } from "react";
import { type Business, type BusinessStats } from "@/lib/api/user/businesses";
import type { User } from "@/types/User";
import logger from "@/lib/logger";

export function useBusiness(user: User | null, businessId?: string) {
    const [businessData, setBusinessData] = useState<Business | null>(null);
    const [businessStats, setBusinessStats] = useState<BusinessStats>({
        totalServices: 0,
        approvedServices: 0,
        pendingServices: 0,
        views: 0,
    });
    const [isLoading, setIsLoading] = useState(false);
    const [isFetched, setIsFetched] = useState(false);
    const [error, setError] = useState<any>(null);

    useEffect(() => {
        if (!isFetched || !businessData || !user) return;

        const currentStatus = businessData.status?.toLowerCase();
        const userStatus = user.businessStatus?.toLowerCase();

        // If backend says live but user session still says pending/none
        // Trigger a refresh of the AuthContext/User profile
        if (currentStatus === "live" && (userStatus === "pending" || !userStatus)) {
            logger.info("[useBusiness] Status change detected (live), triggering session refresh...");
            window.dispatchEvent(new CustomEvent("esparex_auth_update"));
        }
    }, [businessData, user, isFetched]);

    useEffect(() => {
        const fetchBusiness = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const { getMyBusiness, getMyBusinessStats, getBusinessById, getBusinessStats } = await import("@/lib/api/user/businesses");
                
                let data: Business | null;
                let stats: BusinessStats;

                if (businessId) {
                    [data, stats] = await Promise.all([
                        getBusinessById(businessId),
                        getBusinessStats(businessId)
                    ]);
                } else {
                    [data, stats] = await Promise.all([
                        getMyBusiness(),
                        getMyBusinessStats()
                    ]);
                }
                
                setBusinessData(data);
                setBusinessStats(stats);
                setIsFetched(true);
            } catch (e) {
                logger.error("Failed to load business", e);
                setError(e);
                setIsFetched(true); // Mark as fetched even on error so pages don't hang
            } finally {
                setIsLoading(false);
            }
        };

        if (user || businessId) {
            fetchBusiness();
        } else {
            setBusinessData(null);
            setIsFetched(false);
            setIsLoading(false);
        }
    }, [user, businessId]);

    return { 
        businessData, 
        setBusinessData, 
        businessStats, 
        isLoading, 
        isFetched, 
        error 
    };
}