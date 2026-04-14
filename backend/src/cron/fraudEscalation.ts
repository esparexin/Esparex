import mongoose from 'mongoose';
import Admin from '../models/Admin';
import { env } from '../config/env';
import AdminLog from '../models/AdminLog';
import FraudScore from '../models/FraudScore';
import User from '../models/User';
import logger from '../utils/logger';
import { runWithDistributedJobLock } from '../utils/distributedJobLock';
import { USER_STATUS } from '@shared/enums/userStatus';

const FRAUD_ESCALATION_INTERVAL_MS = 60 * 60 * 1000; // 1h
const FRAUD_ESCALATION_STARTUP_DELAY_MS = 20_000;
const FRAUD_ESCALATION_LOCK_TTL_MS = 15 * 60 * 1000;
const FRAUD_ESCALATION_JOB_NAME = 'fraud_auto_escalation';
const FRAUD_AUTO_SUSPEND_THRESHOLD = env.FRAUD_AUTO_SUSPEND_THRESHOLD;

type FraudScoreDoc = {
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    currentScore: number;
    riskLevel: string;
};

const getAuditAdminId = async (): Promise<mongoose.Types.ObjectId | null> => {
    const admin = await Admin.findOne({
        isDeleted: { $ne: true },
        status: USER_STATUS.ACTIVE
    })
        .select('_id')
        .lean<{ _id: mongoose.Types.ObjectId } | null>();
    return admin?._id || null;
};

const runFraudEscalation = async (): Promise<void> => {
    if (!Number.isFinite(FRAUD_AUTO_SUSPEND_THRESHOLD) || FRAUD_AUTO_SUSPEND_THRESHOLD <= 0) {
        logger.warn('[FraudEscalation] Invalid FRAUD_AUTO_SUSPEND_THRESHOLD. Job skipped.', {
            threshold: FRAUD_AUTO_SUSPEND_THRESHOLD
        });
        return;
    }

    try {
        await runWithDistributedJobLock(
            FRAUD_ESCALATION_JOB_NAME,
            { ttlMs: FRAUD_ESCALATION_LOCK_TTL_MS, failOpen: false },
            async () => {
                const candidates = await FraudScore.find({
                    currentScore: { $gte: FRAUD_AUTO_SUSPEND_THRESHOLD },
                    autoActioned: { $ne: true }
                })
                    .select('_id userId currentScore riskLevel')
                    .lean<FraudScoreDoc[]>();

                if (candidates.length === 0) {
                    logger.info('[FraudEscalation] No candidates for auto-suspension');
                    return;
                }

                const auditAdminId = await getAuditAdminId();
                if (!auditAdminId) {
                    logger.warn('[FraudEscalation] No active admin found for audit logging. Job skipped.', {
                        candidateCount: candidates.length
                    });
                    return;
                }

                let suspendedUsers = 0;
                let actionedScores = 0;

                for (const score of candidates) {
                    const updatedUser = await User.findOneAndUpdate(
                        {
                            _id: score.userId,
                            status: { $ne: USER_STATUS.SUSPENDED }
                        },
                        {
                            $set: {
                                status: USER_STATUS.SUSPENDED,
                                statusChangedAt: new Date(),
                                statusReason: `Auto-suspended by fraud engine (score=${score.currentScore}, threshold=${FRAUD_AUTO_SUSPEND_THRESHOLD})`
                            },
                            $inc: { tokenVersion: 1 }
                        },
                        { new: true }
                    ).select('_id');

                    const markActioned = await FraudScore.updateOne(
                        {
                            _id: score._id,
                            autoActioned: { $ne: true }
                        },
                        {
                            $set: {
                                autoActioned: true,
                                autoActionedAt: new Date()
                            }
                        }
                    );

                    if (markActioned.modifiedCount > 0) {
                        actionedScores += 1;
                    }

                    if (!updatedUser) {
                        continue;
                    }

                    suspendedUsers += 1;
                    await AdminLog.create({
                        adminId: auditAdminId,
                        action: 'AUTO_SUSPEND_FRAUD',
                        targetType: 'User',
                        targetId: score.userId,
                        metadata: {
                            source: 'fraudEscalationCron',
                            fraudScoreId: score._id,
                            currentScore: score.currentScore,
                            riskLevel: score.riskLevel,
                            threshold: FRAUD_AUTO_SUSPEND_THRESHOLD
                        }
                    });
                }

                logger.info('[FraudEscalation] Completed', {
                    threshold: FRAUD_AUTO_SUSPEND_THRESHOLD,
                    candidateCount: candidates.length,
                    suspendedUsers,
                    actionedScores
                });
            }
        );
    } catch (error) {
        // No HTTP response: this is a cron job - errors are logged for monitoring
        logger.error('[FraudEscalation] Job failed', {
            error: error instanceof Error ? error.message : String(error)
        });
        // TODO: Add telemetry/alerting if escalation failures spike
    }
};

export const startFraudEscalationCron = (): void => {
    setTimeout(() => {
        void runFraudEscalation();
        setInterval(() => {
            void runFraudEscalation();
        }, FRAUD_ESCALATION_INTERVAL_MS);
    }, FRAUD_ESCALATION_STARTUP_DELAY_MS);

    logger.info('[FraudEscalation] Scheduled to run every 1 hour', {
        threshold: FRAUD_AUTO_SUSPEND_THRESHOLD
    });
};

export default startFraudEscalationCron;

