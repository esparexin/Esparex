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
const mockedSmartAlertModel = SmartAlertModel as unknown as {
    countDocuments: jest.Mock;
    create: jest.Mock;
    findById: jest.Mock;
    findByIdAndDelete: jest.Mock;
};
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
    it('consumes a wallet slot when creating beyond the active plan limit', async () => {
        mockedSmartAlertModel.countDocuments.mockResolvedValue(1);

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
        expect(mockedSmartAlertModel.create).toHaveBeenCalled();
        expect(alert).toBeDefined();
    });

    it('allows admin deletion of an active alert and restores the slot', async () => {
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

        expect(mockedCredit).toHaveBeenCalledWith(
            expect.objectContaining({
                userId: ownerId.toString(),
                amount: { smartAlertSlots: 1 },
            })
        );
        expect(mockedSmartAlertModel.findByIdAndDelete).toHaveBeenCalled();
        expect(result).toEqual(expect.objectContaining({ deleted: true }));
    });

    it('restores a wallet slot when deactivating an alert above the plan limit', async () => {
        const ownerId = new mongoose.Types.ObjectId();
        const alert = makeAlert({
            userId: ownerId,
            isActive: true,
        });
        mockedSmartAlertModel.findById.mockResolvedValue(alert);
        mockedSmartAlertModel.countDocuments.mockResolvedValue(2);
        mockedCalculateUserPlan.mockReturnValue({ smartAlerts: 1 });

        const updated = await toggleSmartAlertStatusMutation({
            alertId: new mongoose.Types.ObjectId().toString(),
            user: { _id: ownerId },
        });

        expect(mockedCredit).toHaveBeenCalledWith(
            expect.objectContaining({
                userId: ownerId.toString(),
                metadata: expect.objectContaining({ action: 'deactivate_smart_alert' }),
            })
        );
        expect(alert.save).toHaveBeenCalled();
        expect(updated.isActive).toBe(false);
    });
});
