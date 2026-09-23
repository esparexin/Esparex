import { Schema, Document, Model } from "mongoose";
import { getAdminConnection } from "../config/db";
import {
    AD_PLACEMENT_LOCATION,
    AD_FORMAT,
    GOOGLE_AD_STATUS,
    AD_FALLBACK_STRATEGY,
    type AdPlacementLocationValue,
    type AdFormatValue,
    type GoogleAdStatusValue,
    type AdFallbackStrategyValue,
} from "@esparex/contracts";

export interface IGoogleAdPlacement extends Document {
    placementKey: string;
    name: string;
    adSlotId: string;
    publisherClientId?: string;
    location: AdPlacementLocationValue;
    format: AdFormatValue;
    status: GoogleAdStatusValue;
    viewports: ("desktop" | "tablet" | "mobile")[];
    priority: number;
    fallbackStrategy: AdFallbackStrategyValue;
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
        placementKey: { type: String, required: true, trim: true },
        name: { type: String, required: true, trim: true },
        adSlotId: { type: String, required: true, trim: true },
        publisherClientId: { type: String, trim: true },
        location: {
            type: String,
            required: true,
            enum: Object.values(AD_PLACEMENT_LOCATION),
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
        isDeleted: { type: Boolean, default: false },
    },
    {
        timestamps: true,
    }
);

/* -------------------------------------------------------------------------- */
/* Indexes (Explicitly Named per Index Governance SSOT)                       */
/* -------------------------------------------------------------------------- */

GoogleAdPlacementSchema.index(
    { placementKey: 1 },
    { name: "idx_googleadplacement_placementkey_unique_idx", unique: true }
);
GoogleAdPlacementSchema.index(
    { location: 1 },
    { name: "idx_googleadplacement_location_idx" }
);
GoogleAdPlacementSchema.index(
    { status: 1 },
    { name: "idx_googleadplacement_status_idx" }
);
GoogleAdPlacementSchema.index(
    { isDeleted: 1 },
    { name: "idx_googleadplacement_isdeleted_idx" }
);
GoogleAdPlacementSchema.index(
    { status: 1, isDeleted: 1, priority: -1 },
    { name: "idx_googleadplacement_status_deleted_priority_idx" }
);

const connection = getAdminConnection();
const GoogleAdPlacement: Model<IGoogleAdPlacement> =
    (connection.models.GoogleAdPlacement as Model<IGoogleAdPlacement> | undefined) ||
    connection.model<IGoogleAdPlacement>("GoogleAdPlacement", GoogleAdPlacementSchema);

export default GoogleAdPlacement;
