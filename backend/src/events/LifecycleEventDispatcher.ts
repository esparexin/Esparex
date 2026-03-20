import EventEmitter from 'events';
import logger from '../utils/logger';

// ---------------------------------------------------------
// Event Payload Definitions
// ---------------------------------------------------------

export interface AdStatusChangedEvent {
    adId: string;
    fromStatus: string;
    toStatus: string;
    actorType: string;
    actorId?: string;
    source?: string;
    reason?: string;
}

export interface AdExpiredBulkEvent {
    count: number;
    source: string;
}

export interface AdSpotlightExpiredEvent {
    count: number;
    source: string;
}

export interface ListingApprovedEvent {
    listingId: string;
    listingType: string;
    approvedAt: string;
    actorType: string;
    actorId?: string;
    source: string;
}

export interface ListingExpiredBulkEvent {
    count: number;
    listingIds: string[];
    source: string;
}

export interface LifecycleEventMap {
    'ad.lifecycle.changed': AdStatusChangedEvent;
    'ad.expired.bulk': AdExpiredBulkEvent;
    'ad.spotlight.expired': AdSpotlightExpiredEvent;
    'listing.approved': ListingApprovedEvent;
    'listing.expired.bulk': ListingExpiredBulkEvent;
}

type EventKey = keyof LifecycleEventMap;
type EventHandler<K extends EventKey> = (payload: LifecycleEventMap[K]) => Promise<void> | void;

const PROTECTED_EVENT_SOURCE_MARKERS: Partial<Record<EventKey, string[]>> = {
    'ad.lifecycle.changed': ['StatusMutationService.ts', 'StatusMutationService.js'],
    'listing.approved': ['StatusMutationService.ts', 'StatusMutationService.js'],
    'ad.expired.bulk': ['StatusMutationService.ts', 'StatusMutationService.js'],
    'listing.expired.bulk': ['ListingExpiryService.ts', 'ListingExpiryService.js'],
    'ad.spotlight.expired': ['adStatusService.ts', 'adStatusService.js'],
};

const validateEventSource = <K extends EventKey>(eventName: K): { allowedMarkers: string[]; stack: string } | null => {
    const allowedMarkers = PROTECTED_EVENT_SOURCE_MARKERS[eventName];
    if (!allowedMarkers || allowedMarkers.length === 0) return null;

    const stack = new Error().stack || '';
    const isAllowed = allowedMarkers.some((marker) => stack.includes(marker));
    if (isAllowed) return null;

    return {
        allowedMarkers,
        stack,
    };
};

/**
 * 🛠️ Lifecycle Event Dispatcher
 * 
 * Centralized Event Bus for cross-domain side-effects (Caches, Search, Websockets).
 * Guarantees that secondary system actions (like cache invalidation) do not block or 
 * break the primary DB mutation transactions.
 */
class LifecycleEventDispatcher {
    private emitter: EventEmitter;

    constructor() {
        this.emitter = new EventEmitter();
        // Increase limit slightly to accommodate multiple subsystems
        this.emitter.setMaxListeners(20);
    }

    /**
     * Subscribe to a lifecycle event
     */
    public on<K extends EventKey>(eventName: K, handler: EventHandler<K>, listenerName?: string): void {
        this.emitter.on(eventName, async (payload: LifecycleEventMap[K]) => {
            try {
                await Promise.resolve(handler(payload));
            } catch (error) {
                logger.error(`[LifecycleEventDispatcher] Error in listener '${listenerName || 'Anonymous'}' for event '${eventName}':`, {
                    error: error instanceof Error ? error.message : String(error),
                    payload
                });
            }
        });
    }

    /**
     * Dispatch a lifecycle event
     * Note: Does not await listeners. Execution is totally decoupled from mutations.
     */
    public async dispatch<K extends EventKey>(eventName: K, payload: LifecycleEventMap[K]): Promise<void> {
        const sourceViolation = validateEventSource(eventName);
        if (sourceViolation) {
            logger.error('[LifecycleEventDispatcher] Blocked lifecycle event emit from non-SSOT source.', {
                eventName,
                allowedMarkers: sourceViolation.allowedMarkers,
                payload,
            });
            if (process.env.NODE_ENV !== 'production') {
                logger.error('[LifecycleEventDispatcher][PANIC_DEV] Invalid lifecycle emit stack detected.', {
                    eventName,
                    stack: sourceViolation.stack,
                });
            }
            return;
        }

        logger.debug(`[LifecycleEventDispatcher] Dispatching ${eventName}`, { payload });
        
        // Use setImmediate to fully decouple the event processing from 
        // the active MongoDB connection or synchronous execution context.
        setImmediate(() => {
            try {
                this.emitter.emit(eventName, payload);
            } catch (error) {
                logger.error(`[LifecycleEventDispatcher] Failed to emit ${eventName}:`, {
                   error: error instanceof Error ? error.message : String(error)
                });
            }
        });
    }
}

// Singleton instantiation
export const lifecycleEvents = new LifecycleEventDispatcher();
