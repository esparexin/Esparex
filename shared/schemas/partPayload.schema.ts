import { z } from 'zod';
const objectId = z.string().regex(/^[0-9a-f]{24}$/i, 'Invalid ObjectId');

const normalizeCondition = (value: string): 'new' | 'used' | 'refurbished' => {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'used') return 'used';
    if (normalized === 'refurbished') return 'refurbished';
    return 'new';
};

const BasePartPayloadSchema = z.object({
    category: z.string().min(1, 'Category is required').optional(),
    categoryId: objectId.optional(),
    deviceType: z.string().optional(),
    partName: z.string().min(3, 'Part Name must be at least 3 characters').max(100),
    description: z.string().min(20, 'Description must be at least 20 characters').max(2000),
    price: z.number().min(0, 'Price must be at least 0'),
    condition: z.string().min(1).transform(normalizeCondition),
    warranty: z.string().optional(),
    stock: z.coerce.number().int().min(1, 'Stock must be at least 1').default(1),
    images: z.array(z.string()).min(1, 'At least one image is required').max(10, 'Maximum 10 images allowed'),
}).strict();

export const PartPayloadSchema = BasePartPayloadSchema.refine(
    (data) => Boolean(data.category || data.categoryId),
    {
        message: 'Category or categoryId is required',
        path: ['category']
    }
);

export const PartialPartPayloadSchema = BasePartPayloadSchema.partial();

export type PartPayload = z.infer<typeof PartPayloadSchema>;
export type PartialPartPayload = z.infer<typeof PartialPartPayloadSchema>;
