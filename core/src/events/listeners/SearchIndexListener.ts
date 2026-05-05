import logger from '../../utils/logger';
import { lifecycleEvents } from '../LifecycleEventDispatcher';

export const registerSearchIndexListener = () => {

    lifecycleEvents.on('ad.lifecycle.changed', (payload) => {
        // STUB: Sync with Elasticsearch / Meilisearch / Algolia
        if (payload.toStatus === 'live') {
            logger.debug(`[SearchIndexListener] (Stub) Upserting ad ${payload.adId} into Search Index.`);
        } else {
            logger.debug(`[SearchIndexListener] (Stub) Removing ad ${payload.adId} from Search Index.`);
        }
    }, 'SearchIndexListener_AdStatusChanged');

    lifecycleEvents.on('ad.expired.bulk', (payload) => {
        // STUB: Bulk sweep expired ads from index
        logger.debug(`[SearchIndexListener] (Stub) Queuing background sweep to purge Search Index of ${payload.count} expired ads.`);
    }, 'SearchIndexListener_AdExpiredBulk');

    logger.info('[SearchIndexListener] Registered successfully.');
};
