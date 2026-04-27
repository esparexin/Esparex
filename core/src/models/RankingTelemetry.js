"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const RankingTelemetrySchema = new mongoose_1.Schema({
    eventId: { type: String, required: true },
    adId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Ad' },
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
exports.default = mongoose_1.default.model('RankingTelemetry', RankingTelemetrySchema);
//# sourceMappingURL=RankingTelemetry.js.map