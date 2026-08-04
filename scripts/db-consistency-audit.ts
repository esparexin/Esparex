/**
 * Esparex — Monetization DB Consistency Audit
 *
 * Usage:
 *   npx ts-node -P tsconfig.json scripts/db-consistency-audit.ts
 *
 * Compares UserWallet credit fields against summed active Entitlement.remaining
 * values for a sample of users, and checks for downstream record gaps.
 *
 * This is a READ-ONLY script. It makes no writes.
 */

import mongoose from 'mongoose';
import { env } from '../core/src/config/env';

// ─── Model imports (adjust paths if running from a different CWD) ─────────────
import '../core/src/config/db';
import UserWallet from '../core/src/models/UserWallet';
import Entitlement from '../core/src/models/Entitlement';
import UserPlan from '../core/src/models/UserPlan';
import { Transaction } from '../core/src/models/Transaction';
import Invoice from '../core/src/models/Invoice';

// ─── Config ───────────────────────────────────────────────────────────────────
const SAMPLE_SIZE = 50;
const NOW = new Date();

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(label: string, value: unknown) {
    console.log(`  ${label.padEnd(36)} ${String(value)}`);
}

function warn(msg: string) {
    console.warn(`  ⚠️  ${msg}`);
}

function ok(msg: string) {
    console.log(`  ✅ ${msg}`);
}

// ─── Run ──────────────────────────────────────────────────────────────────────
async function run() {
    console.log('\n========================================');
    console.log('  Esparex Monetization Consistency Audit');
    console.log('========================================\n');

    // 1. Sample wallets that have any credits
    const wallets = await UserWallet.find({
        $or: [
            { adCredits: { $gt: 0 } },
            { spotlightCredits: { $gt: 0 } },
            { smartAlertSlots: { $gt: 0 } },
        ]
    }).limit(SAMPLE_SIZE).lean();

    console.log(`Sampling ${wallets.length} wallets with non-zero credits.\n`);

    let driftCount = 0;
    let orphanedPlanCount = 0;
    let missingInvoiceCount = 0;
    let stringUserIdCount = 0;

    for (const wallet of wallets) {
        const userId = wallet.userId;
        console.log(`────────────────────────────────────────`);
        console.log(`  User: ${String(userId)}`);

        // ── Check userId storage type ────────────────────────────────────────
        if (typeof userId === 'string') {
            warn(`userId stored as STRING (not ObjectId) → wallet query mismatch risk`);
            stringUserIdCount++;
        }

        const userObjId = new mongoose.Types.ObjectId(String(userId));

        // ── Entitlement sums ─────────────────────────────────────────────────
        const entitlements = await Entitlement.find({
            userId: userObjId,
            status: 'ACTIVE',
        }).lean();

        const entitlementSums = {
            AD_POSTING: 0,
            SPOTLIGHT_CAT: 0,
            SMART_ALERT_SLOT: 0,
        };
        let expiredButActiveCount = 0;

        for (const e of entitlements) {
            const type = e.type as keyof typeof entitlementSums;
            if (type in entitlementSums) {
                entitlementSums[type] += Number(e.remaining ?? 0);
            }
            if (e.expiresAt && new Date(e.expiresAt) < NOW) {
                expiredButActiveCount++;
            }
        }

        // ── Wallet vs Entitlement drift ──────────────────────────────────────
        const walletAdCredits = Number(wallet.adCredits ?? 0);
        const walletSpotlight = Number(wallet.spotlightCredits ?? 0);
        const walletSmartAlert = Number(wallet.smartAlertSlots ?? 0);

        let userHasDrift = false;

        if (walletAdCredits !== entitlementSums.AD_POSTING) {
            warn(`adCredits DRIFT: wallet=${walletAdCredits} | entitlement_sum=${entitlementSums.AD_POSTING} | delta=${walletAdCredits - entitlementSums.AD_POSTING}`);
            userHasDrift = true;
        } else {
            ok(`adCredits consistent: ${walletAdCredits}`);
        }

        if (walletSpotlight !== entitlementSums.SPOTLIGHT_CAT) {
            warn(`spotlightCredits DRIFT: wallet=${walletSpotlight} | entitlement_sum=${entitlementSums.SPOTLIGHT_CAT} | delta=${walletSpotlight - entitlementSums.SPOTLIGHT_CAT}`);
            userHasDrift = true;
        } else {
            ok(`spotlightCredits consistent: ${walletSpotlight}`);
        }

        if (walletSmartAlert !== entitlementSums.SMART_ALERT_SLOT) {
            warn(`smartAlertSlots DRIFT: wallet=${walletSmartAlert} | entitlement_sum=${entitlementSums.SMART_ALERT_SLOT} | delta=${walletSmartAlert - entitlementSums.SMART_ALERT_SLOT}`);
            userHasDrift = true;
        } else {
            ok(`smartAlertSlots consistent: ${walletSmartAlert}`);
        }

        if (userHasDrift) driftCount++;

        if (expiredButActiveCount > 0) {
            warn(`${expiredButActiveCount} entitlement(s) have status=ACTIVE but expiresAt < NOW (no expiry job running)`);
        }

        // ── UserPlan check ───────────────────────────────────────────────────
        const activePlans = await UserPlan.find({ userId: userObjId, status: 'active' }).lean();
        if (activePlans.length > 1) {
            warn(`Multiple active UserPlans (${activePlans.length}) — UserPlan.updateMany logic may not be idempotent`);
            orphanedPlanCount++;
        } else if (activePlans.length === 0) {
            fmt('Active UserPlan', 'none');
        } else {
            fmt('Active UserPlan', activePlans[0]?.planId);
        }

        // ── Transaction coverage ─────────────────────────────────────────────
        const successTxs = await Transaction.find({
            userId: userObjId,
            status: 'SUCCESS',
            applied: true,
            amount: { $gt: 0 }     // exclude internal credit-only transactions
        }).lean();

        for (const tx of successTxs) {
            const invoice = await Invoice.findOne({ transactionId: tx._id }).lean();
            if (!invoice) {
                warn(`Transaction ${String(tx._id)} (${String(tx.planSnapshot?.name)}) has no Invoice record`);
                missingInvoiceCount++;
            }

            const entForTx = await Entitlement.find({ sourceId: tx._id }).lean();
            if (entForTx.length === 0 && (tx.planSnapshot?.type !== 'FREE_DEFAULT')) {
                warn(`Transaction ${String(tx._id)} (type=${String(tx.planSnapshot?.type)}) has no Entitlement records`);
            }
        }
    }

    // ─── Summary ─────────────────────────────────────────────────────────────
    console.log('\n════════════════════════════════════════');
    console.log('  AUDIT SUMMARY');
    console.log('════════════════════════════════════════');
    fmt('Wallets sampled', wallets.length);
    fmt('Wallets with credit drift', `${driftCount} / ${wallets.length}`);
    fmt('Wallets with string userId', `${stringUserIdCount} / ${wallets.length}`);
    fmt('Users with multiple active plans', orphanedPlanCount);
    fmt('Transactions missing invoices', missingInvoiceCount);

    if (driftCount === 0) {
        ok('No wallet↔entitlement drift detected in sample');
    } else {
        warn(`${driftCount} wallets have credit drift — UserWallet is NOT a reliable projection of Entitlements`);
    }

    await mongoose.disconnect();
    console.log('\nDone.\n');
}

run().catch((err) => {
    console.error('Audit failed:', err);
    process.exit(1);
});
