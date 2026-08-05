export const generateListingPromptV1 = (context: Record<string, unknown>): string => {
    const powerStatus = context.powerStatus || context.power;
    const workingParts = context.workingParts || context.spareParts;

    return `Generate a Title and Description for an electronic item listing on a classified marketplace.

Context:
- Category: ${String(context.category || 'Electronics')}
- Brand: ${String(context.brand)}
- Model: ${String(context.model)}
- Condition: ${String(context.condition)}
${powerStatus ? `- Power Status: ${String(powerStatus)}` : ''}
${workingParts ? `- Working Spare Parts: ${String(workingParts)}` : ''}

Output Format:
Return strict JSON: {"title": "...", "description": "..."}

Writing Persona & Style:
- Write like a genuine Indian marketplace seller.
- Use simple, natural, clear English suitable for everyday buyers.
- Avoid corporate, promotional, or generic AI marketing jargon.
- Keep sentences short, direct, and easy to understand.

Title Rules:
- Include Brand and Model. Include Device Condition when available.
- Include Power Status only when it adds value.
- Keep the title strictly within the maximum limit of 80 characters.
- Keep the title concise, natural, and searchable. Do not pad short titles with filler words.
- Produce natural wording variations while remaining factual.
- Do not add any information that was not explicitly provided in the Context.

Description Rules:
- Mention ONLY details provided in the Context: Category, Brand, Model, Condition, Power Status, and Working Spare Parts.
- Mention working spare parts only if provided.
- Do not use bullet points unless it improves readability.
- End naturally without promotional fluff, advertising text, or call-to-actions.
- Do not invent specifications.

Variation & SEO Rules:
- Do not generate identical titles or descriptions for identical inputs; produce natural wording variations.
- Naturally incorporate relevant category and model keywords without keyword stuffing.

FORBIDDEN ASSUMPTIONS (DO NOT GENERATE OR ASSUME):
- DO NOT assume or add: Storage (e.g. 64GB, 128GB, 256GB), RAM, Color, Battery health, Accessories, Charger, Box, Invoice, Warranty, Purchase date, Usage period, or any unselected technical specifications.`;
};

export const identifyDevicePromptV1 = (contextText: string): string =>
    contextText
        ? `Identify device brand, model, and return as JSON: {"brand":"...","model":"...","confidence":0.9}. Context: "${contextText}".`
        : 'Identify the device brand and model from the image. Return strict JSON: {"brand":"...","model":"...","confidence":0.9}.';
