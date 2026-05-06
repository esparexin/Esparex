import express from "express";
import inject from "light-my-request";

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

jest.mock("../../middleware/listing.validator", () => ({
    createListingValidator: (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
}));

jest.mock("../../middleware/requireListingType", () => ({
    requireListingType: () => (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
}));

jest.mock("../../middleware/rateLimiter", () => ({
    phoneRevealLimiter: [(_req: express.Request, _res: express.Response, next: express.NextFunction) => next()],
    mutationLimiter: (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
    searchLimiter: (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
}));

jest.mock("../../controllers/listing/createListing.controller", () => ({
    createListing: jest.fn(),
}));

jest.mock("../../controllers/listing/getListings.controller", () => ({
    getListings: jest.fn(),
}));

jest.mock("../../controllers/listing/engagement.controller", () => ({
    getListingPhone: jest.fn(),
}));

jest.mock("../../controllers/listing/editListing.controller", () => ({
    editListing: jest.fn((req: express.Request, res: express.Response) => {
        res.status(200).json({ body: req.body });
    }),
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
        const response = await inject(app, {
            method: "PUT",
            url: "/api/v1/spare-part-listings/507f1f77bcf86cd799439011",
            payload: {
                condition: "used",
            },
        });

        expect(response.statusCode).toBe(200);
        expect(response.json()).toEqual({
            body: {
                condition: "used",
            },
        });
    });
});
