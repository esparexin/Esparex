"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveDuplicateBusinessMessage = exports.sanitizeBusinessForPublic = exports.serializeBusinessForOwner = exports.serializeBusinessForAdmin = exports.serializeBusiness = exports.findBusinessByIdentifier = void 0;
var BusinessCoreService_1 = require("@esparex/core/services/business/BusinessCoreService");
Object.defineProperty(exports, "findBusinessByIdentifier", { enumerable: true, get: function () { return BusinessCoreService_1.findBusinessByIdentifier; } });
var businessSerializer_1 = require("@esparex/core/utils/businessSerializer");
Object.defineProperty(exports, "serializeBusiness", { enumerable: true, get: function () { return businessSerializer_1.serializeBusiness; } });
Object.defineProperty(exports, "serializeBusinessForAdmin", { enumerable: true, get: function () { return businessSerializer_1.serializeBusinessForAdmin; } });
Object.defineProperty(exports, "serializeBusinessForOwner", { enumerable: true, get: function () { return businessSerializer_1.serializeBusinessForOwner; } });
Object.defineProperty(exports, "sanitizeBusinessForPublic", { enumerable: true, get: function () { return businessSerializer_1.sanitizeBusinessForPublic; } });
const resolveDuplicateBusinessMessage = (error) => {
    const duplicateError = error;
    if (duplicateError?.code !== 11000)
        return null;
    const duplicateField = Object.keys(duplicateError.keyPattern || {})[0];
    if (duplicateField === 'userId') {
        return 'You already have a business profile. Please update your existing profile instead.';
    }
    if (duplicateField === 'gstNumber') {
        return 'GST number is already registered with another business profile.';
    }
    if (duplicateField === 'registrationNumber') {
        return 'Registration number is already registered with another business profile.';
    }
    if (duplicateField === 'email') {
        return 'Business email is already registered with another business profile.';
    }
    if (duplicateField === 'mobile') {
        return 'Business mobile number is already registered with another business profile.';
    }
    return 'Duplicate business details detected. Please review and try again.';
};
exports.resolveDuplicateBusinessMessage = resolveDuplicateBusinessMessage;
//# sourceMappingURL=shared.js.map