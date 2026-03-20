import { Schema, Document, Model } from 'mongoose';
import { getUserConnection } from '../config/db';

export interface ICityPopularity extends Document {
    city: string;
    state: string;
    score: number;
    rank: number;
    signals: {
        searches: number;
        ads: number;
        alerts: number;
        detects: number;
        autoDetects?: number;
    };
    updatedAt: Date;
}

const CityPopularitySchema: Schema = new Schema(
    {
        city: { type: String, required: true },
        state: { type: String, required: true },
        score: { type: Number, required: true }, // Index for fast sorting
        rank: { type: Number, required: true },
        signals: {
            searches: { type: Number, default: 0 },
            ads: { type: Number, default: 0 },
            alerts: { type: Number, default: 0 },
            // Canonical detection signal.
            detects: { type: Number, default: 0 },
            // Legacy compatibility signal (read/write bridge during transition).
            // Accepted until 2026-05-01 per schema changelog deprecation timeline.
            autoDetects: { type: Number, default: 0 }
        }
    },
    { timestamps: { createdAt: true, updatedAt: true } }
);

// Compound index for uniqueness
/* -------------------------------------------------------------------------- */
/* Indexes (Explicitly Named)                                                 */
/* -------------------------------------------------------------------------- */

CityPopularitySchema.index({ score: -1 }, { name: 'citypop_score_idx' });
CityPopularitySchema.index({ city: 1, state: 1 }, { name: 'citypop_city_state_unique_idx', unique: true });

const toNonNegativeNumber = (value: unknown): number | undefined => {
    if (typeof value !== 'number' || !Number.isFinite(value)) return undefined;
    return value < 0 ? 0 : value;
};

// Bridge canonical and legacy fields without requiring immediate migration.
CityPopularitySchema.pre('validate', function () {
    const doc = this as unknown as {
        signals?: { detects?: number; autoDetects?: number };
    };

    const signals = doc.signals;
    if (!signals) return;

    const detects = toNonNegativeNumber(signals.detects);
    const autoDetects = toNonNegativeNumber(signals.autoDetects);

    if (detects === undefined && autoDetects === undefined) return;

    if (detects === undefined && autoDetects !== undefined) {
        signals.detects = autoDetects;
        signals.autoDetects = autoDetects;
        return;
    }

    if (detects !== undefined && autoDetects === undefined) {
        signals.detects = detects;
        signals.autoDetects = detects;
        return;
    }

    if (detects === autoDetects) return;

    // New-document defaults can produce detects=0 with legacy autoDetects>0.
    if (detects === 0 && autoDetects !== undefined && autoDetects > 0) {
        signals.detects = autoDetects;
        signals.autoDetects = autoDetects;
        return;
    }

    // Canonical field wins when both are present and disagree.
    signals.autoDetects = detects;
});

// toJSON Transform - Convert _id to id
CityPopularitySchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (_doc, ret) {
        const json = ret as Record<string, unknown> & {
            _id?: { toString(): string };
            id?: string;
            signals?: { detects?: number; autoDetects?: number };
        };

        if (json.signals) {
            const detects = toNonNegativeNumber(json.signals.detects);
            const autoDetects = toNonNegativeNumber(json.signals.autoDetects);
            const normalized = detects ?? autoDetects ?? 0;
            json.signals.detects = normalized;
            json.signals.autoDetects = normalized;
        }

        json.id = json._id?.toString();
        delete json._id;
        return json;
    }
});

const CityPopularity: Model<ICityPopularity> =
    getUserConnection().models.CityPopularity ||
    getUserConnection().model<ICityPopularity>('CityPopularity', CityPopularitySchema);

export default CityPopularity;
