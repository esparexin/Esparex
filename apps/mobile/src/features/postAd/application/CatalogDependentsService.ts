import {
  ApiCatalogDependentsRepository,
  type CatalogBrand,
  type CatalogModel,
  type CatalogSparePart,
} from './ApiCatalogDependentsRepository';

export type { CatalogBrand, CatalogModel, CatalogSparePart };

export class CatalogDependentsService {
  public static getBrands(categoryId: string): Promise<CatalogBrand[]> {
    return ApiCatalogDependentsRepository.getBrands(categoryId);
  }

  public static getSpareParts(categoryId: string): Promise<CatalogSparePart[]> {
    return ApiCatalogDependentsRepository.getSpareParts(categoryId);
  }

  public static getModels(brandId: string): Promise<CatalogModel[]> {
    return ApiCatalogDependentsRepository.getModels(brandId);
  }
}
