"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toAlertContract = exports.getRequiredAlertId = exports.getErrorMessage = exports.SmartAlertModel = void 0;
const SmartAlertService_1 = require("@esparex/core/services/SmartAlertService");
Object.defineProperty(exports, "SmartAlertModel", { enumerable: true, get: function () { return SmartAlertService_1.SmartAlertModel; } });
const LocationNormalizer_1 = require("@esparex/core/services/location/LocationNormalizer");
const serialize_1 = require("@esparex/core/utils/serialize");
const AppError_1 = require("@esparex/core/utils/AppError");
const getErrorMessage = (error) => error instanceof Error ? error.message : 'Unexpected error';
exports.getErrorMessage = getErrorMessage;
const getRequiredAlertId = (req) => {
    const id = req.params.id;
    if (typeof id !== 'string' || !id.trim()) {
        throw new AppError_1.AppError('Invalid alert ID', 400, 'INVALID_ALERT_ID');
    }
    return id;
};
exports.getRequiredAlertId = getRequiredAlertId;
const toAlertContract = (alert) => {
    const serialized = (0, serialize_1.serializeDoc)(alert);
    const serializedCriteria = (serialized.criteria ?? {});
    const location = (0, LocationNormalizer_1.normalizeLocationResponse)({
        locationId: serializedCriteria.locationId,
        display: serializedCriteria.location,
        city: serializedCriteria.location,
        coordinates: serialized.coordinates
    });
    return {
        ...serialized,
        coordinates: location?.coordinates || serialized.coordinates,
        location: location || undefined,
        criteria: {
            ...serializedCriteria,
            location: location?.display || serializedCriteria.location,
            locationId: location?.id || serializedCriteria.locationId
        }
    };
};
exports.toAlertContract = toAlertContract;
//# sourceMappingURL=shared.js.map