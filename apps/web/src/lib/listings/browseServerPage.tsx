import { Suspense, type ComponentType } from "react";
import type { Metadata } from "next";

import { getCategories, type Category } from "@/lib/api/user/categories";

export const BROWSE_REVALIDATE_SECONDS = 60;
const CATEGORY_REVALIDATE_SECONDS = 3600;

export type BrowseSearchParams = {
    [key: string]: string | string[] | undefined;
};

export interface BrowsePageProps {
    searchParams: Promise<BrowseSearchParams>;
}

interface BrowseMetadataConfig {
    title: string;
    description: string;
    canonicalUrl: string;
    noIndexFilterKeys: string[];
}

type BrowseFetchOptions = {
    fetchOptions?: RequestInit & { next?: { revalidate?: number } };
};

interface LoadBrowsePageDataOptions<TFilters, TResult> {
    searchParams: Promise<BrowseSearchParams>;
    buildFilters: (params: { query?: string; category?: string }) => TFilters;
    fetchPage: (filters: TFilters, options?: BrowseFetchOptions) => Promise<TResult>;
}

interface BrowsePageData<TResult> {
    query?: string;
    category?: string;
    initialResults: TResult;
    initialCategories: Category[];
}

interface BrowseClientComponentProps<TResult> {
    initialCategory?: string;
    initialSearchQuery?: string;
    initialResults?: TResult;
    initialCategories?: Category[];
}

const extractStringParam = (value: string | string[] | undefined): string | undefined =>
    typeof value === "string" ? value : undefined;

export function buildStandardCategorySearchFilters<
    TFilters extends { page?: number; limit?: number; search?: string; categoryId?: string },
>({ query, category }: { query?: string; category?: string }): TFilters {
    return {
        page: 1,
        limit: 20,
        ...(query ? { search: query } : {}),
        ...(category ? { categoryId: category } : {}),
    } as TFilters;
}

export async function buildBrowsePageMetadata(
    { searchParams }: BrowsePageProps,
    config: BrowseMetadataConfig,
): Promise<Metadata> {
    const params = await searchParams;
    const hasFilters = Object.keys(params).some((key) =>
        config.noIndexFilterKeys.includes(key),
    );

    return {
        title: config.title,
        description: config.description,
        alternates: { canonical: config.canonicalUrl },
        robots: {
            index: !hasFilters,
            follow: true,
        },
    };
}

export async function loadBrowsePageData<TFilters, TResult>({
    searchParams,
    buildFilters,
    fetchPage,
}: LoadBrowsePageDataOptions<TFilters, TResult>): Promise<BrowsePageData<TResult>> {
    const params = await searchParams;
    const query = extractStringParam(params.q);
    const category = extractStringParam(params.category);

    const [initialResults, initialCategories] = await Promise.all([
        fetchPage(buildFilters({ query, category }), {
            fetchOptions: { next: { revalidate: BROWSE_REVALIDATE_SECONDS } },
        }),
        getCategories({
            fetchOptions: { next: { revalidate: CATEGORY_REVALIDATE_SECONDS } },
        }),
    ]);

    return {
        query,
        category,
        initialResults,
        initialCategories,
    };
}

export function renderBrowsePage<TResult>(
    Component: ComponentType<BrowseClientComponentProps<TResult>>,
    data: BrowsePageData<TResult>,
) {
    return (
        <Suspense fallback={null}>
            <Component
                initialCategory={data.category}
                initialSearchQuery={data.query}
                initialResults={data.initialResults}
                initialCategories={data.initialCategories}
            />
        </Suspense>
    );
}
