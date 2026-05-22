import mongoose, { Schema, Document, Model } from 'mongoose';
import { getUserConnection } from '../config/db';

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
        catalogTrustScore?: number;
        resultConfidenceScore?: number;
        canonicalCertaintyScore?: number;
        aliasTrustScore?: number;
        synonymTrustScore?: number;
        transliterationConfidenceScore?: number;
        duplicateConfidenceScore?: number;
        popularityConfidenceScore?: number;
        anomalyScore?: number;
        crawlQualityScore?: number;
        searchSatisfactionScore?: number;
        rankingQualityScore?: number;
        autocompleteConfidenceScore?: number;
        queryFrustrationScore?: number;
        behaviorAnomalyScore?: number;
        intentConfidenceScore?: number;
        replayRegressionScore?: number;
        fairnessQualityScore?: number;
        diversityScore?: number;
        longTailExposureScore?: number;
        canonicalDominanceScore?: number;
        autocompleteDiversityScore?: number;
        popularityConcentrationScore?: number;
        metricIntegrityScore?: number;
        experimentConfidenceScore?: number;
        behavioralOverfitRisk?: number;
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
        popularityScore: { type: Number },
        catalogTrustScore: { type: Number },
        resultConfidenceScore: { type: Number },
        canonicalCertaintyScore: { type: Number },
        aliasTrustScore: { type: Number },
        synonymTrustScore: { type: Number },
        transliterationConfidenceScore: { type: Number },
        duplicateConfidenceScore: { type: Number },
        popularityConfidenceScore: { type: Number },
        anomalyScore: { type: Number },
        crawlQualityScore: { type: Number },
        searchSatisfactionScore: { type: Number },
        rankingQualityScore: { type: Number },
        autocompleteConfidenceScore: { type: Number },
        queryFrustrationScore: { type: Number },
        behaviorAnomalyScore: { type: Number },
        intentConfidenceScore: { type: Number },
        replayRegressionScore: { type: Number },
        fairnessQualityScore: { type: Number },
        diversityScore: { type: Number },
        longTailExposureScore: { type: Number },
        canonicalDominanceScore: { type: Number },
        autocompleteDiversityScore: { type: Number },
        popularityConcentrationScore: { type: Number },
        metricIntegrityScore: { type: Number },
        experimentConfidenceScore: { type: Number },
        behavioralOverfitRisk: { type: Number }
    },
    // TTL index: documents automatically expire after 7 days
    createdAt: { type: Date, default: Date.now }
});

RankingTelemetrySchema.index({ createdAt: 1 }, { name: 'idx_rankingtelemetry_createdAt_ttl', expireAfterSeconds: 604800 });

const RankingTelemetry: Model<IRankingTelemetry> = (getUserConnection().models.RankingTelemetry as Model<IRankingTelemetry> | undefined) || getUserConnection().model<IRankingTelemetry>('RankingTelemetry', RankingTelemetrySchema);

export default RankingTelemetry;
