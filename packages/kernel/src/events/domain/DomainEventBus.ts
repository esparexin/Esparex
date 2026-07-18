import { EventEmitter } from 'events';

export interface DomainEvent {
    readonly eventName: string;
    readonly occurredOn: Date;
}

type EventHandler<T extends DomainEvent> = (event: T) => void | Promise<void>;

export class DomainEventBus {
    private emitter: EventEmitter;

    constructor() {
        this.emitter = new EventEmitter();
        this.emitter.setMaxListeners(50);
    }

    public subscribe<T extends DomainEvent>(eventName: string, handler: EventHandler<T>): void {
        this.emitter.on(eventName, (event: T) => {
            void Promise.resolve(handler(event)).catch(error => {
                console.error(`[DomainEventBus] Error in handler for ${eventName}:`, error);
            });
        });
    }

    public publish<T extends DomainEvent>(event: T): void {
        // Decouple event publishing from the current transaction/execution context
        setImmediate(() => {
            try {
                this.emitter.emit(event.eventName, event);
            } catch (error) {
                console.error(`[DomainEventBus] Failed to emit ${event.eventName}:`, error);
            }
        });
    }
}

export const domainEventBus = new DomainEventBus();
