"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveSparePartListing = saveSparePartListing;
exports.generateUniqueSparePartSlug = generateUniqueSparePartSlug;
const Ad_1 = __importDefault(require("@core/models/Ad"));
const slugGenerator_1 = require("@core/utils/slugGenerator");
async function saveSparePartListing(listing) {
    return listing.save();
}
async function generateUniqueSparePartSlug(title, listingId) {
    return (0, slugGenerator_1.generateUniqueSlug)(Ad_1.default, title, listingId);
}
//# sourceMappingURL=SparePartListingService.js.map