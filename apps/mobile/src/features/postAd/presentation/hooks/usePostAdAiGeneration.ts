import { useState, useCallback } from 'react';
import {
  AiGenerationService,
  type AiContextParams,
} from '../../application/AiGenerationService';

export type { AiContextParams };

export const usePostAdAiGeneration = () => {
  const [isGenerating, setIsGenerating] = useState<'title' | 'description' | null>(null);

  const generateContent = useCallback(
    async (
      targetField: 'title' | 'description',
      params: AiContextParams
    ): Promise<string> => {
      setIsGenerating(targetField);
      try {
        return await AiGenerationService.generateContent(targetField, params);
      } finally {
        setIsGenerating(null);
      }
    },
    []
  );

  return {
    generateContent,
    isGenerating,
  };
};

