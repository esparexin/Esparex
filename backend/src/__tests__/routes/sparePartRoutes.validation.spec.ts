import express from "express";
import request from "supertest";

jest.mock("../../middleware/authMiddleware", () => ({
    protect: (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
    extractUser: (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
}));

jest.mock("../../middleware/businessMiddleware", () => ({
    requireBusinessApproved: (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
}));

jest.mock("../../middleware/validateObjectId", () => ({
    validateObjectId: (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
}));

jest.mock("../../middleware/duplicateCooldownMiddleware", () => ({
    duplicateCooldownMiddleware: () => (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
}));

jest.mock("../../validators/listing.validator", () => ({
    createListingValidator: (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
}));

jest.mock("../../middleware/requireListingType", () => ({
    requireListingType: () => (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
}));

jest.mock("../../middleware/rateLimiter", () => ({
    phoneRevealLimiter: [(_req: express.Request, _res: express.Response, next: express.NextFunction) => next()],
}));

jest.mock("../../controllers/listingController", () => ({
    getListingPhone: jest.fn(),
}));

jest.mock("../../controllers/sparePartListingController", () => ({
    createSparePartListing: jest.fn(),
    getSparePartListings: jest.fn(),
    updateSparePartListing: jest.fn((req: express.Request, res: express.Response) => {
        res.status(200).json({ body: req.body });
    }),
    deleteSparePartListing: jest.fn(),
    deactivateSparePartListing: jest.fn(),
    repostSparePartListing: jest.fn(),
}));

import sparePartRoutes from "../../routes/sparePartRoutes";

const buildApp = () => {
    const app = express();
    app.use(express.json());
    app.use("/api/v1/spare-part-listings", sparePartRoutes);
    return app;
};

describe("spare-part update validation", () => {
    const app = buildApp();

    it("preserves immutable fields for controller-level lock checks", async () => {
        const response = await request(app)
            .put("/api/v1/spare-part-listings/507f1f77bcf86cd799439011")
            .send({
                condition: "used",
            });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            body: {
                condition: "used",
            },
        });
    });
});
