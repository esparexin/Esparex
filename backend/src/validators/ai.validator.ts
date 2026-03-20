import { z } from 'zod';

const nonEmptyString = z.preprocess(
    (value) => (typeof value === 'string' ? value.trim() : value),
    z.string().min(1)
);

export const aiGenerateSchema = z
    .object({
        type: z.enum(['identify', 'generate', 'moderate']),
        context: z
            .object({
                text: nonEmptyString.optional(),
                image: nonEmptyString.optional(),
                brand: nonEmptyString.optional(),
                model: nonEmptyString.optional(),
                power: nonEmptyString.optional(),
                spareParts: z.union([nonEmptyString, z.array(nonEmptyString)]).optional(),
            })
            .passthrough()
            .optional(),
        image: nonEmptyString.optional(),
    })
    .superRefine((payload, ctx) => {
        const context = payload.context || {};
        const contextText = typeof context.text === 'string' ? context.text.trim() : '';
        const contextImage = typeof context.image === 'string' ? context.image.trim() : '';
        const rootImage = typeof payload.image === 'string' ? payload.image.trim() : '';
        const hasImage = rootImage.length > 0 || contextImage.length > 0;
        const hasText = contextText.length > 0;

        if (payload.type === 'identify' && !hasImage && !hasText) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['image'],
                message: 'Image or context text is required for identify',
            });
        }

        if (payload.type === 'moderate' && !hasImage && !hasText) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['context', 'text'],
                message: 'Moderation requires text or image',
            });
        }
    });
