"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerWebsocketNotifierListener = void 0;
const logger_1 = __importDefault(require("@core/utils/logger"));
const LifecycleEventDispatcher_1 = require("../LifecycleEventDispatcher");
const registerWebsocketNotifierListener = () => {
    LifecycleEventDispatcher_1.lifecycleEvents.on('ad.lifecycle.changed', (payload) => {
        // STUB: Publish to websocket pub/sub here
        // e.g. wsServer.to('admin_dashboard').emit('ad_count_update', { delta: 1 })
        logger_1.default.debug(`[WebsocketNotifierListener] (Stub) Pushing stat updates for ad ${payload.adId} to UI.`);
    }, 'WebsocketNotifierListener_AdStatusChanged');
    logger_1.default.info('[WebsocketNotifierListener] Registered successfully.');
};
exports.registerWebsocketNotifierListener = registerWebsocketNotifierListener;
//# sourceMappingURL=WebsocketNotifierListener.js.map