import {
  ApiAiGenerationRepository,
  type AiContextParams,
} from './ApiAiGenerationRepository';

export type { AiContextParams };

export class AiGenerationService {
  public static generateContent(
    targetField: 'title' | 'description',
    params: AiContextParams
  ): Promise<string> {
    return ApiAiGenerationRepository.generateContent(targetField, params);
  }
}
