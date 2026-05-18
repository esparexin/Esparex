/**
 * FraudDetectionService — Unit Tests
 * 
 * Strategy:
 *   The FraudDetectionService evaluates user actions against multiple risk signals 
 *   (Account history, device/IP patterns, content spam). We verify that the 
 *   scoring engine correctly aggregates these signals into a final RiskLevel 
 *   and ensures data persistence for audit trails.
 */

// ── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('../../models/User', () => ({
    __esModule: true,
    default: {
        findById: jest.fn(),
    }
}));

jest.mock('../../models/FraudSignal', () => ({
    __esModule: true,
    default: {
        distinct: jest.fn(),
        create: jest.fn(),
    }
}));

jest.mock('../../models/FraudScore', () => ({
    __esModule: true,
    default: {
        findOneAndUpdate: jest.fn(),
    }
}));

// ── Imports ──────────────────────────────────────────────────────────────────

import mongoose from 'mongoose';
import { analyzeFraudRisk, FraudContext } from '../../services/FraudDetectionService';
import User from '../../models/User';
import FraudSignal from '../../models/FraudSignal';
import FraudScore from '../../models/FraudScore';

// ── Typed Mocks ──────────────────────────────────────────────────────────────

const mockUserModel = User as unknown as { findById: jest.Mock };
const mockFraudSignalModel = FraudSignal as unknown as { distinct: jest.Mock; create: jest.Mock };
const mockFraudScoreModel = FraudScore as unknown as { findOneAndUpdate: jest.Mock };

// ── Shared Fixtures ──────────────────────────────────────────────────────────

const USER_ID = new mongoose.Types.ObjectId('60b9b0b9b0b9b0b9b0b9b0b1');
const IP = '1.2.3.4';
const DEVICE = 'fingerprint-123';

const makeContext = (overrides: Partial<FraudContext> = {}): FraudContext => ({
    userId: USER_ID,
    ip: IP,
    deviceFingerprint: DEVICE,
    action: 'POST_AD',
    ...overrides,
});

// ── Tests ────────────────────────────────────────────────────────────────────

describe('FraudDetectionService.analyzeFraudRisk', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        
        // Default: Old account, no strikes, no multi-accounting
        mockUserModel.findById.mockReturnValue({
            select: jest.fn().mockResolvedValue({
                createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days old
                strikeCount: 0
            })
        });

        mockFraudSignalModel.distinct.mockResolvedValue([USER_ID]); // Only 1 account per IP/Device
        mockFraudSignalModel.create.mockResolvedValue({});
        mockFraudScoreModel.findOneAndUpdate.mockResolvedValue({});
    });

    // =========================================================================
    // BRANCH: Low Risk (Happy Path)
    // =========================================================================
    it('should return "allow" risk level for clean context', async () => {
        const context = makeContext();
        
        const result = await analyzeFraudRisk(context);

        expect(result.totalScore).toBe(0);
        expect(result.riskLevel).toBe('allow');
        expect(result.signals).toHaveLength(0);
        
        expect(mockFraudSignalModel.create).toHaveBeenCalled();
        expect(mockFraudScoreModel.findOneAndUpdate).toHaveBeenCalledWith(
            { userId: USER_ID },
            expect.objectContaining({ $set: expect.objectContaining({ riskLevel: 'allow' }) }),
            { upsert: true }
        );
    });

    // =========================================================================
    // BRANCH: Account History Risk
    // =========================================================================
    it('should increase score for accounts younger than 24 hours', async () => {
        mockUserModel.findById.mockReturnValue({
            select: jest.fn().mockResolvedValue({
                createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours old
                strikeCount: 0
            })
        });

        const result = await analyzeFraudRisk(makeContext());

        expect(result.totalScore).toBe(20);
        expect(result.riskLevel).toBe('allow'); // Threshold for flag is 21
        expect(result.signals).toContain('Account age < 24 hours');
    });

    it('should increase score significantly for previous strikes', async () => {
        mockUserModel.findById.mockReturnValue({
            select: jest.fn().mockResolvedValue({
                createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
                strikeCount: 2
            })
        });

        const result = await analyzeFraudRisk(makeContext());

        expect(result.totalScore).toBe(30); // 15 * 2
        expect(result.riskLevel).toBe('flag'); // 21-40 is flag
        expect(result.signals).toContain('Previous strikes (2)');
    });

    // =========================================================================
    // BRANCH: Multi-Accounting (IP/Device)
    // =========================================================================
    it('should flag risk when multiple accounts are detected on same IP', async () => {
        mockFraudSignalModel.distinct.mockImplementation((field) => {
            if (field === 'userId') return Promise.resolve(['u1', 'u2', 'u3']); // 3 accounts
            return Promise.resolve([]);
        });

        const result = await analyzeFraudRisk(makeContext({ deviceFingerprint: undefined }));

        expect(result.totalScore).toBe(25);
        expect(result.riskLevel).toBe('flag');
        expect(result.signals).toContain('Multiple accounts (3) from same IP');
    });

    it('should flag risk when multiple accounts are detected on same Device', async () => {
        mockFraudSignalModel.distinct.mockImplementation((field) => {
            if (field === 'userId') return Promise.resolve(['u1', 'u2', 'u3']); // 3 accounts
            return Promise.resolve([]);
        });

        const result = await analyzeFraudRisk(makeContext({ ip: '' }));

        expect(result.totalScore).toBe(20);
        expect(result.riskLevel).toBe('allow'); // Score 20 is allow
        expect(result.signals).toContain('Multiple accounts (3) from same Device');
    });

    // =========================================================================
    // BRANCH: Content Spam Signals
    // =========================================================================
    it('should increase score for text spam detection', async () => {
        const result = await analyzeFraudRisk(makeContext({ isTextSpam: true, textSpamScore: 45 }));

        expect(result.totalScore).toBe(45);
        expect(result.riskLevel).toBe('captcha'); // 41-60 is captcha
    });

    it('should increase score for AI spam detection', async () => {
        const result = await analyzeFraudRisk(makeContext({ isAiSpam: true, aiSpamScore: 65 }));

        expect(result.totalScore).toBe(65);
        expect(result.riskLevel).toBe('moderation'); // 61-80 is moderation
    });

    // =========================================================================
    // BRANCH: Suspicious Pricing
    // =========================================================================
    it('should increase score for low suspicious pricing', async () => {
        const result = await analyzeFraudRisk(makeContext({ price: 2 }));

        expect(result.totalScore).toBe(20);
        expect(result.signals).toContain('Suspicious pricing: 2');
    });

    // =========================================================================
    // AGGREGATION & THRESHOLDS (Combined Risk)
    // =========================================================================
    it('should return "block" risk level for high combined score', async () => {
        // Young account (20) + 4 strikes (60) + suspicious price (20) = 100
        mockUserModel.findById.mockReturnValue({
            select: jest.fn().mockResolvedValue({
                createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
                strikeCount: 4
            })
        });

        const result = await analyzeFraudRisk(makeContext({ price: 1 }));

        expect(result.totalScore).toBe(100);
        expect(result.riskLevel).toBe('block');
        expect(result.signals).toHaveLength(3);
    });

    // =========================================================================
    // ERROR HANDLING & PERSISTENCE
    // =========================================================================
    it('should handle database write failures gracefully without crashing', async () => {
        mockFraudSignalModel.create.mockRejectedValue(new Error('DB connection failure'));
        
        const result = await analyzeFraudRisk(makeContext());

        // Still returns decision
        expect(result.riskLevel).toBe('allow');
    });

    it('should skip DB tracking if signals/score objects fail but return result', async () => {
        mockFraudScoreModel.findOneAndUpdate.mockRejectedValue(new Error('Update failed'));
        
        const result = await analyzeFraudRisk(makeContext());
        
        expect(result.riskLevel).toBeDefined();
    });
});
