import { Schema, Document, Model } from 'mongoose';
import { getAdminConnection } from '../config/db';
import { applyToJSONTransform } from '../utils/schemaOptions';

export interface IPageContent extends Document {
    slug: string; // 'about', 'faq', 'terms', etc.
    title: string;
    content?: string;
    items?: Array<{
        question: string;
        answer: string;
        order: number;
    }>;
    metadata?: Record<string, unknown>;
    updatedBy?: string;
    updatedAt: Date;
}

const PageContentSchema = new Schema<IPageContent>({
    slug: { type: String, required: true },
    title: { type: String, required: true },
    content: { type: String },
    items: [{
        question: { type: String },
        answer: { type: String },
        order: { type: Number, default: 0 }
    }],
    metadata: { type: Map, of: Schema.Types.Mixed },
    updatedBy: { type: String },
}, {
    timestamps: true,
    collection: 'page_content'
});

/* -------------------------------------------------------------------------- */
/* Indexes (Explicitly Named)                                                 */
/* -------------------------------------------------------------------------- */

PageContentSchema.index({ slug: 1 }, { name: 'idx_pagecontent_slug_unique_idx', unique: true });

const connection = getAdminConnection();
const PageContent: Model<IPageContent> =
    (connection.models.PageContent as Model<IPageContent>) ||
    connection.model<IPageContent>('PageContent', PageContentSchema);

applyToJSONTransform(PageContentSchema);

export default PageContent;
