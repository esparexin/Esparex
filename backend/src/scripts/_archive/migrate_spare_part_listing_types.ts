import mongoose, { type Types } from 'mongoose';
import { type AnyBulkWriteOperation } from 'mongodb';
import { connectDB } from '../../config/db';
import SparePart from '../../models/SparePart';
import logger from '../../utils/logger';
import { LISTING_TYPE, LISTING_TYPE_VALUES, type ListingTypeValue } from '../../../../shared/enums/listingType';

type ScriptMode = 'dry-run' | 'apply';

type RawSparePartDoc = {
    _id: Types.ObjectId;
    name?: unknown;
    listingType?: unknown;
    type?: unknown;
};

type NormalizationResult = {
    listingType: ListingTypeValue[];
    reason:
        | 'legacy-listingtype-value'
        | 'missing-listingtype-primary'
        | 'missing-listingtype-secondary'
        | 'missing-listingtype-default'
        | 'invalid-listingtype-default';
};

const VALID_LISTING_TYPES = new Set<ListingTypeValue>(LISTING_TYPE_VALUES);
const LEGACY_LISTING_TYPE_MAP: Record<string, ListingTypeValue> = {
    postad: LISTING_TYPE.AD,
    postservice: LISTING_TYPE.SERVICE,
    postsparepart: LISTING_TYPE.SPARE_PART,
};

const isApply = process.argv.includes('--apply');

const normalizeSingleListingType = (value: unknown): ListingTypeValue | null => {
    if (typeof value !== 'string') return null;
    const legacyMapped = LEGACY_LISTING_TYPE_MAP[value];
    if (legacyMapped) {
        return legacyMapped;
    }
    return VALID_LISTING_TYPES.has(value as ListingTypeValue) ? (value as ListingTypeValue) : null;
};

const dedupeListingTypes = (values: ListingTypeValue[]): ListingTypeValue[] => {
    const seen = new Set<ListingTypeValue>();
    const deduped: ListingTypeValue[] = [];
    for (const value of values) {
        if (seen.has(value)) continue;
        seen.add(value);
        deduped.push(value);
    }
    return deduped;
};

const normalizeLegacyTypeFallback = (legacyType: unknown): NormalizationResult => {
    if (legacyType === 'PRIMARY') {
        return {
            listingType: [LISTING_TYPE.AD],
            reason: 'missing-listingtype-primary',
        };
    }
    if (legacyType === 'SECONDARY') {
        return {
            listingType: [LISTING_TYPE.SPARE_PART],
            reason: 'missing-listingtype-secondary',
        };
    }
    return {
        listingType: [LISTING_TYPE.SPARE_PART],
        reason: 'missing-listingtype-default',
    };
};

const normalizeListingType = (doc: RawSparePartDoc): NormalizationResult | null => {
    const source = doc.listingType;

    if (Array.isArray(source)) {
        const normalized = dedupeListingTypes(source.map(normalizeSingleListingType).filter((value): value is ListingTypeValue => value !== null));
        if (normalized.length === 0) {
            return {
                listingType: [LISTING_TYPE.SPARE_PART],
                reason: 'invalid-listingtype-default',
            };
        }

        const sourceStrings = source.filter((value): value is string => typeof value === 'string');
        const needsUpdate =
            sourceStrings.length !== normalized.length ||
            normalized.some((value, index) => sourceStrings[index] !== value);

        return needsUpdate
            ? {
                listingType: normalized,
                reason: 'legacy-listingtype-value',
            }
            : null;
    }

    const singleValue = normalizeSingleListingType(source);
    if (singleValue) {
        return {
            listingType: [singleValue],
            reason: 'legacy-listingtype-value',
        };
    }

    if (source === undefined || source === null) {
        return normalizeLegacyTypeFallback(doc.type);
    }

    return {
        listingType: [LISTING_TYPE.SPARE_PART],
        reason: 'invalid-listingtype-default',
    };
};

async function migrateSparePartListingTypes() {
    const mode: ScriptMode = isApply ? 'apply' : 'dry-run';
    try {
        logger.info('[SparePartListingTypeBackfill] Starting', { mode });
        await connectDB();

        const collection = SparePart.collection;
        const cursor = collection.find(
            {
                isDeleted: { $ne: true },
                $or: [
                    { listingType: { $exists: false } },
                    { listingType: null },
                    { listingType: { $type: 'string' } },
                    { listingType: { $in: ['postad', 'postservice', 'postsparepart'] } },
                    { type: { $in: ['PRIMARY', 'SECONDARY'] } },
                ],
            },
            {
                projection: { _id: 1, name: 1, listingType: 1, type: 1 },
            }
        );

        let scanned = 0;
        let wouldUpdate = 0;
        let updated = 0;
        const reasons: Record<NormalizationResult['reason'], number> = {
            'legacy-listingtype-value': 0,
            'missing-listingtype-primary': 0,
            'missing-listingtype-secondary': 0,
            'missing-listingtype-default': 0,
            'invalid-listingtype-default': 0,
        };
        const samples: Array<{ id: string; name: string; before: unknown; after: ListingTypeValue[]; reason: string }> = [];
        let operations: AnyBulkWriteOperation[] = [];

        for await (const doc of cursor as AsyncIterable<RawSparePartDoc>) {
            scanned++;
            const normalized = normalizeListingType(doc);
            if (!normalized) {
                continue;
            }

            reasons[normalized.reason]++;
            wouldUpdate++;
            if (samples.length < 20) {
                samples.push({
                    id: String(doc._id),
                    name: typeof doc.name === 'string' ? doc.name : '',
                    before: doc.listingType ?? null,
                    after: normalized.listingType,
                    reason: normalized.reason,
                });
            }

            if (!isApply) {
                continue;
            }

            operations.push({
                updateOne: {
                    filter: { _id: doc._id },
                    update: { $set: { listingType: normalized.listingType } },
                },
            });

            if (operations.length >= 250) {
                const result = await collection.bulkWrite(operations, { ordered: false });
                updated += result.modifiedCount;
                operations = [];
            }
        }

        if (isApply && operations.length > 0) {
            const result = await collection.bulkWrite(operations, { ordered: false });
            updated += result.modifiedCount;
        }

        logger.info('[SparePartListingTypeBackfill] Summary', {
            mode,
            scanned,
            wouldUpdate,
            updated,
            reasons,
            samples,
        });

        if (!isApply && wouldUpdate > 0) {
            logger.info('[SparePartListingTypeBackfill] Re-run with --apply to commit changes');
        }
    } catch (error) {
        logger.error('[SparePartListingTypeBackfill] Failed', {
            error: error instanceof Error ? error.message : String(error),
        });
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
}

if (require.main === module) {
    void migrateSparePartListingTypes();
}

export default migrateSparePartListingTypes;
