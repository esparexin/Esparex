"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Counter = void 0;
// core/src/models/Counter.ts
const mongoose_1 = require("mongoose");
const db_1 = require("@core/config/db");
const schemaOptions_1 = require("@core/utils/schemaOptions");
const CounterSchema = new mongoose_1.Schema({
    key: { type: String, required: true },
    value: { type: Number, default: 0 }
});
/* -------------------------------------------------------------------------- */
/* Indexes (Explicitly Named)                                                 */
/* -------------------------------------------------------------------------- */
CounterSchema.index({ key: 1 }, { name: 'idx_counter_key_unique_idx', unique: true });
const connection = (0, db_1.getUserConnection)();
exports.Counter = connection.models.Counter ||
    connection.model("Counter", CounterSchema);
(0, schemaOptions_1.applyToJSONTransform)(CounterSchema);
exports.default = exports.Counter;
//# sourceMappingURL=Counter.js.map