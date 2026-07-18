import { EventEmitter } from 'events';

export interface IntegrationEvent {
    readonly eventName: string;
    readonly occurredOn: Date;
    readonly correlationId?: string;
}

type EventHandler<T extends IntegrationEvent> = (event: T) => void | Promise<void>;

export class IntegrationEventBus {
    private emitter: EventEmitter;

    constructor() {
        this.emitter = new EventEmitter();
        this.emitter.setMaxListeners(50);
    }

    public subscribe<T extends IntegrationEvent>(eventName: string, handler: EventHandler<T>): void {
        this.emitter.on(eventName, (event: T) => {
            void Promise.resolve(handler(event)).catch(error => {
                console.error(`[IntegrationEventBus] Error in handler for ${eventName}:`, error);
            });
        });
    }

    public publish<T extends IntegrationEvent>(event: T): void {
        setImmediate(() => {
            try {
                this.emitter.emit(event.eventName, event);
            } catch (error) {
                console.error(`[IntegrationEventBus] Failed to emit ${event.eventName}:`, error);
            }
        });
    }
}

export const integrationEventBus = new IntegrationEventBus();
