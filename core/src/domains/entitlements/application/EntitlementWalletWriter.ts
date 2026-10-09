/**
 * ESPAREX — EntitlementWalletWriter.ts
 *
 * THE single write API for `UserWallet` (P0-6 consolidation, DECISION-GATE §1/§3).
 * `UserWallet` is a read projection of the `Entitlement` ledger (see the architectural
 * notice in core/src/models/UserWallet.ts); every mutation of the projection MUST go
 * through this module. Direct `UserWallet.updateOne/updateMany/findOneAndUpdate`
 * calls anywhere else are a violation (enforced by the source-scan contract test
 * `core/src/__tests__/domains/entitlements/walletWriteApi.contract.spec.ts`).
 *
 * Owns:
 *  - `getMonthlyCycleStart` (moved from boosts' AdSlotService — the payments domain
 *    importing a date helper from boosts was flagged as the wrong direction, D-02)
 *  - `resetMonthlyCycleForUser` — lazy per-user cycle reset (replaces
 *    boosts' `AdSlotService.syncWalletCycle`)
 *  - `resetMonthlyCycleBulk` — bulk cycle reset for the monthly cron (replaces
 *    payments' `PlanService.resetWalletsForNewCycle`)
 *  - `bootstrapWallet` — wallet creation on registration (replaces identity's inline write)
 *  - `adjustWalletCredits` — generic credit $inc (replaces boosts' addAdCredits/consumeSlot
 *    increments and payments' WalletService credit/debit projection writes)
 *  - `incrementMonthlyUsage` — monthly usage counter $inc, always transactional
 *    (fixes the no-session write that lived in notifications' SmartAlertMutationService)
 *  - `withWalletTransaction` — session helper shared by payments' WalletService
 *
 * Monthly-reset field-set reconciliation (D-02 — the differing field sets were the bug):
 * the bulk reset zeroed only `monthlyFreeAdsUsed` while the lazy reset zeroed both
 * counters. The unified reset below covers the UNION, derived from the schema so it
 * cannot drift: every `monthly*` schema path plus `lastMonthlyReset`.
 */
import { ClientSession } from 'mongoose';
import UserWallet from '../../../models/UserWallet';
import { getUserConnection } from '../../../config/db';
import { AppError } from '../../../shared-kernel/errors/AppError';

/** Wallet credit pools (projection fields). */
export type WalletCreditField = 'adCredits' | 'boostCredits' | 'spotlightCredits' | 'smartAlertSlots';

/** Monthly usage counters (projection fields). */
export type WalletMonthlyUsageField = 'monthlyFreeAdsUsed' | 'monthlyFreeAlertsUsed';

/**
 * Schema-driven monthly reset field set: every `monthly*` path on the UserWallet
 * schema plus the reset marker. Computed lazily so module load never touches the
 * schema (consumers may mock the model). The contract test asserts this stays in
 * sync with the schema — a new monthly counter added to the model is reset
 * automatically.
 */
let cachedMonthlyResetFields: WalletMonthlyUsageField[] | null = null;
export function getMonthlyResetFields(): WalletMonthlyUsageField[] {
    if (!cachedMonthlyResetFields) {
        cachedMonthlyResetFields = (
            Object.keys(UserWallet.schema.paths) as string[]
        ).filter((path) => path.startsWith('monthly')) as WalletMonthlyUsageField[];
    }
    return cachedMonthlyResetFields;
}

const MONTHLY_RESET_MARKER = 'lastMonthlyReset';

/**
 * Returns the start of the current monthly cycle in UTC.
 * (Moved here from boosts' AdSlotService; boosts re-exports it deprecated.)
 */
export function getMonthlyCycleStart(now?: Date): Date {
    const d = now ?? new Date();
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0, 0));
}

/**
 * Runs `operation` inside a transaction, reusing `existingSession` when provided
 * or opening a new session otherwise. Every wallet write goes through a session.
 */
export async function withWalletTransaction<T>(
    existingSession: ClientSession | undefined,
    operation: (session: ClientSession | undefined) => Promise<T>
): Promise<T> {
    if (existingSession) {
        return operation(existingSession);
    }

    let session: ClientSession | undefined;
    try {
        const s = await getUserConnection().startSession();
        s.startTransaction();
        session = s;
    } catch {
        session = undefined;
    }

    if (!session) {
        throw new AppError('Failed to initialize database transaction session for wallet operation', 500, 'TRANSACTION_INIT_FAILED');
    }

    try {
        const result = await operation(session);
        await session.commitTransaction();
        return result;
    } catch (error) {
        try {
            await session.abortTransaction();
        } catch {
            // ignore abort failure
        }
        throw error;
    } finally {
        try {
            void session.endSession();
        } catch {
            // ignore endSession failure
        }
    }
}

const buildMonthlyResetSet = (cycleStart: Date): Record<string, number | Date> => {
    const set: Record<string, number | Date> = {};
    for (const field of getMonthlyResetFields()) {
        set[field] = 0;
    }
    set[MONTHLY_RESET_MARKER] = cycleStart;
    return set;
};

/**
 * Lazy per-user monthly cycle reset. Ensures the wallet exists and zeroes the full
 * monthly field set when the stored reset marker predates the current cycle.
 * Replaces boosts' `AdSlotService.syncWalletCycle`.
 */
export async function resetMonthlyCycleForUser(params: {
    userId: string;
    session?: ClientSession;
    now?: Date;
}): Promise<void> {
    const { userId, session, now = new Date() } = params;
    const cycleStart = getMonthlyCycleStart(now);
    const existingWallet = await UserWallet.findOne({ userId })
        .session(session ?? null)
        .lean();

    const lastMonthlyReset = existingWallet?.lastMonthlyReset
        ? new Date(existingWallet.lastMonthlyReset)
        : null;

    const requiresReset =
        !existingWallet ||
        !lastMonthlyReset ||
        lastMonthlyReset.getTime() < cycleStart.getTime();

    if (!requiresReset) return;

    await UserWallet.updateOne(
        { userId },
        {
            $setOnInsert: { userId, adCredits: 0 },
            $set: buildMonthlyResetSet(cycleStart),
        },
        { upsert: true, session }
    );
}

/**
 * Bulk monthly cycle reset for the monthly cron. Resets the FULL monthly field set
 * (union of the old bulk and lazy resets — the old bulk reset forgot
 * `monthlyFreeAlertsUsed`) and stamps `lastMonthlyReset` with the cycle start.
 * Replaces payments' `PlanService.resetWalletsForNewCycle`.
 */
export async function resetMonthlyCycleBulk(params: {
    now?: Date;
} = {}): Promise<{ cycleStart: Date; modifiedCount: number }> {
    const { now = new Date() } = params;
    const cycleStart = getMonthlyCycleStart(now);
    const result = await UserWallet.updateMany(
        {
            $or: [
                { lastMonthlyReset: { $exists: false } },
                { lastMonthlyReset: { $lt: cycleStart } }
            ]
        },
        { $set: buildMonthlyResetSet(cycleStart) }
    );

    return { cycleStart, modifiedCount: result.modifiedCount };
}

/** Wallet bootstrap defaults (identity registration). */
const WALLET_BOOTSTRAP_DEFAULTS = {
    adCredits: 0,
    boostCredits: 0,
    monthlyFreeAdsUsed: 0,
    monthlyFreeAlertsUsed: 0,
    spotlightCredits: 0,
    smartAlertSlots: 2,
};

/**
 * Idempotent wallet bootstrap (registration). Replaces the inline
 * `$setOnInsert` write in identity's `authRegistrationHelper`.
 */
export async function bootstrapWallet(params: {
    userId: string;
    session?: ClientSession;
    now?: Date;
}) {
    const { userId, session, now = new Date() } = params;
    return withWalletTransaction(session, async (activeSession) => {
        return UserWallet.findOneAndUpdate(
            { userId },
            { $setOnInsert: { ...WALLET_BOOTSTRAP_DEFAULTS, lastMonthlyReset: now } },
            { upsert: true, new: true, setDefaultsOnInsert: true, ...(activeSession ? { session: activeSession } : {}) }
        );
    });
}

/**
 * Generic wallet credit adjustment ($inc). Replaces the ad-hoc `$inc` writes in
 * boosts' `AdSlotService` (addAdCredits/consumeSlot) and the projection writes in
 * payments' `WalletService` credit/debit. Always runs inside a transaction.
 */
export async function adjustWalletCredits(params: {
    userId: string;
    delta: Partial<Record<WalletCreditField, number>>;
    session?: ClientSession;
    upsert?: boolean;
}) {
    const { userId, delta, session, upsert = false } = params;
    return withWalletTransaction(session, async (activeSession) => {
        return UserWallet.findOneAndUpdate(
            { userId },
            { $inc: delta },
            { new: true, upsert, ...(activeSession ? { session: activeSession } : {}) }
        );
    });
}

/**
 * Increments a monthly usage counter, always inside a transaction (opening its own
 * session when the caller has none). Fixes the no-session write that lived in
 * notifications' `SmartAlertMutationService` (D-03).
 */
export async function incrementMonthlyUsage(params: {
    userId: string;
    field: WalletMonthlyUsageField;
    amount?: number;
    session?: ClientSession;
}): Promise<void> {
    const { userId, field, amount = 1, session } = params;
    await withWalletTransaction(session, async (activeSession) => {
        await UserWallet.updateOne(
            { userId },
            { $inc: { [field]: amount } },
            { upsert: true, session: activeSession }
        );
    });
}
