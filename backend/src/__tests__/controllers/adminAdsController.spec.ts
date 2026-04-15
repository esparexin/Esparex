jest.mock("../../services/AdService", () => ({
    __esModule: true,
    getAds: jest.fn(),
    updateAdStatus: jest.fn(),
    computeActiveExpiry: jest.fn().mockReturnValue(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
}));

jest.mock("../../utils/adminLogger", () => ({
    __esModule: true,
    logAdminAction: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../../models/Ad", () => ({
    __esModule: true,
    default: {
        findById: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue({
                    _id: "65fa29c9d2c1f2e165fa29c9",
                    status: "pending",
                    reviewVersion: undefined,
                    listingType: "ad",
                }),
            }),
        }),
    },
}));

jest.mock("../../services/StatusMutationService", () => ({
    mutateStatus: jest.fn().mockResolvedValue({
        _id: "65fa29c9d2c1f2e165fa29c9",
        status: "live",
    }),
}));

jest.mock("../../utils/redisCache", () => ({
    __esModule: true,
    invalidateAdFeedCaches: jest.fn(async () => undefined),
    invalidatePublicAdCache: jest.fn(async () => undefined),
    clearCachePattern: jest.fn(async () => 0),
    getCache: jest.fn(async () => null),
    setCache: jest.fn(async () => false),
    delCache: jest.fn(async () => false),
    isConnected: false,
    cacheMetrics: {
        hits: 0,
        misses: 0,
        errors: 0,
        keys: 0,
        memory: 0,
        lastUpdated: new Date(),
    },
}));

import type { Request, Response } from "express";
import { adminGetAds, approveAd } from "../../controllers/admin/adminAdsController";
import * as adService from "../../services/AdService";
import { logAdminAction } from "../../utils/adminLogger";
import { AD_STATUS_VALUES } from "../../../../shared/enums/adStatus";

describe("adminAdsController status normalization", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (adService.getAds as jest.Mock).mockResolvedValue({
            data: [],
            pagination: { page: 1, limit: 20, total: 0, pages: 1 },
        });
    });

    const makeRes = () => ({
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
    } as unknown as Response);

    it("uses all canonical statuses when status is missing", async () => {
        const req = { query: {} } as unknown as Request;
        const res = makeRes();

        await adminGetAds(req, res);

        expect(adService.getAds).toHaveBeenCalledTimes(1);
        const [filters, pagination] = (adService.getAds as jest.Mock).mock.calls[0];
        expect(filters.status).toEqual([...AD_STATUS_VALUES]);
        expect(pagination).toEqual({ page: 1, limit: 20 });
        expect(res.json).toHaveBeenCalled();
    });

    it("uses all canonical statuses when status=all", async () => {
        const req = { query: { status: "all" } } as unknown as Request;
        const res = makeRes();

        await adminGetAds(req, res);

        expect(adService.getAds).toHaveBeenCalledTimes(1);
        const [filters] = (adService.getAds as jest.Mock).mock.calls[0];
        expect(filters.status).toEqual([...AD_STATUS_VALUES]);
        expect(res.json).toHaveBeenCalled();
    });

    it("passes explicit status through when a specific status is requested", async () => {
        const req = { query: { status: "approved", page: "2", limit: "50" } } as unknown as Request;
        const res = makeRes();

        await adminGetAds(req, res);

        expect(adService.getAds).toHaveBeenCalledTimes(1);
        const [filters, pagination] = (adService.getAds as jest.Mock).mock.calls[0];
        expect(filters.status).toBe("approved");
        expect(pagination).toEqual({ page: 2, limit: 50 });
        expect(res.json).toHaveBeenCalled();
    });

    it("logs admin audit entry when approving an ad", async () => {
        (adService.updateAdStatus as jest.Mock).mockResolvedValue({
            _id: "65fa29c9d2c1f2e165fa29c9",
            status: "approved",
        });

        const req = {
            params: { id: "65fa29c9d2c1f2e165fa29c9" },
            user: { _id: "admin_1" },
            body: {},
            originalUrl: "/api/v1/admin/ads/65fa29c9d2c1f2e165fa29c9/approve",
        } as unknown as Request;
        const res = makeRes();

        await approveAd(req, res);

        expect(logAdminAction).toHaveBeenCalledWith(
            req,
            "APPROVE_AD",
            "Ad",
            "65fa29c9d2c1f2e165fa29c9",
            expect.objectContaining({ status: "live" })
        );
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ success: true })
        );
    });
});
