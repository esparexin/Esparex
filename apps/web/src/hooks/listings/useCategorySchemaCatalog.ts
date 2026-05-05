"use client";

import { useCallback, useState } from "react";
import type { CategoryFilter } from "@shared";
import logger from "@/lib/logger";
import { getCategorySchema } from "@/lib/api/user/categories";
import type { CategorySchemaType } from "./catalogShared";

export function useCategorySchemaCatalog() {
    const [categorySchema, setCategorySchema] = useState<CategorySchemaType | null>(null);

    const loadCategorySchema = useCallback(async (categoryId: string) => {
        if (!categoryId || !/^[0-9a-f]{24}$/i.test(categoryId)) {
            setCategorySchema(null);
            return;
        }

        try {
            const schema = await getCategorySchema(categoryId);
            if (schema && schema.categoryId && schema.categoryName && Array.isArray(schema.filters)) {
                setCategorySchema({
                    categoryId: String(schema.categoryId),
                    categoryName: String(schema.categoryName),
                    filters: schema.filters as CategoryFilter[],
                });
            } else {
                setCategorySchema(null);
            }
        } catch (error) {
            logger.error(`[Catalog] Failed to load schema for ${categoryId}:`, error);
            setCategorySchema(null);
        }
    }, []);

    return {
        categorySchema,
        loadCategorySchema,
    };
}
