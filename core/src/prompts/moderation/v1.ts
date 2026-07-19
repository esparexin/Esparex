export const moderateAdPromptV1 = (contextText: string): string =>
    `Moderate this ad for safety. Return JSON: {"safe": boolean, "reason": string | null}. Content: "${contextText || ''}"`;
