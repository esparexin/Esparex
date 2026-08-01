import { useState, useEffect, useCallback } from 'react';
import { services } from '../../../../bootstrap';
import { CategoryOption } from '../../domain/CategoryOption';

export interface UseCategoriesResult {
  categories: readonly CategoryOption[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * useCategories — presentation hook for fetching ad categories.
 *
 * Calls CategoryService from the bootstrap services, managing React state.
 * Accurately surfaces empty arrays or errors from the backend.
 */
export const useCategories = (): UseCategoriesResult => {
  const [categories, setCategories] = useState<readonly CategoryOption[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await services.categoryService.getCategories();
      setCategories(data);
    } catch (err) {
      const normalised = err instanceof Error ? err : new Error('Failed to load categories');
      setError(normalised);
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    isLoading,
    error,
    refetch: fetchCategories,
  };
};
