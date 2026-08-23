import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../../../infrastructure/api/apiClient';

export interface CatalogBrand {
  id: string;
  name: string;
}

export interface CatalogModel {
  id: string;
  name: string;
}

export interface CatalogSparePart {
  id: string;
  name: string;
  brand?: string;
}

export const useCategoryDependents = (categoryId?: string, brandId?: string) => {
  const [brands, setBrands] = useState<CatalogBrand[]>([]);
  const [models, setModels] = useState<CatalogModel[]>([]);
  const [spareParts, setSpareParts] = useState<CatalogSparePart[]>([]);
  const [isLoadingBrands, setIsLoadingBrands] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [isLoadingSpareParts, setIsLoadingSpareParts] = useState(false);

  // Load brands and spare parts when categoryId changes
  useEffect(() => {
    if (!categoryId) {
      setBrands([]);
      setModels([]);
      setSpareParts([]);
      return;
    }

    let isMounted = true;

    const loadCategoryData = async () => {
      setIsLoadingBrands(true);
      setIsLoadingSpareParts(true);
      try {
        const [brandsRes, partsRes] = await Promise.all([
          apiClient.get<{ data?: any[] }>(`/brands?categoryId=${categoryId}`).catch(() => ({ data: [] })),
          apiClient.get<{ data?: any[] }>(`/spare-parts?categoryId=${categoryId}`).catch(() => ({ data: [] })),
        ]);

        if (isMounted) {
          const rawBrands = Array.isArray(brandsRes.data) ? brandsRes.data : Array.isArray(brandsRes) ? brandsRes : [];
          setBrands(rawBrands.map((b: any) => ({ id: b._id || b.id || b.name, name: b.name })));

          const rawParts = Array.isArray(partsRes.data) ? partsRes.data : Array.isArray(partsRes) ? partsRes : [];
          setSpareParts(rawParts.map((p: any) => ({ id: p._id || p.id || p.name, name: p.name, brand: p.brand })));
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
    if (!brandId) {
      setModels([]);
      return;
    }

    let isMounted = true;

    const loadModels = async () => {
      setIsLoadingModels(true);
      try {
        const modelsRes = await apiClient.get<{ data?: any[] }>(`/models?brandId=${brandId}`).catch(() => ({ data: [] }));
        if (isMounted) {
          const rawModels = Array.isArray(modelsRes.data) ? modelsRes.data : Array.isArray(modelsRes) ? modelsRes : [];
          setModels(rawModels.map((m: any) => ({ id: m._id || m.id || m.name, name: m.name })));
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
