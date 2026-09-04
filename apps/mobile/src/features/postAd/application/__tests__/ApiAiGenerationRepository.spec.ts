import { ApiAiGenerationRepository } from '../ApiAiGenerationRepository';
import { apiClient } from '../../../../infrastructure/api/apiClient';

jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => 'test-uuid-1234'),
}));

jest.mock('../../../../infrastructure/api/apiClient', () => ({
  apiClient: {
    post: jest.fn(),
  },
}));

describe('ApiAiGenerationRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateContent', () => {
    it('successfully extracts title from standard backend envelope response.data.data', async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            title: 'Apple iPhone 13 Pro 128GB Pristine Condition',
          },
        },
      });

      const title = await ApiAiGenerationRepository.generateContent('title', {
        category: 'Smartphones',
        brand: 'Apple',
        model: 'iPhone 13 Pro',
        condition: 'power_on',
      });

      expect(title).toBe('Apple iPhone 13 Pro 128GB Pristine Condition');
      expect(apiClient.post).toHaveBeenCalledWith('/ai/generate', expect.objectContaining({
        type: 'generate',
        context: expect.objectContaining({
          category: 'Smartphones',
          brand: 'Apple',
          model: 'iPhone 13 Pro',
          targetField: 'title',
        }),
      }));
    });

    it('successfully extracts description from standard backend envelope response.data.data', async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            description: 'Original Apple iPhone 13 Pro with working display and battery.',
          },
        },
      });

      const desc = await ApiAiGenerationRepository.generateContent('description', {
        category: 'Smartphones',
        brand: 'Apple',
        model: 'iPhone 13 Pro',
        condition: 'power_on',
      });

      expect(desc).toBe('Original Apple iPhone 13 Pro with working display and battery.');
    });

    it('falls back to deterministic template when API fails or quota exceeded', async () => {
      (apiClient.post as jest.Mock).mockRejectedValueOnce(new Error('Quota exceeded'));

      const fallbackTitle = await ApiAiGenerationRepository.generateContent('title', {
        category: 'Smartphones',
        brand: 'Apple',
        model: 'iPhone 13 Pro',
        condition: 'power_on',
      });

      expect(fallbackTitle).toBe('Apple iPhone 13 Pro Smartphones Working');
    });
  });
});
