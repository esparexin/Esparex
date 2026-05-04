"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const db_1 = require("@core/config/db");
const schemaOptions_1 = require("@core/utils/schemaOptions");
const ContactSubmissionSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    mobile: { type: String },
    subject: { type: String },
    category: { type: String },
    message: { type: String, required: true },
    status: { type: String, enum: ['new', 'read', 'replied'], default: 'new' }
}, { timestamps: true });
(0, schemaOptions_1.applyToJSONTransform)(ContactSubmissionSchema);
const connection = (0, db_1.getUserConnection)();
const ContactSubmission = connection.models.ContactSubmission ||
    connection.model('ContactSubmission', ContactSubmissionSchema);
exports.default = ContactSubmission;
//# sourceMappingURL=ContactSubmission.js.map