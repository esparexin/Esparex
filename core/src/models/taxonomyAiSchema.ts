import { Schema } from 'mongoose';

export const TaxonomyAiAnalysisSchema = new Schema({
    categorySuggestion: { type: String },
    brandSuggestion: { type: String },
    modelSuggestion: { type: String },
    variantSuggestion: { type: String },
    variantAttributes: { type: Map, of: String },
    confidence: { type: Number, required: true },
    explanation: { type: String },
    provider: { type: String },
    model: { type: String },
    analyzedAt: { type: Date, default: Date.now },
    promptVersion: { type: String }
}, { _id: false });

export const TaxonomyAiDecisionSchema = new Schema({
    autoAccepted: { type: Boolean, default: false },
    requiresReview: { type: Boolean, default: true },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'Admin' },
    reviewedAt: { type: Date }
}, { _id: false });
