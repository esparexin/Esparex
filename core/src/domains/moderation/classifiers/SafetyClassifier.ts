/**
 * Safety Classifier (PR 4)
 *
 * Evaluates explicit adult, nudity, violence, weapons, and gore signals.
 */
import { ModerationSignalDTO } from '@esparex/contracts';
import { ImageModerationResponse } from '../../../services/ai/moderation/types';

export class SafetyClassifier {
    classify(response: ImageModerationResponse): {
        adultScore: number;
        violenceScore: number;
        racyScore: number;
        goreScore: number;
        signals: ModerationSignalDTO[];
    } {
        const signals: ModerationSignalDTO[] = [
            {
                classifier: 'SafetyClassifier',
                score: Math.max(response.adultScore, response.violenceScore, response.goreScore),
                details: {
                    adult: response.adultScore,
                    violence: response.violenceScore,
                    racy: response.racyScore,
                    gore: response.goreScore,
                },
            },
        ];

        return {
            adultScore: response.adultScore,
            violenceScore: response.violenceScore,
            racyScore: response.racyScore,
            goreScore: response.goreScore,
            signals,
        };
    }
}
