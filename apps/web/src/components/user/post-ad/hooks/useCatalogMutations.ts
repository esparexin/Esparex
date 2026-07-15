import { useCallback, useRef } from "react";
import { createCatalogRequest } from "@/lib/api/user/catalogRequest";
import logger from "@/lib/logger";

export interface CatalogMutationResult {
    status: 'SELECTED' | 'MANUAL_REVIEW' | 'REJECTED' | 'ERROR';
    id?: string;
    message?: string;
}

interface UseCatalogMutationsProps {
    ensureBrandVisible: (entity: { id: string; name: string }) => Promise<void>;
    ensureModelVisible: (entity: { id: string; name: string; brandId: string }) => Promise<void>;
    selectBrand: (id: string, name: string) => Promise<void>;
    selectModel: (id: string, name: string) => void;
}

export function useCatalogMutations({
    ensureBrandVisible,
    ensureModelVisible,
    selectBrand,
    selectModel,
}: UseCatalogMutationsProps) {
    const activeMutationRef = useRef<Promise<CatalogMutationResult> | null>(null);

    /**
     * Composed workflow: HTTP POST -> Ensure Brand Visibility -> Select Brand.
     * Enforces mutex protection against duplicate or rapid consecutive submissions.
     */
    const createAndSelectBrand = useCallback(
        async (categoryId: string, name: string, listingId?: string): Promise<CatalogMutationResult> => {
            if (activeMutationRef.current) {
                return activeMutationRef.current;
            }

            const promise = (async (): Promise<CatalogMutationResult> => {
                try {
                    // Phase 1: HTTP Mutation
                    const result = await createCatalogRequest({
                        requestType: 'brand',
                        categoryId,
                        requestedName: name,
                        listingId,
                    });

                    if (result.decision === 'REJECT') {
                        return { status: 'REJECTED', message: 'Brand suggestion was rejected by catalog policy.' };
                    }

                    if (result.decision === 'MANUAL_REVIEW' || !result.approvedEntityId) {
                        return { status: 'MANUAL_REVIEW', message: 'Brand suggestion submitted for manual review.' };
                    }

                    // Phase 2: Visibility Guarantee (Layer 1 encapsulated reconciliation)
                    await ensureBrandVisible({ id: result.approvedEntityId, name: result.name || name });

                    // Phase 3: Selection (invoked strictly AFTER visibility is guaranteed)
                    await selectBrand(result.approvedEntityId, result.name || name);

                    return { status: 'SELECTED', id: result.approvedEntityId };
                } catch (error) {
                    logger.error('[CatalogMutations] createAndSelectBrand failed:', error);
                    return {
                        status: 'ERROR',
                        message: error instanceof Error ? error.message : 'Failed to create and select brand',
                    };
                } finally {
                    activeMutationRef.current = null;
                }
            })();

            activeMutationRef.current = promise;
            return promise;
        },
        [ensureBrandVisible, selectBrand]
    );

    /**
     * Composed workflow: HTTP POST -> Ensure Model Visibility -> Select Model.
     * Enforces mutex protection against duplicate or rapid consecutive submissions.
     */
    const createAndSelectModel = useCallback(
        async (brandId: string, categoryId: string, name: string, listingId?: string): Promise<CatalogMutationResult> => {
            if (activeMutationRef.current) {
                return activeMutationRef.current;
            }

            const promise = (async (): Promise<CatalogMutationResult> => {
                try {
                    // Phase 1: HTTP Mutation
                    const result = await createCatalogRequest({
                        requestType: 'model',
                        categoryId,
                        parentBrandId: brandId,
                        requestedName: name,
                        listingId,
                    });

                    if (result.decision === 'REJECT') {
                        return { status: 'REJECTED', message: 'Model suggestion was rejected by catalog policy.' };
                    }

                    if (result.decision === 'MANUAL_REVIEW' || !result.approvedEntityId) {
                        return { status: 'MANUAL_REVIEW', message: 'Model suggestion submitted for manual review.' };
                    }

                    // Phase 2: Visibility Guarantee (Layer 1 encapsulated reconciliation)
                    await ensureModelVisible({ id: result.approvedEntityId, name: result.name || name, brandId });

                    // Phase 3: Selection (invoked strictly AFTER visibility is guaranteed)
                    selectModel(result.approvedEntityId, result.name || name);

                    return { status: 'SELECTED', id: result.approvedEntityId };
                } catch (error) {
                    logger.error('[CatalogMutations] createAndSelectModel failed:', error);
                    return {
                        status: 'ERROR',
                        message: error instanceof Error ? error.message : 'Failed to create and select model',
                    };
                } finally {
                    activeMutationRef.current = null;
                }
            })();

            activeMutationRef.current = promise;
            return promise;
        },
        [ensureModelVisible, selectModel]
    );

    return {
        createAndSelectBrand,
        createAndSelectModel,
    };
}
