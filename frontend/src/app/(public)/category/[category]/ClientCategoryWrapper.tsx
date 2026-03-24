"use client";

import { Suspense } from 'react';
import { BrowseAds } from '@/components/user/BrowseAds';
import type { AdPageResult } from "@/lib/api/user/ads";
import type { Category } from "@/lib/api/user/categories";

interface ClientCategoryWrapperProps {
    category: string;
    initialResults?: AdPageResult;
    initialCategories?: Category[];
}

export function ClientCategoryWrapper({
    category,
    initialResults,
    initialCategories,
}: ClientCategoryWrapperProps) {
    // Optional: validate category existence from initialCategories if needed.

    return (
        <Suspense fallback={<div>Loading marketplace...</div>}>
            <BrowseAds
                initialCategory={category}
                initialResults={initialResults}
                initialCategories={initialCategories}
            />
        </Suspense>
    );
}
