import { useQuery } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';
import { getCategories, getCategoryById, getCategorySchema } from '@/api/user/categories';

/**
 * Hook to fetch all top-level categories
 */
export const useCategoriesQuery = () => {
    return useQuery({
        queryKey: queryKeys.categories.lists(),
        queryFn: () => getCategories(),
        staleTime: 60 * 60 * 1000, // 1 hour (categories rarely change)
    });
};

/**
 * Hook to fetch a single category by ID or slug
 */
export const useCategoryDetailQuery = (id: string | undefined) => {
    return useQuery({
        queryKey: queryKeys.categories.detail(id!),
        queryFn: () => getCategoryById(id!),
        enabled: !!id,
        staleTime: 30 * 60 * 1000, // 30 mins
    });
};

/**
 * Hook to fetch dynamic schema for a category
 */
export const useCategorySchemaQuery = (categoryId: string | undefined) => {
    return useQuery({
        queryKey: queryKeys.categories.schema(categoryId!),
        queryFn: () => getCategorySchema(categoryId!),
        enabled: !!categoryId,
        staleTime: 60 * 60 * 1000, // 1 hour
    });
};
