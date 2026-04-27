"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createContactSubmission = createContactSubmission;
const ContactSubmission_1 = __importDefault(require("@core/models/ContactSubmission"));
async function createContactSubmission(input) {
    return ContactSubmission_1.default.create({
        name: input.name,
        email: input.email,
        mobile: input.mobile,
        subject: input.subject,
        category: input.category,
        message: input.message,
        status: 'new',
    });
}
//# sourceMappingURL=ContactService.js.map