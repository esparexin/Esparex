"use client";

import { Suspense } from 'react';
import { Spinner } from "@esparex/ui";
import { BrowseAds } from '@/components/user/BrowseAds';
import type { ListingPageResult } from "@/lib/api/user/listings";
import type { Category } from "@/lib/api/user/categories";

interface ClientCategoryWrapperProps {
    category: string;
    initialResults?: ListingPageResult;
    initialCategories?: Category[];
}

export function ClientCategoryWrapper({
    category,
    initialResults,
    initialCategories,
}: ClientCategoryWrapperProps) {
    // Optional: validate category existence from initialCategories if needed.

    return (
        <Suspense fallback={
            <div className="flex min-h-[400px] items-center justify-center p-8">
                <Spinner size="lg" />
            </div>
        }>
            <BrowseAds
                initialCategory={category}
                initialResults={initialResults}
                initialCategories={initialCategories}
            />
        </Suspense>
    );
}
