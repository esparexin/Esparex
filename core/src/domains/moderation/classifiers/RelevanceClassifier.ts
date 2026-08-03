/**
 * Relevance Classifier (PR 4)
 *
 * Compares listing category and title against detected vision object labels.
 */
export class RelevanceClassifier {
    classifyRelevance(title: string, category: string, detectedLabels: string[]): {
        isRelevant: boolean;
        relevanceScore: number;
        matchedLabels: string[];
    } {
        if (!detectedLabels || detectedLabels.length === 0) {
            return { isRelevant: true, relevanceScore: 1.0, matchedLabels: [] };
        }

        const normalizedTitle = (title || '').toLowerCase();
        const normalizedCategory = (category || '').toLowerCase();

        const matchedLabels = detectedLabels.filter((label) => {
            const l = label.toLowerCase();
            return normalizedTitle.includes(l) || normalizedCategory.includes(l);
        });

        const relevanceScore = detectedLabels.length > 0 ? matchedLabels.length / detectedLabels.length : 1.0;

        return {
            isRelevant: matchedLabels.length > 0 || relevanceScore >= 0.2,
            relevanceScore,
            matchedLabels,
        };
    }
}
