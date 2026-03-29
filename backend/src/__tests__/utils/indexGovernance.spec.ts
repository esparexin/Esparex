import mongoose from "mongoose";

jest.mock("../../utils/logger", () => ({
    __esModule: true,
    default: {
        warn: jest.fn(),
        error: jest.fn(),
        info: jest.fn(),
    },
}));

import logger from "../../utils/logger";
import { governSchema, resetIndexGovernanceForTests } from "../../core/db/indexGovernance";

describe("index governance", () => {
    beforeEach(() => {
        resetIndexGovernanceForTests();
        jest.clearAllMocks();
    });

    it("does not treat the same key pattern in different audit scopes as a collision", () => {
        const userSchema = new mongoose.Schema({ email: String });
        userSchema.index({ email: 1 }, { name: "idx_user_email_unique_idx", unique: true });

        const adminSchema = new mongoose.Schema({ email: String });
        adminSchema.index({ email: 1 }, { name: "idx_user_email_unique_idx", unique: true });

        governSchema(userSchema, { scope: "user", collectionName: "User" });
        governSchema(adminSchema, { scope: "admin", collectionName: "User" });

        expect(logger.error).not.toHaveBeenCalledWith(
            expect.stringContaining("[Index Governance] Duplicate Index Collision")
        );
    });

    it("still reports a collision when the same scope registers the same key pattern twice", () => {
        const firstSchema = new mongoose.Schema({ email: String });
        firstSchema.index({ email: 1 }, { name: "idx_user_email_unique_idx", unique: true });

        const secondSchema = new mongoose.Schema({ email: String });
        secondSchema.index({ email: 1 }, { name: "idx_user_email_unique_alt_idx", unique: true });

        governSchema(firstSchema, { scope: "user", collectionName: "User" });
        governSchema(secondSchema, { scope: "user", collectionName: "User" });

        expect(logger.error).toHaveBeenCalledWith(
            expect.stringContaining("[Index Governance] Duplicate Index Collision")
        );
    });
});
