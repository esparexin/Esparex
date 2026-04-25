import type { NextFunction, Request, Response } from "express";
import { validateContactSubmission } from "../middleware/securityValidators";

const createMockRes = () => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
});

describe("validateContactSubmission", () => {
    it("accepts canonical mobile contact submissions", () => {
        const req = {
            body: {
                name: "Rahul Kumar",
                email: "rahul@example.com",
                mobile: "98765 43210",
                subject: "Need support",
                category: "support",
                message: "I need help with a listing issue that is blocking my account access.",
            },
        } as unknown as Request;
        const res = createMockRes() as unknown as Response;
        const next = jest.fn() as unknown as NextFunction;

        validateContactSubmission(req, res, next);

        expect(next).toHaveBeenCalled();
        expect((req.body as { mobile?: string }).mobile).toBe("9876543210");
        expect((req.body as { phone?: string }).phone).toBeUndefined();
        expect(res.status).not.toHaveBeenCalled();
    });

    it("rejects legacy phone contact alias", () => {
        const req = {
            body: {
                name: "Rahul Kumar",
                email: "rahul@example.com",
                phone: "9876543210",
                message: "I need help with a listing issue that is blocking my account access.",
            },
        } as unknown as Request;
        const res = createMockRes() as unknown as Response;
        const next = jest.fn() as unknown as NextFunction;

        validateContactSubmission(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: false,
                error: expect.stringMatching(/phone|mobile/i),
                status: 400,
            })
        );
    });
});
