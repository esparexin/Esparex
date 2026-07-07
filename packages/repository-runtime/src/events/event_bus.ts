import { RuntimeEventName, RuntimeEventHandler, RuntimeEventPayload } from "./event_types.js";

/**
 * Strongly typed Pub/Sub Event Bus for the Esparex AI platform runtime.
 *
 * Why an Event Bus?
 *   It allows future platform extension and automated workflows (e.g., auto-triggering
 *   governance checks or generating alerts in an IDE) to hook into lifecycle changes
 *   without coupling the orchestrator to specific listeners.
 */
export class EventBus {
  private listeners: Map<RuntimeEventName, Set<RuntimeEventHandler<any>>> = new Map();

  /**
   * Subscribe to a specific runtime event.
   */
  subscribe<T extends RuntimeEventName>(event: T, handler: RuntimeEventHandler<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);

    // Return a function to easily unsubscribe
    return () => {
      const set = this.listeners.get(event);
      if (set) {
        set.delete(handler);
        if (set.size === 0) {
          this.listeners.delete(event);
        }
      }
    };
  }

  /**
   * Publish an event to all active subscribers.
   * Handles asynchronous handlers safely and returns a Promise that resolves when all handlers complete.
   */
  async publish<T extends RuntimeEventName>(event: T, payload: RuntimeEventPayload<T>): Promise<void> {
    const set = this.listeners.get(event);
    if (!set || set.size === 0) return;

    const promises: Promise<void>[] = [];
    for (const handler of set) {
      try {
        const res = handler(payload);
        if (res instanceof Promise) {
          promises.push(res);
        }
      } catch (err) {
        console.error(`[Event Bus Error] Handler for event "${event}" threw:`, err);
      }
    }

    if (promises.length > 0) {
      await Promise.allSettled(promises);
    }
  }

  /**
   * Clears all subscribers (primarily used for cleanup in tests).
   */
  clear(): void {
    this.listeners.clear();
  }
}
