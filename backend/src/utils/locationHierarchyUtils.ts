import mongoose from 'mongoose';

/**
 * Builds a canonical location hierarchy path (array of ObjectIds) from self to root.
 * Ensures the path starts with the leaf and ends with the root (or vice versa depending on usage, 
 * but consistently deduped).
 * 
 * NOTE: The implementation below produces [root...parent, self] order.
 */
export const buildHierarchyPath = (
    selfId: mongoose.Types.ObjectId,
    parent?: { _id: mongoose.Types.ObjectId; path?: mongoose.Types.ObjectId[] } | null
): mongoose.Types.ObjectId[] => {
    const chain = Array.isArray(parent?.path) && parent.path.length > 0
        ? [...parent.path, selfId]
        : parent?._id
            ? [parent._id, selfId]
            : [selfId];

    const deduped: mongoose.Types.ObjectId[] = [];
    const seen = new Set<string>();
    for (const item of chain) {
        const key = String(item);
        if (seen.has(key)) continue;
        seen.add(key);
        deduped.push(item);
    }
    return deduped;
};


