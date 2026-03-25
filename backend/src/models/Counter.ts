// backend/src/models/Counter.ts
import { Schema, Document } from "mongoose";
import { getUserConnection } from "../config/db";
import type { Model } from "mongoose";
import { applyToJSONTransform } from '../utils/schemaOptions';

export interface ICounter extends Document {
    key: string;
    value: number;
}

const CounterSchema = new Schema<ICounter>({
    key: { type: String, required: true },
    value: { type: Number, default: 0 }
});

/* -------------------------------------------------------------------------- */
/* Indexes (Explicitly Named)                                                 */
/* -------------------------------------------------------------------------- */

CounterSchema.index({ key: 1 }, { name: 'idx_counter_key_unique_idx', unique: true });

const connection = getUserConnection();
export const Counter: Model<ICounter> =
    (connection.models.Counter as Model<ICounter>) ||
    connection.model<ICounter>("Counter", CounterSchema);
applyToJSONTransform(CounterSchema);

export default Counter;
