import { getSpareParts } from "../../controllers/admin/catalog/catalogSparePartController";
import { SparePartModel } from "@esparex/core/services/catalog/CatalogSparePartService";
import { getCache, setCache } from "@esparex/core/utils/redisCache";
import type { Request, Response } from "express";
import mongoose from "mongoose";

// Mock the Redis Cache
jest.mock("@esparex/core/utils/redisCache", () => ({
    getCache: jest.fn(),
    setCache: jest.fn(),
    CACHE_TTLS: { CATEGORIES: 300 }
}));

// Mock CatalogSparePartService functions
jest.mock("@esparex/core/services/catalog/CatalogSparePartService", () => {
    const original = jest.requireActual("@esparex/core/services/catalog/CatalogSparePartService");
    return {
        ...original,
        getActiveBrandIdsForCategories: jest.fn().mockResolvedValue(["brand-1"]),
        getActiveModelIdsForCategories: jest.fn().mockResolvedValue(["model-1"]),
    };
});

// Mock category canonical equivalent resolver
jest.mock('@esparex/core/services/catalog/CatalogCategoryService', () => ({
    resolveEquivalentActiveCategoryIds: jest.fn().mockImplementation(async (id) => [id])
}));

// Mock shared catalog controller helper functions
jest.mock("../../controllers/admin/catalog/shared", () => {
    const original = jest.requireActual("../../controllers/admin/catalog/shared");
    return {
        ...original,
        validateActiveCategories: jest.fn().mockResolvedValue({ ok: true }),
        getActiveCategoryIds: jest.fn().mockResolvedValue([])
    };
});

// Mock Mongoose model queries
const mockExec = jest.fn();
const mockQuery = {
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    exec: mockExec,
    then: jest.fn().mockImplementation(function (onFulfilled) {
        return mockExec().then(onFulfilled);
    })
};

describe("catalogSparePartController Category Filtering & Caching", () => {
    let mockRes: Response;
    let mockJson: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        mockJson = jest.fn();
        mockRes = {
            json: mockJson,
            setHeader: jest.fn(),
            statusCode: 200,
            status: jest.fn().mockReturnThis(),
            end: jest.fn(),
            req: null
        } as unknown as Response;

        // Mock find and countDocuments
        SparePartModel.find = jest.fn().mockReturnValue(mockQuery);
        SparePartModel.countDocuments = jest.fn().mockResolvedValue(10);
    });

    const createMockRequest = (categoryId?: string): Request => {
        return {
            originalUrl: "/api/v1/catalog/spare-parts",
            path: "/api/v1/catalog/spare-parts",
            method: "GET",
            headers: {},
            ip: "127.0.0.1",
            query: categoryId ? { categoryId } : {}
        } as unknown as Request;
    };

    describe("With Redis Caching Disabled", () => {
        beforeEach(() => {
            // Mock cache miss (simulate Redis disabled or cache miss)
            (getCache as jest.Mock).mockResolvedValue(null);
            (setCache as jest.Mock).mockResolvedValue(true);
        });

        it("queries MongoDB with the correct category ID for Mobiles", async () => {
            const req = createMockRequest("69c24a14a58d20c75c6b09d8"); // Mobiles
            (mockRes as any).req = req;

            mockExec.mockResolvedValueOnce([
                { _id: "part-1", name: "Mobile Battery" }
            ]);

            await getSpareParts(req, mockRes);

            // Assert DB is queried with categoryIds matching Mobiles (Mongoose ObjectId)
            expect(SparePartModel.find).toHaveBeenCalledWith(
                expect.objectContaining({
                    categoryIds: new mongoose.Types.ObjectId("69c24a14a58d20c75c6b09d8")
                })
            );
            expect(mockJson).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        items: expect.arrayContaining([
                            expect.objectContaining({ name: "Mobile Battery" })
                        ])
                    })
                })
            );
        });

        it("queries MongoDB with the correct category ID for LED TVs", async () => {
            const req = createMockRequest("69c24a14a58d20c75c6b09d9"); // LED TVs
            (mockRes as any).req = req;

            mockExec.mockResolvedValueOnce([
                { _id: "part-2", name: "TV Panel" }
            ]);

            await getSpareParts(req, mockRes);

            // Assert DB is queried with categoryIds matching LED TVs (Mongoose ObjectId)
            expect(SparePartModel.find).toHaveBeenCalledWith(
                expect.objectContaining({
                    categoryIds: new mongoose.Types.ObjectId("69c24a14a58d20c75c6b09d9")
                })
            );
            expect(mockJson).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        items: expect.arrayContaining([
                            expect.objectContaining({ name: "TV Panel" })
                        ])
                    })
                })
            );
        });
    });

    describe("With Redis Caching Enabled (Cache Key Partitioning Verification)", () => {
        let localCacheStore: Record<string, any> = {};

        beforeEach(() => {
            localCacheStore = {};
            (getCache as jest.Mock).mockImplementation(async (key: string) => {
                return localCacheStore[key] || null;
            });
            (setCache as jest.Mock).mockImplementation(async (key: string, value: any) => {
                localCacheStore[key] = value;
                return true;
            });
        });

        it("verifies that cache keys are correctly partitioned and no collision occurs", async () => {
            // 1. Request Mobiles (Category A)
            const reqMobile = createMockRequest("69c24a14a58d20c75c6b09d8");
            (mockRes as any).req = reqMobile;

            mockExec.mockResolvedValueOnce([
                { _id: "part-1", name: "Mobile Battery" }
            ]);

            await getSpareParts(reqMobile, mockRes);

            // Verify Mobile query executed and cached
            expect(SparePartModel.find).toHaveBeenCalledTimes(1);
            expect(mockJson).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        items: expect.arrayContaining([
                            expect.objectContaining({ name: "Mobile Battery" })
                        ])
                    })
                })
            );

            // 2. Request LED TVs (Category B)
            const reqTv = createMockRequest("69c24a14a58d20c75c6b09d9");
            (mockRes as any).req = reqTv;

            mockExec.mockResolvedValueOnce([
                { _id: "part-2", name: "TV Panel" }
            ]);

            // Clear find mock history to track if it is called again
            (SparePartModel.find as jest.Mock).mockClear();

            await getSpareParts(reqTv, mockRes);

            // VERIFY FIX:
            // - SparePartModel.find IS called again (because it does NOT hit Mobiles cache!)
            expect(SparePartModel.find).toHaveBeenCalledTimes(1);

            // - The returned items are TV Panel instead of Mobile Battery!
            expect(mockJson).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        items: expect.arrayContaining([
                            expect.objectContaining({ name: "TV Panel" })
                        ])
                    })
                })
            );

            // - Let's inspect the exact cache keys generated
            const cachedKeys = Object.keys(localCacheStore);
            console.log("Cached keys in local cache store:", cachedKeys);
            // Verify that the generated key DOES contain the categoryId string
            const mobileKey = cachedKeys.find(k => k.includes("69c24a14a58d20c75c6b09d8"));
            const tvKey = cachedKeys.find(k => k.includes("69c24a14a58d20c75c6b09d9"));
            expect(mobileKey).toBeDefined();
            expect(tvKey).toBeDefined();
        });
    });
});
