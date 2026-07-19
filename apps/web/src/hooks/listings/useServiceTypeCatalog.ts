"use client";

import { useCallback, useState } from "react";
import logger from "@/lib/logger";
import { getServiceTypes, type ServiceType } from "@/lib/api/user/masterData";
import { normalizeOptionalObjectId } from "@/lib/normalizeOptionalObjectId";

interface UseServiceTypeCatalogProps {
    onError?: (msg: string) => void;
}

export function useServiceTypeCatalog({ onError }: UseServiceTypeCatalogProps = {}) {
    const [availableServiceTypes, setAvailableServiceTypes] = useState<ServiceType[]>([]);
    const [isLoadingServiceTypes, setIsLoadingServiceTypes] = useState(false);

    const loadServiceTypes = useCallback(async (categoryId?: string): Promise<ServiceType[]> => {
        if (!categoryId) {
            setAvailableServiceTypes([]);
            return [];
        }

        setIsLoadingServiceTypes(true);
        try {
            const serviceTypes = await getServiceTypes(categoryId);
            const seen = new Set<string>();
            const normalized = serviceTypes
                .map((item) => {
                    const id = normalizeOptionalObjectId(item.id ?? item._id);
                    const name = item.name?.trim();
                    if (!id || !name) return null;
                    if (seen.has(id)) return null;
                    seen.add(id);
                    return {
                        ...item,
                        id,
                        name,
                    } as ServiceType;
                })
                .filter((item): item is ServiceType => Boolean(item));
            setAvailableServiceTypes(normalized);
            return normalized;
        } catch (error) {
            logger.error(`[Catalog] Failed to load service types for ${categoryId}:`, error);
            setAvailableServiceTypes([]);
            onError?.("Failed to load service types");
            return [];
        } finally {
            setIsLoadingServiceTypes(false);
        }
    }, [onError]);

    return {
        availableServiceTypes,
        isLoadingServiceTypes,
        loadServiceTypes,
    };
}
