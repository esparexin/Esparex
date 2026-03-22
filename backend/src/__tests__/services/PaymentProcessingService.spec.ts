const mockSession = {
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    abortTransaction: jest.fn(),
    endSession: jest.fn(),
};

jest.mock("../../config/db", () => ({
    getUserConnection: () => ({
        startSession: jest.fn().mockResolvedValue(mockSession),
        models: {},
        model: jest.fn().mockReturnValue({}),
    }),
}));

jest.mock("../../models/Business", () => ({
    __esModule: true,
    default: {},
}));

jest.mock("../../models/Transaction", () => ({
    Transaction: {
        findOneAndUpdate: jest.fn(),
        findOne: jest.fn(),
        updateOne: jest.fn(),
    },
}));

jest.mock("../../models/Invoice", () => ({
    Invoice: {
        findOne: jest.fn(),
        create: jest.fn(),
        findById: jest.fn(),
        updateOne: jest.fn(),
    },
}));

jest.mock("../../models/User", () => ({
    __esModule: true,
    default: {
        findById: jest.fn(),
    },
}));

jest.mock("../../services/WalletService", () => ({
    credit: jest.fn(),
}));

jest.mock("../../services/RevenueAnalytics", () => ({
    recordRevenue: jest.fn(),
}));

jest.mock("../../utils/invoiceNumber", () => ({
    generateInvoiceNumber: jest.fn().mockResolvedValue("ESP-2026-000001"),
}));

jest.mock("../../services/InvoicePdfService", () => ({
    generateInvoicePdf: jest.fn().mockResolvedValue("https://example.com/invoice.pdf"),
}));

jest.mock("../../controllers/payment/shared", () => ({
    razorpay: {
        orders: {
            fetch: jest.fn(),
            fetchPayments: jest.fn(),
        },
        payments: {
            fetch: jest.fn(),
        },
    },
}));

import User from "../../models/User";
import { Invoice } from "../../models/Invoice";
import { Transaction } from "../../models/Transaction";
import { credit } from "../../services/WalletService";
import { recordRevenue } from "../../services/RevenueAnalytics";
import { processSuccessfulPayment, recoverPendingPayment } from "../../services/PaymentProcessingService";

describe("PaymentProcessingService", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockSession.startTransaction.mockReset();
        mockSession.commitTransaction.mockReset();
        mockSession.abortTransaction.mockReset();
        mockSession.endSession.mockReset();
    });

    it("returns duplicate for already-applied webhook deliveries", async () => {
        const mockFindOneAndUpdate = Transaction.findOneAndUpdate as jest.Mock;
        const mockFindOne = Transaction.findOne as jest.Mock;

        mockFindOneAndUpdate.mockResolvedValue(null);
        mockFindOne.mockReturnValue({
            session: jest.fn().mockResolvedValue({
                _id: { toString: () => "tx-1" },
                applied: true,
                status: "SUCCESS",
            }),
        });

        const result = await processSuccessfulPayment({
            source: "webhook",
            gatewayPaymentId: "pay_123",
            gatewayOrderId: "order_123",
        });

        expect(result).toEqual({ result: "duplicate", transactionId: "tx-1" });
        expect(mockSession.abortTransaction).toHaveBeenCalled();
    });

    it("processes a successful payment once and creates an invoice", async () => {
        const tx = {
            _id: { toString: () => "tx-2" },
            userId: { toString: () => "user-1" },
            planSnapshot: {
                code: "SPOTLIGHT_1",
                name: "Spotlight 1",
                type: "SPOTLIGHT",
                credits: 1,
            },
            amount: 199,
            currency: "INR",
            metadata: {},
            applied: false,
            status: "INITIATED",
            save: jest.fn().mockResolvedValue(undefined),
        };

        (Transaction.findOneAndUpdate as jest.Mock).mockResolvedValue(tx);
        (Invoice.findOne as jest.Mock).mockReturnValue({
            session: jest.fn().mockResolvedValue(null),
        });
        (Invoice.create as jest.Mock).mockResolvedValue([
            {
                _id: { toString: () => "inv-1" },
            },
        ]);
        (Invoice.findById as jest.Mock).mockReturnValue({
            lean: jest.fn().mockResolvedValue({
                _id: { toString: () => "inv-1" },
                invoiceNumber: "ESP-2026-000001",
                amount: 199,
                currency: "INR",
                issuedAt: new Date(),
                subtotal: 168.64,
                cgst: 15.18,
                sgst: 15.18,
                igst: 0,
                total: 199,
                gstin: undefined,
                sacCode: "998599",
            }),
        });
        (User.findById as jest.Mock).mockReturnValue({
            select: jest.fn().mockReturnThis(),
            session: jest.fn().mockReturnThis(),
            lean: jest.fn().mockResolvedValue({ name: "Test User" }),
        });

        const result = await processSuccessfulPayment({
            source: "webhook",
            gatewayPaymentId: "pay_456",
            gatewayOrderId: "order_456",
            gatewayAmountPaise: 19900,
            gatewayCurrency: "INR",
        });

        expect(result.result).toBe("processed");
        expect(credit).toHaveBeenCalled();
        expect(recordRevenue).toHaveBeenCalled();
        expect(tx.save).toHaveBeenCalled();
        expect(mockSession.commitTransaction).toHaveBeenCalled();
    });

    it("marks stale mock pending transactions as failed during recovery", async () => {
        const tx = {
            _id: { toString: () => "tx-3" },
            gatewayOrderId: "order_mock_123",
            paymentGateway: "mock",
            metadata: {},
        };

        const result = await recoverPendingPayment(tx as any);

        expect(result.result).toBe("failed");
        expect(Transaction.updateOne).toHaveBeenCalledWith(
            { _id: tx._id, applied: false },
            expect.objectContaining({
                $set: expect.objectContaining({
                    status: "FAILED",
                }),
            })
        );
    });
});
