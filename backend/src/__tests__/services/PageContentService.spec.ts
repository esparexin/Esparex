jest.mock("../../models/PageContent", () => ({
    __esModule: true,
    default: {
        findOne: jest.fn(),
        findOneAndUpdate: jest.fn(),
        find: jest.fn(),
    },
}));

import {
    findContentBySlug,
    upsertContentBySlug,
    getAllContent,
} from "../../services/PageContentService";

const mockPageContent = require("../../models/PageContent").default as {
    findOne: jest.Mock;
    findOneAndUpdate: jest.Mock;
    find: jest.Mock;
};

describe("PageContentService", () => {
    beforeEach(() => jest.clearAllMocks());

    describe("findContentBySlug", () => {
        it("returns content document for a matching slug", async () => {
            const doc = { slug: "faq", title: "FAQ", content: "..." };
            mockPageContent.findOne.mockResolvedValue(doc);

            const result = await findContentBySlug("faq");

            expect(result).toEqual(doc);
            expect(mockPageContent.findOne).toHaveBeenCalledWith({ slug: "faq" });
        });

        it("returns null when slug does not exist", async () => {
            mockPageContent.findOne.mockResolvedValue(null);

            const result = await findContentBySlug("nonexistent");

            expect(result).toBeNull();
        });
    });

    describe("upsertContentBySlug", () => {
        it("calls findOneAndUpdate with upsert:true and returns the result", async () => {
            const updated = { slug: "about", title: "About Us", content: "We are..." };
            mockPageContent.findOneAndUpdate.mockResolvedValue(updated);

            const result = await upsertContentBySlug("about", {
                title: "About Us",
                content: "We are...",
            });

            expect(result).toEqual(updated);
            expect(mockPageContent.findOneAndUpdate).toHaveBeenCalledWith(
                { slug: "about" },
                { title: "About Us", content: "We are..." },
                { new: true, upsert: true, runValidators: true }
            );
        });
    });

    describe("getAllContent", () => {
        it("returns a list of all content slugs and titles", async () => {
            const pages = [
                { slug: "faq", title: "FAQ", updatedAt: new Date() },
                { slug: "about", title: "About", updatedAt: new Date() },
            ];
            mockPageContent.find.mockResolvedValue(pages);

            const result = await getAllContent();

            expect(result).toHaveLength(2);
            expect(mockPageContent.find).toHaveBeenCalledWith({}, "slug title updatedAt");
        });
    });
});
