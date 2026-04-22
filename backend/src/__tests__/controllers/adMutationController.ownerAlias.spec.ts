jest.mock("../../services/AdMutationService", () => ({
    __esModule: true,
    updateAd: jest.fn(),
    assertOwnership: jest.fn(),
}));

jest.mock("../../services/adStatusService", () => ({
    __esModule: true,
    deleteAd: jest.fn(),
    restoreAd: jest.fn(),
}));

jest.mock("../../services/AdOrchestrator", () => ({
    __esModule: true,
    createAd: jest.fn(),
}));

jest.mock("../../services/BusinessService", () => ({
    __esModule: true,
    getBusinessByUserId: jest.fn(),
}));

import type { NextFunction, Request, Response } from "express";
import * as AdMutationController from "../../controllers/ad/adMutationController";
import * as AdMutationService from "../../services/AdMutationService";
import * as AdOrchestrator from "../../services/AdOrchestrator";

const createMockRes = (req?: Record<string, unknown>) => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    req,
});

describe("adMutationController owner alias enforcement", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("rejects sellerId in user create payloads", async () => {
        const req = {
            body: {
                sellerId: "65f0a1b2c3d4e5f607182930",
                title: "iPhone 14",
            },
            user: { _id: { toString: () => "65f0a1b2c3d4e5f607182931" } },
            originalUrl: "/api/v1/ads",
        } as unknown as Request;
        const res = createMockRes(req as unknown as Record<string, unknown>) as unknown as Response;
        const next = jest.fn() as unknown as NextFunction;

        await AdMutationController.createAd(req, res, next);

        expect(AdOrchestrator.createAd).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: false,
                error: expect.stringMatching(/sellerId/i),
                code: "IMMUTABLE_SELLER_ID",
                status: 400,
            })
        );
        expect(next).not.toHaveBeenCalled();
    });

    it("rejects sellerId in user update payloads", async () => {
        const req = {
            params: { id: "65f0a1b2c3d4e5f607182940" },
            body: {
                sellerId: "65f0a1b2c3d4e5f607182930",
                title: "Updated title",
            },
            user: { _id: { toString: () => "65f0a1b2c3d4e5f607182931" } },
            originalUrl: "/api/v1/ads/65f0a1b2c3d4e5f607182940",
        } as unknown as Request;
        const res = createMockRes(req as unknown as Record<string, unknown>) as unknown as Response;
        const next = jest.fn() as unknown as NextFunction;

        await AdMutationController.updateAd(req, res, next);

        expect(AdMutationService.updateAd).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: false,
                error: expect.stringMatching(/sellerId/i),
                code: "IMMUTABLE_SELLER_ID",
                status: 400,
            })
        );
        expect(next).not.toHaveBeenCalled();
    });

    it("uses the authenticated seller on clean updates", async () => {
        (AdMutationService.updateAd as jest.Mock).mockResolvedValue({ _id: "ad-1", title: "Updated title" });

        const req = {
            params: { id: "65f0a1b2c3d4e5f607182940" },
            body: {
                title: "Updated title",
            },
            user: { _id: { toString: () => "65f0a1b2c3d4e5f607182931" } },
            originalUrl: "/api/v1/ads/65f0a1b2c3d4e5f607182940",
        } as unknown as Request;
        const res = createMockRes(req as unknown as Record<string, unknown>) as unknown as Response;
        const next = jest.fn() as unknown as NextFunction;

        await AdMutationController.updateAd(req, res, next);

        expect(AdMutationService.updateAd).toHaveBeenCalledWith(
            "65f0a1b2c3d4e5f607182940",
            { title: "Updated title" },
            expect.objectContaining({
                authUserId: "65f0a1b2c3d4e5f607182931",
                sellerId: "65f0a1b2c3d4e5f607182931",
            })
        );
        expect(res.status).toHaveBeenCalledWith(200);
        expect(next).not.toHaveBeenCalled();
    });
});
