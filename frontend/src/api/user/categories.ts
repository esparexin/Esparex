import { apiClient } from "@/lib/api/client";
import {
    API_ROUTES,
    API_V1_BASE_PATH,
    DEFAULT_LOCAL_API_ORIGIN,
} from "../routes";
import { toApiResult } from "@/lib/api/result";
import type { Category } from "@/schemas";

export type { Category };

type ServerFetchOptions = RequestInit & {
    next?: {
        revalidate?: number;
        tags?: string[];
    };
};

const USER_API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || `${DEFAULT_LOCAL_API_ORIGIN}${API_V1_BASE_PATH}`;

const buildUserApiUrl = (endpoint: string): string => {
    const base = USER_API_BASE_URL.endsWith('/') ? USER_API_BASE_URL : `${USER_API_BASE_URL}/`;
    return new URL(endpoint.replace(/^\//, ''), base).toString();
};

/**
 * Get all categories
 * Returns FINAL unwrapped data (Category[])
 */
export const getCategories = async (options?: { fetchOptions?: ServerFetchOptions }): Promise<Category[]> => {
    const { data: result } =
        typeof window === 'undefined'
            ? await toApiResult<Category[]>(
                fetch(buildUserApiUrl(API_ROUTES.USER.CATEGORIES), {
                    method: 'GET',
                    headers: {
                        Accept: 'application/json',
                        ...((options?.fetchOptions?.headers as Record<string, string> | undefined) ?? {}),
                    },
                    ...options?.fetchOptions,
                }).then((response) => {
                    if (!response.ok) {
                        throw new Error(`Failed to load categories: ${response.status}`);
                    }
                    return response.json().catch(() => null);
                })
            )
            : await toApiResult<Category[]>(
                apiClient.get(API_ROUTES.USER.CATEGORIES)
            );

    return result ?? [];
};

/**
 * Get single category by ID or slug
 * Returns FINAL unwrapped data (Category | null)
 */
export const getCategoryById = async (
    id: string
): Promise<Category | null> => {
    const { data } = await toApiResult<Category>(
        apiClient.get(API_ROUTES.USER.CATEGORY_DETAIL(id))
    );
    return data;
};

export const getCategorySchema = async (categoryId: string): Promise<Record<string, unknown> | null> => {
    if (!/^[0-9a-f]{24}$/i.test(categoryId)) {
        return null;
    }
    const { data } = await toApiResult<Record<string, unknown>>(
        apiClient.get(API_ROUTES.USER.CATEGORY_SCHEMA(categoryId), { silent: true })
    );
    return data;
};
