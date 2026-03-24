// backend/src/models/RevenueAnalytics.ts
import { Schema, Document } from "mongoose";
import { getAdminConnection } from "../config/db";
import type { Model } from "mongoose";

export interface IRevenueAnalytics extends Document {
    date: string; // YYYY-MM-DD
    totalRevenue: number;
    totalTransactions: number;
    breakdown: {
        AD_PACK: { revenue: number; count: number };
        SPOTLIGHT: { revenue: number; count: number };
        SMART_ALERT: { revenue: number; count: number };
    };
    categoryBreakdown?: Map<string, { revenue: number; count: number }>;
}

const RevenueAnalyticsSchema = new Schema<IRevenueAnalytics>(
    {
        date: { type: String }, // YYYY-MM-DD

        totalRevenue: { type: Number, default: 0 },
        totalTransactions: { type: Number, default: 0 },

        breakdown: {
            AD_PACK: {
                revenue: { type: Number, default: 0 },
                count: { type: Number, default: 0 },
            },
            SPOTLIGHT: {
                revenue: { type: Number, default: 0 },
                count: { type: Number, default: 0 },
            },
            SMART_ALERT: {
                revenue: { type: Number, default: 0 },
                count: { type: Number, default: 0 },
            },
        },
        categoryBreakdown: {
            type: Map,
            of: new Schema({
                revenue: { type: Number, default: 0 },
                count: { type: Number, default: 0 }
            }, { _id: false }),
            default: {}
        }
    },
    { timestamps: true }
);

/* -------------------------------------------------------------------------- */
/* Indexes (Explicitly Named)                                                 */
/* -------------------------------------------------------------------------- */

RevenueAnalyticsSchema.index({ date: 1 }, { name: 'idx_revenueanalytics_date_unique_idx', unique: true });

const connection = getAdminConnection();
export const RevenueAnalytics: Model<IRevenueAnalytics> =
    (connection.models.RevenueAnalytics as Model<IRevenueAnalytics>) ||
    connection.model<IRevenueAnalytics>("RevenueAnalytics", RevenueAnalyticsSchema);
// toJSON Transform - Convert _id to id
RevenueAnalyticsSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (_doc: unknown, ret: unknown) {
        const json = ret as unknown as Record<string, unknown> & { _id?: { toString(): string }; id?: string };
        json.id = json._id?.toString();
        delete json._id;
        return json;
    }
});

export default RevenueAnalytics;
