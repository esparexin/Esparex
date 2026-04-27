"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const db_1 = require("@core/config/db");
const schemaOptions_1 = require("@core/utils/schemaOptions");
const PageContentSchema = new mongoose_1.Schema({
    slug: { type: String, required: true },
    title: { type: String, required: true },
    content: { type: String },
    items: [{
            question: { type: String },
            answer: { type: String },
            order: { type: Number, default: 0 }
        }],
    metadata: { type: Map, of: mongoose_1.Schema.Types.Mixed },
    updatedBy: { type: String },
}, {
    timestamps: true,
    collection: 'page_content'
});
/* -------------------------------------------------------------------------- */
/* Indexes (Explicitly Named)                                                 */
/* -------------------------------------------------------------------------- */
PageContentSchema.index({ slug: 1 }, { name: 'idx_pagecontent_slug_unique_idx', unique: true });
const connection = (0, db_1.getAdminConnection)();
const PageContent = connection.models.PageContent ||
    connection.model('PageContent', PageContentSchema);
(0, schemaOptions_1.applyToJSONTransform)(PageContentSchema);
exports.default = PageContent;
//# sourceMappingURL=PageContent.js.map