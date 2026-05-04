"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateInvoiceNumber = generateInvoiceNumber;
const Counter_1 = __importDefault(require("@core/models/Counter"));
/**
 * 🧾 ATOMIC INVOICE NUMBER GENERATOR
 * Format: ESP-YYYY-000001
 * Safety: Uses findOneAndUpdate for atomic increment to prevent collisions.
 */
async function generateInvoiceNumber(session) {
    const counter = await Counter_1.default.findOneAndUpdate({ key: "invoice" }, { $inc: { value: 1 } }, { upsert: true, new: true, session });
    if (!counter) {
        throw new Error("Failed to generate invoice counter");
    }
    const seq = String(counter.value).padStart(6, "0");
    const date = new Date();
    return `ESP-${date.getFullYear()}-${seq}`;
}
//# sourceMappingURL=invoiceNumber.js.map