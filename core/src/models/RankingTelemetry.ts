import mongoose, { Schema, Document } from 'mongoose';

export interface IRankingTelemetry extends Document {
    eventId: string;
    adId: mongoose.Types.ObjectId;
    position: number;
    rankScore: number;
    components: {
        qualityScore?: number;
        distanceScore?: number;
        freshnessScore?: number;
        sellerTrust?: number;
        popularityScore?: number;
    };
    createdAt: Date;
}

const RankingTelemetrySchema = new Schema({
    eventId: { type: String, required: true },
    adId: { type: Schema.Types.ObjectId, ref: 'Ad' },
    position: { type: Number },
    rankScore: { type: Number },
    components: {
        qualityScore: { type: Number },
        distanceScore: { type: Number },
        freshnessScore: { type: Number },
        sellerTrust: { type: Number },
        popularityScore: { type: Number }
    },
    // TTL index: documents automatically expire after 7 days
    createdAt: { type: Date, default: Date.now, expires: '7d' }
});

export default mongoose.model<IRankingTelemetry>('RankingTelemetry', RankingTelemetrySchema);
