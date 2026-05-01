import { apiClient } from "@/lib/api/client";
import {
    API_ROUTES,
} from "../routes";
import { toApiResult } from "@/lib/api/result";
import type { Category } from "@/schemas";
import { fetchUserApiJson, type ServerFetchOptions } from "./server";

export type { Category };

/**
 * Get all categories
 * Returns FINAL unwrapped data (Category[])
 */
export const getCategories = async (options?: { fetchOptions?: ServerFetchOptions }): Promise<Category[]> => {
    const { data: result } =
        typeof window === 'undefined'
            ? await toApiResult<Category[]>(
                Promise.resolve(fetchUserApiJson(API_ROUTES.USER.CATEGORIES, options?.fetchOptions))
            )
            : await toApiResult<Category[]>(
                apiClient.get(API_ROUTES.USER.CATEGORIES)
            );

    return result ?? [];
};

/**
 * Get single category by ID or slug.
 * Returns FINAL unwrapped data (Category | null).
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
