// backend/src/services/revenueAnalytics.ts
import { RevenueAnalytics } from "../models/RevenueAnalytics";
import { ITransaction } from "../models/Transaction";
import type { ClientSession } from "mongoose";

/**
 * 📈 REVENUE ANALYTICS SERVICE
 * Updates daily metrics upon successful payment confirmation.
 */
export async function recordRevenue(
    tx: ITransaction,
    categoryName?: string,
    session?: ClientSession
): Promise<void> {
    const date = new Date().toISOString().slice(0, 10);
    if (!tx.planSnapshot) return;
    const planType = tx.planSnapshot.type;

    const update: {
        $inc: Record<string, number>;
    } = {
        $inc: {
            totalRevenue: tx.amount,
            totalTransactions: 1,
            [`breakdown.${planType}.revenue`]: tx.amount,
            [`breakdown.${planType}.count`]: 1,
        },
    };

    if (categoryName) {
        update.$inc[`categoryBreakdown.${categoryName}.revenue`] = tx.amount;
        update.$inc[`categoryBreakdown.${categoryName}.count`] = 1;
    }

    await RevenueAnalytics.findOneAndUpdate(
        { date },
        update,
        { upsert: true, session }
    );
}
