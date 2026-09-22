jest.mock('../../domains/payments', () => ({
    calculateUserPlan: jest.fn(),
    consumeCredit: jest.fn(),
    credit: jest.fn(),
    WalletModel: {
        findOne: jest.fn(),
    },
    UserPlanModel: {
        find: jest.fn(),
    },
    PlanModel: {
        find: jest.fn(),
    },
}));

jest.mock('../../models/UserWallet', () => ({
    __esModule: true,
    default: {
        findOne: jest.fn(),
        updateOne: jest.fn(),
    },
}));

jest.mock('../../models/Entitlement', () => ({
    __esModule: true,
    default: {
        find: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([]),
        }),
    },
}));

jest.mock('../../domains/boosts/application/services/AdSlotService', () => ({
    syncWalletCycle: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../domains/notifications/application/SmartAlertService', () => ({
    SmartAlertModel: {
        countDocuments: jest.fn(),
        create: jest.fn(),
        findById: jest.fn(),
        findByIdAndDelete: jest.fn(),
    },
}));

jest.mock('../../utils/masterDataResolver', () => ({
    resolveMasterDataIds: jest.fn(),
}));

jest.mock('../../services/location/LocationNormalizer', () => ({
    normalizeCoordinates: jest.fn(),
    normalizeLocation: jest.fn(),
}));

import mongoose from 'mongoose';
import { calculateUserPlan, PlanModel, UserPlanModel, consumeCredit, credit, WalletModel } from '../../domains/payments';
import UserWallet from '../../models/UserWallet';
import Entitlement from '../../models/Entitlement';
import { SmartAlertModel } from '../../domains/notifications/application/SmartAlertService';
import { resolveMasterDataIds } from '../../utils/masterDataResolver';
import {
    normalizeCoordinates,
    normalizeLocation,
} from '../../services/location/LocationNormalizer';
import {
    createSmartAlertMutation,
    deleteSmartAlertMutation,
    toggleSmartAlertStatusMutation,
} from '../../services/smartAlert/SmartAlertMutationService';

const mockedCalculateUserPlan = calculateUserPlan as jest.Mock;
const mockedUserPlanFind = UserPlanModel.find as jest.Mock;
const mockedPlanFind = PlanModel.find as jest.Mock;
const mockedConsumeCredit = consumeCredit as jest.Mock;
const mockedCredit = credit as jest.Mock;
const mockedWalletFindOne = WalletModel.findOne as jest.Mock;
const mockedUserWalletFindOne = UserWallet.findOne as jest.Mock;
const mockedUserWalletUpdateOne = UserWallet.updateOne as jest.Mock;
const mockedSmartAlertModel = SmartAlertModel as any;
const mockedResolveMasterDataIds = resolveMasterDataIds as jest.Mock;
const mockedNormalizeCoordinates = normalizeCoordinates as jest.Mock;
const mockedNormalizeLocation = normalizeLocation as jest.Mock;

const makeUser = () => ({
    _id: new mongoose.Types.ObjectId(),
});

const makeAlert = (overrides: Record<string, unknown> = {}) => ({
    _id: new mongoose.Types.ObjectId(),
    userId: new mongoose.Types.ObjectId(),
    isActive: true,
    save: jest.fn().mockResolvedValue(undefined),
    ...overrides,
});

beforeEach(() => {
    jest.clearAllMocks();

    mockedUserPlanFind.mockReturnValue({
        lean: jest.fn().mockResolvedValue([{ planId: new mongoose.Types.ObjectId() }]),
    });
    mockedPlanFind.mockReturnValue({
        lean: jest.fn().mockResolvedValue([{}]),
    });
    mockedWalletFindOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue({ smartAlertSlots: 2 }),
    });
    mockedUserWalletFindOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue({ smartAlertSlots: 2, monthlyFreeAlertsUsed: 0 }),
    });
    mockedUserWalletUpdateOne.mockResolvedValue({ modifiedCount: 1 });
    mockedCalculateUserPlan.mockReturnValue({ smartAlerts: 1 });
    mockedSmartAlertModel.countDocuments.mockResolvedValue(0);
    mockedSmartAlertModel.create.mockImplementation(async (payload: Record<string, unknown>) => ({
        ...payload,
        save: jest.fn(),
    }));
    mockedResolveMasterDataIds.mockResolvedValue({});
    mockedNormalizeCoordinates.mockReturnValue(undefined);
    mockedNormalizeLocation.mockResolvedValue({
        locationId: new mongoose.Types.ObjectId(),
        display: 'Hyderabad',
        coordinates: { type: 'Point', coordinates: [78.4867, 17.385] },
    });
});

describe('SmartAlertMutationService', () => {
    it('consumes a wallet slot when creating beyond the monthly plan limit', async () => {
        mockedCalculateUserPlan.mockReturnValue({ smartAlerts: 1 });
        mockedUserWalletFindOne.mockReturnValue({
            lean: jest.fn().mockResolvedValue({ smartAlertSlots: 3, monthlyFreeAlertsUsed: 1 }),
        });
        (Entitlement.find as jest.Mock).mockReturnValue({
            lean: jest.fn().mockResolvedValue([
                { remaining: 1, type: 'SMART_ALERT_SLOT', status: 'ACTIVE' },
            ]),
        });

        const alert = await createSmartAlertMutation({
            user: makeUser(),
            body: {
                name: 'Repair alerts',
                criteria: {
                    category: 'phones',
                },
                radiusKm: 10,
            },
        });

        expect(mockedConsumeCredit).toHaveBeenCalledWith(
            expect.objectContaining({
                creditType: 'smartAlertSlots',
                amount: 1,
                metadata: { action: 'create_smart_alert' },
            })
        );
        expect(mockedUserWalletUpdateOne).not.toHaveBeenCalled();
        expect(mockedSmartAlertModel.create).toHaveBeenCalled();
        expect(alert).toBeDefined();
    });

    it('throws 403 AppError when monthly plan limit is reached and no active paid slots are available', async () => {
        mockedCalculateUserPlan.mockReturnValue({ smartAlerts: 1 });
        mockedUserWalletFindOne.mockReturnValue({
            lean: jest.fn().mockResolvedValue({ smartAlertSlots: 2, monthlyFreeAlertsUsed: 1 }),
        });
        (Entitlement.find as jest.Mock).mockReturnValue({
            lean: jest.fn().mockResolvedValue([]),
        });

        await expect(
            createSmartAlertMutation({
                user: makeUser(),
                body: {
                    name: 'Exceeded alert',
                    criteria: { category: 'phones' },
                    radiusKm: 10,
                },
            })
        ).rejects.toThrow(/Smart Alert monthly limit reached/);
    });

    it('allows admin deletion of an active alert without restoring the slot (non-refundable quota)', async () => {
        const ownerId = new mongoose.Types.ObjectId();
        mockedSmartAlertModel.findById.mockResolvedValue(
            makeAlert({
                userId: ownerId,
                isActive: true,
            })
        );

        const result = await deleteSmartAlertMutation({
            alertId: new mongoose.Types.ObjectId().toString(),
            admin: { _id: new mongoose.Types.ObjectId().toString() },
        });

        expect(mockedCredit).not.toHaveBeenCalled();
        expect(mockedSmartAlertModel.findByIdAndDelete).toHaveBeenCalled();
        expect(result).toEqual(expect.objectContaining({ deleted: true }));
    });

    it('does not restore a wallet slot when deactivating an alert (non-refundable quota)', async () => {
        const ownerId = new mongoose.Types.ObjectId();
        const alert = makeAlert({
            userId: ownerId,
            isActive: true,
        });
        mockedSmartAlertModel.findById.mockResolvedValue(alert);

        const updated = await toggleSmartAlertStatusMutation({
            alertId: new mongoose.Types.ObjectId().toString(),
            user: { _id: ownerId },
        });

        expect(mockedCredit).not.toHaveBeenCalled();
        expect(alert.save).toHaveBeenCalled();
        expect(updated.isActive).toBe(false);
    });

    it('grants baseline 2 free smart alerts to free users without active plans and increments monthly usage', async () => {
        mockedUserPlanFind.mockReturnValue({
            lean: jest.fn().mockResolvedValue([]),
        });
        mockedUserWalletFindOne.mockReturnValue({
            lean: jest.fn().mockResolvedValue({ monthlyFreeAlertsUsed: 0 }),
        });

        const alert = await createSmartAlertMutation({
            user: makeUser(),
            body: {
                name: 'Free alert',
                criteria: {
                    category: 'phones',
                },
                radiusKm: 10,
            },
        });

        expect(mockedConsumeCredit).not.toHaveBeenCalled();
        expect(mockedUserWalletUpdateOne).toHaveBeenCalledWith(
            expect.anything(),
            { $inc: { monthlyFreeAlertsUsed: 1 } },
            { upsert: true }
        );
        expect(mockedSmartAlertModel.create).toHaveBeenCalled();
        expect(alert).toBeDefined();
    });
});

