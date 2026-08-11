import mongoose, { Schema, Document, Model } from "mongoose";
import {
    AD_PLACEMENT_LOCATION,
    AD_FORMAT,
    GOOGLE_AD_STATUS,
    AD_FALLBACK_STRATEGY,
} from "@esparex/contracts";

export interface IGoogleAdPlacement extends Document {
    placementKey: string;
    name: string;
    adSlotId: string;
    publisherClientId?: string;
    location: string;
    format: string;
    status: string;
    viewports: string[];
    priority: number;
    fallbackStrategy: string;
    fallbackImageUri?: string;
    fallbackTargetUrl?: string;
    startDate?: Date;
    endDate?: Date;
    impressionsCount: number;
    clicksCount: number;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const GoogleAdPlacementSchema = new Schema<IGoogleAdPlacement>(
    {
        placementKey: { type: String, required: true, unique: true, index: true, trim: true },
        name: { type: String, required: true, trim: true },
        adSlotId: { type: String, required: true, trim: true },
        publisherClientId: { type: String, trim: true },
        location: {
            type: String,
            required: true,
            enum: Object.values(AD_PLACEMENT_LOCATION),
            index: true,
        },
        format: {
            type: String,
            required: true,
            enum: Object.values(AD_FORMAT),
        },
        status: {
            type: String,
            required: true,
            enum: Object.values(GOOGLE_AD_STATUS),
            default: GOOGLE_AD_STATUS.ACTIVE,
            index: true,
        },
        viewports: {
            type: [String],
            default: ["desktop", "tablet", "mobile"],
        },
        priority: { type: Number, default: 0 },
        fallbackStrategy: {
            type: String,
            enum: Object.values(AD_FALLBACK_STRATEGY),
            default: AD_FALLBACK_STRATEGY.COLLAPSE,
        },
        fallbackImageUri: { type: String },
        fallbackTargetUrl: { type: String },
        startDate: { type: Date },
        endDate: { type: Date },
        impressionsCount: { type: Number, default: 0 },
        clicksCount: { type: Number, default: 0 },
        isDeleted: { type: Boolean, default: false, index: true },
    },
    {
        timestamps: true,
    }
);

GoogleAdPlacementSchema.index({ location: 1, status: 1, isDeleted: 1 });

const GoogleAdPlacement: Model<IGoogleAdPlacement> =
    mongoose.models.GoogleAdPlacement ||
    mongoose.model<IGoogleAdPlacement>("GoogleAdPlacement", GoogleAdPlacementSchema);

export default GoogleAdPlacement;
