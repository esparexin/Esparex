import { useQuery } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';
import { getCategories} from "@/lib/api/user/categories";

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


