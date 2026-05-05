import logger from '../../utils/logger';
import { lifecycleEvents } from '../LifecycleEventDispatcher';

export const registerWebsocketNotifierListener = () => {
    
    lifecycleEvents.on('ad.lifecycle.changed', (payload) => {
        // STUB: Publish to websocket pub/sub here
        // e.g. wsServer.to('admin_dashboard').emit('ad_count_update', { delta: 1 })
        logger.debug(`[WebsocketNotifierListener] (Stub) Pushing stat updates for ad ${payload.adId} to UI.`);
    }, 'WebsocketNotifierListener_AdStatusChanged');

    logger.info('[WebsocketNotifierListener] Registered successfully.');
};
