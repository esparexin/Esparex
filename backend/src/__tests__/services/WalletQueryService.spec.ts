jest.mock('../../services/WalletService', () => ({
    getWallet: jest.fn(),
    TransactionModel: {
        find: jest.fn(),
        countDocuments: jest.fn(),
    },
}));

jest.mock('../../services/AdSlotService', () => ({
    getAdPostingBalance: jest.fn(),
}));

import { getAdPostingBalance } from '../../services/AdSlotService';
import { getWallet, TransactionModel } from '../../services/WalletService';
import {
    getPostingBalanceByUserId,
    getTransactionHistoryByUserId,
    getWalletSummaryByUserId,
} from '../../services/wallet/WalletQueryService';

const mockedGetWallet = getWallet as jest.Mock;
const mockedGetAdPostingBalance = getAdPostingBalance as jest.Mock;
const mockedTransactionModel = TransactionModel as unknown as {
    find: jest.Mock;
    countDocuments: jest.Mock;
};

beforeEach(() => {
    jest.clearAllMocks();
});

describe('WalletQueryService', () => {
    it('delegates wallet summary hydration to WalletService.getWallet', async () => {
        mockedGetWallet.mockResolvedValue({ userId: 'user-1', smartAlertSlots: 2 });

        const wallet = await getWalletSummaryByUserId('user-1');

        expect(mockedGetWallet).toHaveBeenCalledWith('user-1');
        expect(wallet).toEqual({ userId: 'user-1', smartAlertSlots: 2 });
    });

    it('builds paginated transaction history from TransactionModel', async () => {
        const lean = jest.fn().mockResolvedValue([{ id: 'tx-1' }]);
        const skip = jest.fn().mockReturnValue({ lean });
        const limit = jest.fn().mockReturnValue({ skip });
        const sort = jest.fn().mockReturnValue({ limit });

        mockedTransactionModel.find.mockReturnValue({ sort });
        mockedTransactionModel.countDocuments.mockResolvedValue(7);

        const history = await getTransactionHistoryByUserId('user-1', { limit: 5, skip: 10 });

        expect(mockedTransactionModel.find).toHaveBeenCalledWith({ userId: 'user-1' });
        expect(sort).toHaveBeenCalledWith({ createdAt: -1 });
        expect(limit).toHaveBeenCalledWith(5);
        expect(skip).toHaveBeenCalledWith(10);
        expect(history).toEqual({
            transactions: [{ id: 'tx-1' }],
            pagination: {
                total: 7,
                limit: 5,
                skip: 10,
            },
        });
    });

    it('delegates posting balance lookup to AdSlotService', async () => {
        mockedGetAdPostingBalance.mockResolvedValue({ totalRemaining: 3 });

        const balance = await getPostingBalanceByUserId('user-1');

        expect(mockedGetAdPostingBalance).toHaveBeenCalledWith('user-1');
        expect(balance).toEqual({ totalRemaining: 3 });
    });
});
