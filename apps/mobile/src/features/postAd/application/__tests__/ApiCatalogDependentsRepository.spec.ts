import { ApiCatalogDependentsRepository } from '../ApiCatalogDependentsRepository';
import { apiClient } from '../../../../infrastructure/api/apiClient';

jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => 'test-uuid-1234'),
}));

jest.mock('../../../../infrastructure/api/apiClient', () => ({
  apiClient: {
    get: jest.fn(),
  },
}));

describe('ApiCatalogDependentsRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getBrands', () => {
    it('calls /catalog/brands with encoded categoryId and maps items', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        data: {
          data: [
            { _id: 'b1', name: 'Apple' },
            { id: 'b2', name: 'Samsung' },
          ],
        },
      });

      const brands = await ApiCatalogDependentsRepository.getBrands('cat 123');

      expect(apiClient.get).toHaveBeenCalledWith('/catalog/brands?categoryId=cat%20123');
      expect(brands).toEqual([
        { id: 'b1', name: 'Apple' },
        { id: 'b2', name: 'Samsung' },
      ]);
    });

    it('handles network error gracefully and returns empty array', async () => {
      (apiClient.get as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const brands = await ApiCatalogDependentsRepository.getBrands('cat1');

      expect(brands).toEqual([]);
    });
  });

  describe('getSpareParts', () => {
    it('calls /catalog/spare-parts with encoded categoryId and maps items', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        data: {
          data: [
            { _id: 'p1', name: 'OLED Display', brand: 'Apple' },
          ],
        },
      });

      const parts = await ApiCatalogDependentsRepository.getSpareParts('cat 123');

      expect(apiClient.get).toHaveBeenCalledWith('/catalog/spare-parts?categoryId=cat%20123');
      expect(parts).toEqual([
        { id: 'p1', name: 'OLED Display', brand: 'Apple' },
      ]);
    });
  });

  describe('getModels', () => {
    it('calls /catalog/models with encoded brandId and maps items', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        data: {
          data: [
            { _id: 'm1', name: 'iPhone 13 Pro' },
          ],
        },
      });

      const models = await ApiCatalogDependentsRepository.getModels('brand 456');

      expect(apiClient.get).toHaveBeenCalledWith('/catalog/models?brandId=brand%20456');
      expect(models).toEqual([
        { id: 'm1', name: 'iPhone 13 Pro' },
      ]);
    });
  });
});
