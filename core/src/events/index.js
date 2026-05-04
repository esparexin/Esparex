"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.lifecycleEvents = exports.initializeEventDispatcher = void 0;
const logger_1 = __importDefault(require("@core/utils/logger"));
const CacheInvalidationListener_1 = require("./listeners/CacheInvalidationListener");
const SearchIndexListener_1 = require("./listeners/SearchIndexListener");
const WebsocketNotifierListener_1 = require("./listeners/WebsocketNotifierListener");
const NotificationTriggerListener_1 = require("./listeners/NotificationTriggerListener");
const SellerListingNotificationListener_1 = require("./listeners/SellerListingNotificationListener");
const CatalogPromotionListener_1 = require("./listeners/CatalogPromotionListener");
/**
 * Initializes the Central Lifecycle Event System
 * Registers all domain subscribers to the Event Bus.
 */
const initializeEventDispatcher = () => {
    try {
        (0, CacheInvalidationListener_1.registerCacheInvalidationListener)();
        (0, SearchIndexListener_1.registerSearchIndexListener)();
        (0, WebsocketNotifierListener_1.registerWebsocketNotifierListener)();
        (0, NotificationTriggerListener_1.registerNotificationTriggerListener)();
        (0, SellerListingNotificationListener_1.registerSellerListingNotificationListener)();
        (0, CatalogPromotionListener_1.installCatalogPromotionListener)();
        logger_1.default.info('🎯 [LifecycleEventSystem] Successfully initialized all dispatch listeners.');
    }
    catch (error) {
        logger_1.default.error('Failed to initialize LifecycleEventSystem:', { error });
    }
};
exports.initializeEventDispatcher = initializeEventDispatcher;
// Export the central bus for immediate use
var LifecycleEventDispatcher_1 = require("./LifecycleEventDispatcher");
Object.defineProperty(exports, "lifecycleEvents", { enumerable: true, get: function () { return LifecycleEventDispatcher_1.lifecycleEvents; } });
//# sourceMappingURL=index.js.map