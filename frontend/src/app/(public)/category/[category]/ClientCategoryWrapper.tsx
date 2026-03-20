"use client";

import { Suspense } from 'react';
import { BrowseAds } from '@/components/user/BrowseAds';
import type { AdPageResult } from '@/api/user/ads';
import type { Category } from '@/api/user/categories';

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
    // Optional: Validate category exists here if needed using categorySpecificFilters

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
