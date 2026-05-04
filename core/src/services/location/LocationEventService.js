"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLocationEvent = createLocationEvent;
const mongoose_1 = require("mongoose");
const LocationEvent_1 = __importDefault(require("@core/models/LocationEvent"));
async function createLocationEvent(input) {
    const userId = typeof input.userId === 'string' ? new mongoose_1.Types.ObjectId(input.userId) : input.userId;
    const payload = {
        source: input.source,
        city: input.city,
        state: input.state,
        coordinates: input.coordinates,
        reason: input.reason,
    };
    if (userId) {
        payload.userId = userId;
    }
    return LocationEvent_1.default.create(payload);
}
//# sourceMappingURL=LocationEventService.js.map