export const generateListingPromptV1 = (context: Record<string, unknown>): string => `Generate a professional and catchy Title and a detailed selling Description for an electronic device listing on a marketplace.
Context:
- Category: ${String(context.category || 'Electronics')}
- Brand: ${String(context.brand)}
- Model: ${String(context.model)}
- Condition: ${String(context.condition)}
${context.workingParts ? `- Working Spare Parts: ${String(context.workingParts)}` : ''}

Rules:
1. Return strict JSON: {"title": "...", "description": "..."}.
2. The Title should be concise (50-70 characters).
3. The Description should be persuasive, highlighting the brand, model, and condition.
4. If working spare parts are provided, mention them as a value-add for the buyer.
5. Provide a realistic title and description based on the context.`;

export const identifyDevicePromptV1 = (contextText: string): string =>
    contextText
        ? `Identify device brand, model, and return as JSON: {"brand":"...","model":"...","confidence":0.9}. Context: "${contextText}".`
        : 'Identify the device brand and model from the image. Return strict JSON: {"brand":"...","model":"...","confidence":0.9}.';
