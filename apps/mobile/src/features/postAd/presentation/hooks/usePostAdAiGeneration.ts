import { useState, useCallback } from 'react';
import { MAX_AD_TITLE_CHARS, MAX_AD_DESCRIPTION_CHARS } from '@esparex/contracts';
import { apiClient } from '../../../../infrastructure/api/apiClient';

interface AiContextParams {
  category?: string;
  brand?: string;
  model?: string;
  condition?: string;
  workingParts?: string[];
}

export const usePostAdAiGeneration = () => {
  const [isGenerating, setIsGenerating] = useState<'title' | 'description' | null>(null);

  const generateContent = useCallback(
    async (
      targetField: 'title' | 'description',
      params: AiContextParams
    ): Promise<string> => {
      setIsGenerating(targetField);
      const categoryName = params.category || 'Device';
      const brandName = params.brand || '';
      const modelName = params.model || '';
      const condLabel =
        params.condition === 'power_on'
          ? 'Working'
          : params.condition === 'power_off'
          ? 'For Parts / Defective'
          : '';
      const partsText = (params.workingParts || []).join(', ');

      try {
        const response = await apiClient.post<{
          data?: { title?: string; description?: string };
          title?: string;
          description?: string;
        }>('/ai/generate', {
          type: 'generate',
          context: {
            category: categoryName,
            brand: brandName,
            model: modelName,
            condition: params.condition || 'device',
            powerStatus: params.condition === 'power_on' ? 'On' : params.condition === 'power_off' ? 'Off' : undefined,
            workingParts: partsText,
            targetField,
          },
        });

        const output = response.data || response;
        if (targetField === 'title' && output.title) {
          return output.title.slice(0, MAX_AD_TITLE_CHARS);
        }
        if (targetField === 'description' && output.description) {
          return output.description.slice(0, MAX_AD_DESCRIPTION_CHARS);
        }
      } catch {
        // Safe instant fallback generation when network or AI quota is unavailable
      } finally {
        setIsGenerating(null);
      }

      // Fallback deterministic text generation
      if (targetField === 'title') {
        const titleParts = [brandName, modelName, categoryName, condLabel].filter(Boolean);
        const fallbackTitle =
          titleParts.length > 0 ? titleParts.join(' ') : `${categoryName} for Sale`;
        return fallbackTitle.slice(0, MAX_AD_TITLE_CHARS);
      } else {
        const descParts = [
          [brandName, modelName, categoryName].filter(Boolean).join(' ') + ' available for sale.',
          condLabel ? `Condition: ${condLabel}.` : '',
          partsText ? `Working / available spare parts: ${partsText}.` : '',
          'Original and genuine item listed on Esparex marketplace.',
        ].filter(Boolean);
        return descParts.join(' ').slice(0, MAX_AD_DESCRIPTION_CHARS);
      }
    },
    []
  );

  return {
    generateContent,
    isGenerating,
  };
};
