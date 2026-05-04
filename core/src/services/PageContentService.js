"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllContent = exports.upsertContentBySlug = exports.findContentBySlug = void 0;
const PageContent_1 = __importDefault(require("@core/models/PageContent"));
const findContentBySlug = async (slug) => {
    return PageContent_1.default.findOne({ slug });
};
exports.findContentBySlug = findContentBySlug;
const upsertContentBySlug = async (slug, data) => {
    return PageContent_1.default.findOneAndUpdate({ slug }, { ...data }, { new: true, upsert: true, runValidators: true });
};
exports.upsertContentBySlug = upsertContentBySlug;
const getAllContent = async () => {
    return PageContent_1.default.find({}, 'slug title updatedAt');
};
exports.getAllContent = getAllContent;
//# sourceMappingURL=PageContentService.js.map