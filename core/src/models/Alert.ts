import mongoose, { Schema, Document } from 'mongoose';

export interface IAlert extends Document {
    type: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    service: string;
    message: string;
    traceId?: string;
    metadata?: Record<string, any>;
    count: number;
    lastTriggeredAt: Date;
    resolved: boolean;
    resolvedAt?: Date;
    resolvedBy?: string;
}

const AlertSchema: Schema = new Schema({
    type: { type: String, required: true, index: true },
    severity: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], required: true, index: true },
    service: { type: String, required: true, index: true },
    message: { type: String, required: true },
    traceId: { type: String, index: true },
    metadata: { type: Schema.Types.Mixed },
    count: { type: Number, default: 1 },
    lastTriggeredAt: { type: Date, default: Date.now, index: true },
    resolved: { type: Boolean, default: false, index: true },
    resolvedAt: { type: Date },
    resolvedBy: { type: String }
}, {
    timestamps: true,
    collection: 'alerts'
});

// Create a compound index for grouping similar active alerts
AlertSchema.index({ type: 1, service: 1, resolved: 1 });

const Alert = mongoose.model<IAlert>('Alert', AlertSchema);
export default Alert;
