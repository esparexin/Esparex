/**
 * AI-Generated Spam Detector (Rules-Based Engine)
 * Analyzes string density and structural anomalies characteristic of ChatGPT/LLM spam.
 */
export const detectAiSpam = (text: string): { isAiSpam: boolean; score: number; signals: string[] } => {
    const signals: string[] = [];
    let score = 0;

    if (!text || typeof text !== 'string') {
        return { isAiSpam: false, score, signals };
    }

    const phrases = [
        "as an ai language model",
        "delve into",
        "tapestry of",
        "in conclusion",
        "it's important to note"
    ];

    for (const p of phrases) {
        if (text.toLowerCase().includes(p)) {
            score += 20;
            signals.push(`LLM template phrase detected: "${p}"`);
        }
    }

    const bulletMatches = text.match(/(\*\s|\d\.\s|•\s)/g);
    if (bulletMatches && bulletMatches.length > 10 && text.length < 500) {
        score += 30;
        signals.push('Unnatural list density');
    }

    // Repeated structure patterns (paragraph lengths all identical)
    return {
        isAiSpam: score >= 40,
        score,
        signals
    };
};
