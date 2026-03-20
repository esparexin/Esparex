interface ToObjectCapable {
    toObject: (options?: { virtuals?: boolean; versionKey?: boolean }) => Record<string, unknown>;
}

interface ObjectIdLike {
    constructor?: { name?: string };
    toString: () => string;
}

const isObjectRecord = (value: unknown): value is Record<string, unknown> => (
    typeof value === 'object' && value !== null && !Array.isArray(value)
);

const isObjectIdLike = (value: unknown): value is ObjectIdLike => (
    isObjectRecord(value)
    && value.constructor?.name === 'ObjectId'
    && typeof value.toString === 'function'
);

/**
 * Converts Mongoose document to plain object with `id` instead of `_id`
 *
 * @param doc - Mongoose document or plain object
 * @returns Plain object with `id` field (string) instead of `_id` (ObjectId)
 *
 * @example
 * const user = await User.findById(userId);
 * res.json(serializeDoc(user)); // { id: "507f1f77...", name: "John" }
 */
export function serializeDoc<T>(doc: T): T {
    if (!doc || typeof doc !== 'object') {
        return doc;
    }

    if (Array.isArray(doc)) {
        return doc.map((item) => serializeDoc(item)) as T;
    }

    if (doc instanceof Date) {
        return doc;
    }

    if (isObjectIdLike(doc)) {
        return doc.toString() as T;
    }

    const docWithObject = doc as unknown as Partial<ToObjectCapable>;
    const obj: unknown = (typeof docWithObject.toObject === 'function')
        ? docWithObject.toObject({ virtuals: true, versionKey: false })
        : (doc as unknown as Record<string, unknown>);

    if (!isObjectRecord(obj)) {
        if (obj instanceof Buffer || isObjectIdLike(obj)) {
            return obj.toString() as T;
        }
        return obj as T;
    }

    const newObj: Record<string, unknown> = {};

    if (obj._id) {
        newObj.id = obj._id.toString();
    } else if (obj.id) {
        newObj.id = obj.id.toString();
    }

    for (const [key, value] of Object.entries(obj)) {
        if (key === '_id' || key === '__v') continue;

        if (value && typeof value === 'object') {
            newObj[key] = serializeDoc(value);
        } else {
            newObj[key] = value;
        }
    }

    return newObj as T;
}

/**
 * Serialize array of documents
 *
 * @param docs - Array of Mongoose documents or plain objects
 * @returns Array of plain objects with `id` fields
 *
 * @example
 * const users = await User.find();
 * res.json(serializeDocs(users));
 */
export function serializeDocs<T>(docs: T[] | null | undefined): T[] {
    if (!Array.isArray(docs)) return [];
    return docs.map((doc) => serializeDoc(doc));
}

/**
 * Serialize paginated response
 *
 * @param data - Object containing docs array and pagination metadata
 * @returns Serialized response with all documents converted
 *
 * @example
 * const result = await Ad.paginate({}, { page: 1, limit: 10 });
 * res.json(serializePaginated(result));
 */
export function serializePaginated<T extends { docs: unknown[] }>(
    data: T | null | undefined
): T | null | undefined {
    if (!data || !data.docs) return data;

    return {
        ...data,
        docs: serializeDocs(data.docs)
    } as T;
}
