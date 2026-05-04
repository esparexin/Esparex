"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordRevenue = recordRevenue;
// backend/src/services/revenueAnalytics.ts
const RevenueAnalytics_1 = require("@core/models/RevenueAnalytics");
/**
 * 📈 REVENUE ANALYTICS SERVICE
 * Updates daily metrics upon successful payment confirmation.
 */
async function recordRevenue(tx, categoryName, session) {
    const date = new Date().toISOString().slice(0, 10);
    if (!tx.planSnapshot)
        return;
    const planType = tx.planSnapshot.type;
    const update = {
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
    await RevenueAnalytics_1.RevenueAnalytics.findOneAndUpdate({ date }, update, { upsert: true, session });
}
//# sourceMappingURL=RevenueAnalytics.js.map