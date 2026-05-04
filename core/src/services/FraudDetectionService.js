"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeFraudRisk = void 0;
const User_1 = __importDefault(require("@core/models/User"));
const FraudSignal_1 = __importDefault(require("@core/models/FraudSignal"));
const FraudScore_1 = __importDefault(require("@core/models/FraudScore"));
const logger_1 = __importDefault(require("@core/utils/logger"));
const analyzeFraudRisk = async (context) => {
    let totalScore = 0;
    const activeSignals = [];
    // 1. Account Age Risk
    if (context.userId) {
        const user = await User_1.default.findById(context.userId).select('createdAt strikeCount trustScore');
        if (user) {
            const ageHours = (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60);
            if (ageHours < 24) {
                totalScore += 20;
                activeSignals.push('Account age < 24 hours');
            }
            if (user.strikeCount && user.strikeCount > 0) {
                totalScore += 15 * user.strikeCount;
                activeSignals.push(`Previous strikes (${user.strikeCount})`);
            }
        }
    }
    // 2. IP / Device Fraud & Multi-Accounting
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    if (context.ip) {
        const parallelAcsByIp = await FraudSignal_1.default.distinct('userId', {
            ip: context.ip,
            signalType: 'ACCOUNT_USED',
            createdAt: { $gte: oneWeekAgo }
        });
        if (parallelAcsByIp.length > 2) {
            totalScore += 25;
            activeSignals.push(`Multiple accounts (${parallelAcsByIp.length}) from same IP`);
        }
    }
    if (context.deviceFingerprint) {
        const parallelAcsByDevice = await FraudSignal_1.default.distinct('userId', {
            deviceFingerprint: context.deviceFingerprint,
            signalType: 'ACCOUNT_USED',
            createdAt: { $gte: oneWeekAgo }
        });
        if (parallelAcsByDevice.length > 2) {
            totalScore += 20;
            activeSignals.push(`Multiple accounts (${parallelAcsByDevice.length}) from same Device`);
        }
    }
    // 3. Spams Texts & AI
    if (context.isTextSpam) {
        totalScore += (context.textSpamScore || 20);
        activeSignals.push('Keyword / Pattern Text Spam Detected');
    }
    if (context.isAiSpam) {
        totalScore += (context.aiSpamScore || 20);
        activeSignals.push('LLM-Generated Spam Detected');
    }
    // 4. Suspicious Pricing Risk
    if (context.price !== undefined && context.price < 5) {
        totalScore += 20;
        activeSignals.push(`Suspicious pricing: ${context.price}`);
    }
    // 5. Compute Level
    let riskLevel = 'allow';
    if (totalScore >= 81)
        riskLevel = 'block';
    else if (totalScore >= 61)
        riskLevel = 'moderation';
    else if (totalScore >= 41)
        riskLevel = 'captcha';
    else if (totalScore >= 21)
        riskLevel = 'flag';
    // 6. DB Tracking (Log the main request as a signal)
    try {
        await FraudSignal_1.default.create({
            userId: context.userId,
            ip: context.ip,
            deviceFingerprint: context.deviceFingerprint,
            adId: context.adId,
            signalType: context.action, // e.g., 'POST_AD', 'SEND_OTP'
            score: totalScore
        });
        // Async User Sync
        if (context.userId) {
            await FraudScore_1.default.findOneAndUpdate({ userId: context.userId }, {
                $set: {
                    currentScore: totalScore,
                    riskLevel,
                    lastUpdated: new Date()
                }
            }, { upsert: true });
        }
    }
    catch (dbErr) {
        logger_1.default.error('[Fraud Detection Engine] DB write failed', { error: dbErr instanceof Error ? dbErr.message : String(dbErr) });
    }
    return { totalScore, riskLevel, signals: activeSignals };
};
exports.analyzeFraudRisk = analyzeFraudRisk;
//# sourceMappingURL=FraudDetectionService.js.map