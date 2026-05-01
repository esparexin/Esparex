import { useState, useEffect, useCallback } from "react";
import { isAPIError } from "@/lib/api/APIError";
import { ErrorCategory, EsparexError } from "@/lib/errorHandler";
import { type Business, type BusinessStats } from "@/lib/api/user/businesses";
import type { User } from "@/types/User";
import logger from "@/lib/logger";

interface UseBusinessOptions {
    enabled?: boolean;
    includeStats?: boolean;
    silent?: boolean;
}

function isHandledBusinessLoadFailure(error: unknown): boolean {
    if (isAPIError(error)) {
        return error.source === "network" || error.source === "health-gate";
    }

    if (error instanceof EsparexError) {
        return (
            error.category === ErrorCategory.NETWORK ||
            error.context?.source === "network" ||
            error.context?.source === "health-gate"
        );
    }

    return false;
}

export function useBusiness(user: User | null, businessId?: string, options?: UseBusinessOptions) {
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
    const enabled = options?.enabled ?? true;
    const includeStats = options?.includeStats ?? true;
    const silent = options?.silent ?? false;
    const [requestNonce, setRequestNonce] = useState(0);

    const retry = useCallback(() => {
        setRequestNonce((current) => current + 1);
    }, []);

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
                let stats: BusinessStats = {
                    totalServices: 0,
                    approvedServices: 0,
                    pendingServices: 0,
                    views: 0,
                };

                if (businessId) {
                    if (includeStats) {
                        [data, stats] = await Promise.all([
                            getBusinessById(businessId, { requestConfig: { silent } }),
                            getBusinessStats(businessId, { silent })
                        ]);
                    } else {
                        data = await getBusinessById(businessId, { requestConfig: { silent } });
                    }
                } else {
                    if (includeStats) {
                        [data, stats] = await Promise.all([
                            getMyBusiness({ silent }),
                            getMyBusinessStats({ silent })
                        ]);
                    } else {
                        data = await getMyBusiness({ silent });
                    }
                }
                
                setBusinessData(data);
                setBusinessStats(stats);
                setIsFetched(true);
            } catch (e) {
                if (isHandledBusinessLoadFailure(e)) {
                    logger.warn("Failed to load business", e);
                } else {
                    logger.error("Failed to load business", e);
                }
                setError(e);
                setIsFetched(true); // Mark as fetched even on error so pages don't hang
            } finally {
                setIsLoading(false);
            }
        };

        if (!enabled) {
            setIsLoading(false);
            setError(null);
            return;
        }

        if (user || businessId) {
            fetchBusiness();
        } else {
            setBusinessData(null);
            setIsFetched(false);
            setIsLoading(false);
            setError(null);
        }
    }, [businessId, enabled, includeStats, user, requestNonce, silent]);

    return { 
        businessData, 
        setBusinessData, 
        businessStats, 
        isLoading, 
        isFetched, 
        error,
        retry,
    };
}
