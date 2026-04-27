"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSearchIndexListener = void 0;
const logger_1 = __importDefault(require("@core/utils/logger"));
const LifecycleEventDispatcher_1 = require("../LifecycleEventDispatcher");
const registerSearchIndexListener = () => {
    LifecycleEventDispatcher_1.lifecycleEvents.on('ad.lifecycle.changed', (payload) => {
        // STUB: Sync with Elasticsearch / Meilisearch / Algolia
        if (payload.toStatus === 'live') {
            logger_1.default.debug(`[SearchIndexListener] (Stub) Upserting ad ${payload.adId} into Search Index.`);
        }
        else {
            logger_1.default.debug(`[SearchIndexListener] (Stub) Removing ad ${payload.adId} from Search Index.`);
        }
    }, 'SearchIndexListener_AdStatusChanged');
    LifecycleEventDispatcher_1.lifecycleEvents.on('ad.expired.bulk', (payload) => {
        // STUB: Bulk sweep expired ads from index
        logger_1.default.debug(`[SearchIndexListener] (Stub) Queuing background sweep to purge Search Index of ${payload.count} expired ads.`);
    }, 'SearchIndexListener_AdExpiredBulk');
    logger_1.default.info('[SearchIndexListener] Registered successfully.');
};
exports.registerSearchIndexListener = registerSearchIndexListener;
//# sourceMappingURL=SearchIndexListener.js.map