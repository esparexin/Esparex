import { useState, useEffect } from 'react';
import {
  CatalogDependentsService,
  type CatalogBrand,
  type CatalogModel,
  type CatalogSparePart,
} from '../../application/CatalogDependentsService';

export type { CatalogBrand, CatalogModel, CatalogSparePart };

export const useCategoryDependents = (categoryId?: string, brandId?: string) => {
  const [brands, setBrands] = useState<CatalogBrand[]>([]);
  const [models, setModels] = useState<CatalogModel[]>([]);
  const [spareParts, setSpareParts] = useState<CatalogSparePart[]>([]);
  const [isLoadingBrands, setIsLoadingBrands] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [isLoadingSpareParts, setIsLoadingSpareParts] = useState(false);

  // Load brands and spare parts when categoryId changes
  useEffect(() => {
    let isMounted = true;

    const loadCategoryData = async () => {
      if (!categoryId) {
        await Promise.resolve();
        if (isMounted) {
          setBrands([]);
          setModels([]);
          setSpareParts([]);
        }
        return;
      }

      setIsLoadingBrands(true);
      setIsLoadingSpareParts(true);
      try {
        const [fetchedBrands, fetchedParts] = await Promise.all([
          CatalogDependentsService.getBrands(categoryId),
          CatalogDependentsService.getSpareParts(categoryId),
        ]);

        if (isMounted) {
          setBrands(fetchedBrands);
          setSpareParts(fetchedParts);
        }
      } catch {
        if (isMounted) {
          setBrands([]);
          setSpareParts([]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingBrands(false);
          setIsLoadingSpareParts(false);
        }
      }
    };

    void loadCategoryData();

    return () => {
      isMounted = false;
    };
  }, [categoryId]);

  // Load models when brandId changes
  useEffect(() => {
    let isMounted = true;

    const loadModels = async () => {
      if (!brandId) {
        await Promise.resolve();
        if (isMounted) {
          setModels([]);
        }
        return;
      }

      setIsLoadingModels(true);
      try {
        const fetchedModels = await CatalogDependentsService.getModels(brandId);
        if (isMounted) {
          setModels(fetchedModels);
        }
      } catch {
        if (isMounted) {
          setModels([]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingModels(false);
        }
      }
    };

    void loadModels();

    return () => {
      isMounted = false;
    };
  }, [brandId]);

  return {
    brands,
    models,
    spareParts,
    isLoadingBrands,
    isLoadingModels,
    isLoadingSpareParts,
  };
};
