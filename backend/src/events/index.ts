import logger from '../utils/logger';
import { registerCacheInvalidationListener } from './listeners/CacheInvalidationListener';
import { registerSearchIndexListener } from './listeners/SearchIndexListener';
import { registerWebsocketNotifierListener } from './listeners/WebsocketNotifierListener';
import { registerNotificationTriggerListener } from './listeners/NotificationTriggerListener';

/**
 * Initializes the Central Lifecycle Event System
 * Registers all domain subscribers to the Event Bus.
 */
export const initializeEventDispatcher = () => {
    try {
        registerCacheInvalidationListener();
        registerSearchIndexListener();
        registerWebsocketNotifierListener();
        registerNotificationTriggerListener();
        
        logger.info('🎯 [LifecycleEventSystem] Successfully initialized all dispatch listeners.');
    } catch (error) {
        logger.error('Failed to initialize LifecycleEventSystem:', { error });
    }
};

// Export the central bus for immediate use
export { lifecycleEvents } from './LifecycleEventDispatcher';
