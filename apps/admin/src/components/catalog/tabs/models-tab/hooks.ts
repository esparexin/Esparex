"use client";

import { useEffect, useRef, useState } from "react";
import { getModels } from "@/lib/api/models";
import { parseAdminResponse } from "@/lib/api/parseAdminResponse";
import type { Model } from "@esparex/shared";

export function useParentModelFetcher(
    initialBrandId: string,
    initialCategoryId: string,
    initialParentModelId: string,
) {
    const [search, setSearch] = useState("");
    const [options, setOptions] = useState<Model[]>([]);
    const [loading, setLoading] = useState(false);
    const requestSeq = useRef(0);
    const cache = useRef(new Map<string, Model[]>());

    useEffect(() => {
        const cacheKey = JSON.stringify({ categoryId: initialCategoryId, brandId: initialBrandId, search: search.trim() });
        const cached = cache.current.get(cacheKey);
        if (cached) { setOptions(cached); return; }

        const controller = new AbortController();
        const seq = requestSeq.current + 1;
        requestSeq.current = seq;
        setLoading(true);

        void getModels({
            categoryId: initialCategoryId !== "all" ? initialCategoryId : undefined,
            brandId: initialBrandId !== "all" ? initialBrandId : undefined,
            search: search || undefined,
            treeView: true, page: 1, limit: 50,
        }, { signal: controller.signal })
            .then((response) => {
                if (controller.signal.aborted || seq !== requestSeq.current) return;
                const items = parseAdminResponse<Model>(response).items;
                cache.current.set(cacheKey, items);
                setOptions(items);
            })
            .catch((error) => {
                if (!(error instanceof Error && error.name === "AbortError")) setOptions([]);
            })
            .finally(() => { if (seq === requestSeq.current) setLoading(false); });

        return () => controller.abort();
    }, [initialBrandId, initialCategoryId, search]);

    return { options, loading, setSearch };
}

export function useVariantModelFetcher(
    initialBrandId: string,
    initialParentModelId: string,
) {
    const [search, setSearch] = useState("");
    const [options, setOptions] = useState<Model[]>([]);
    const [loading, setLoading] = useState(false);
    const requestSeq = useRef(0);
    const cache = useRef(new Map<string, Model[]>());

    useEffect(() => {
        if (initialParentModelId === "all") {
            setOptions([]);
            return;
        }

        const cacheKey = JSON.stringify({ brandId: initialBrandId, parentModelId: initialParentModelId, search: search.trim() });
        const cached = cache.current.get(cacheKey);
        if (cached) { setOptions(cached); return; }

        const controller = new AbortController();
        const seq = requestSeq.current + 1;
        requestSeq.current = seq;
        setLoading(true);

        void getModels({
            brandId: initialBrandId !== "all" ? initialBrandId : undefined,
            variantModelId: initialParentModelId,
            search: search || undefined,
            page: 1, limit: 50,
        }, { signal: controller.signal })
            .then((response) => {
                if (controller.signal.aborted || seq !== requestSeq.current) return;
                const items = parseAdminResponse<Model>(response).items;
                cache.current.set(cacheKey, items);
                setOptions(items);
            })
            .catch((error) => {
                if (!(error instanceof Error && error.name === "AbortError")) setOptions([]);
            })
            .finally(() => { if (seq === requestSeq.current) setLoading(false); });

        return () => controller.abort();
    }, [initialBrandId, initialParentModelId, search]);

    return { options, loading, setSearch };
}
