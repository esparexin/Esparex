import {
  RepositoryPlugin,
  RepositoryRuntimeApi,
  PluginStatus
} from "@esparex/repository-plugin-sdk";
import { RepositoryRuntime } from "../sdk/runtime-sdk.js";

export interface PluginWrapper {
  readonly plugin: RepositoryPlugin;
  status: PluginStatus;
  error?: string;
}

/**
 * ExtensionRegistry (v1.0)
 *
 * Implements the lifecycle registry, validation, and execution scopes of
 * plugins. Handles automatic EventBus subscription cleanup proxying to
 * prevent memory leaks when modules are deactivated.
 *
 * @since v1.0.0
 */
export class ExtensionRegistry {
  private readonly plugins = new Map<string, PluginWrapper>();
  
  // Tracks active event unsubscription callbacks by plugin ID
  private readonly eventUnsubscribers = new Map<string, Set<() => void>>();

  constructor(
    private readonly runtime: RepositoryRuntime
  ) {}

  /**
   * Registers a plugin, performs version compatibility checks, and
   * initialises the plugin lifecycle hook.
   *
   * @since v1.0.0
   */
  async register(plugin: RepositoryPlugin): Promise<void> {
    const manifest = plugin.manifest;
    
    if (this.plugins.has(manifest.id)) {
      throw new Error(`ExtensionRegistry: plugin with ID "${manifest.id}" is already registered.`);
    }

    const wrapper: PluginWrapper = {
      plugin,
      status: "pending"
    };
    this.plugins.set(manifest.id, wrapper);

    // 1. Version Range Validation
    const runtimeVersion = "1.0.0"; // Current platform version contract
    const min = manifest.runtime.minimum;
    const max = manifest.runtime.maximum;

    // Simple semver compare check (reference loader version mapping)
    const isTooOld = min > runtimeVersion;
    const isTooNew = max ? max < runtimeVersion : false;

    if (isTooOld || isTooNew) {
      wrapper.status = "incompatible";
      wrapper.error = `Incompatible: requires runtime range [${min} to ${max || "latest"}], but current is "${runtimeVersion}".`;
      return;
    }

    // 2. Initialize Plugin lifecycle
    try {
      // Create isolated API proxy for EventBus unsubscription tracking
      const apiProxy = this.createApiProxy(manifest.id);
      
      await plugin.initialize(apiProxy);
      wrapper.status = "installed";
    } catch (err: any) {
      wrapper.status = "failed";
      wrapper.error = `Initialization failed: ${err.message}`;
      throw err;
    }
  }

  /**
   * Activates and enables a registered plugin.
   *
   * @since v1.0.0
   */
  async enable(id: string): Promise<void> {
    const wrapper = this.plugins.get(id);
    if (!wrapper) {
      throw new Error(`ExtensionRegistry: plugin "${id}" is not registered.`);
    }

    if (wrapper.status === "enabled") return;
    if (wrapper.status === "incompatible" || wrapper.status === "failed") {
      throw new Error(`ExtensionRegistry: cannot enable plugin "${id}" because its state is "${wrapper.status}".`);
    }

    try {
      await wrapper.plugin.enable();
      wrapper.status = "enabled";
    } catch (err: any) {
      wrapper.status = "failed";
      wrapper.error = `Enable failed: ${err.message}`;
      throw err;
    }
  }

  /**
   * Disables a plugin, invokes deactivation hooks, and cleans up all EventBus listeners.
   *
   * @since v1.0.0
   */
  async disable(id: string): Promise<void> {
    const wrapper = this.plugins.get(id);
    if (!wrapper) {
      throw new Error(`ExtensionRegistry: plugin "${id}" is not registered.`);
    }

    if (wrapper.status !== "enabled") return;

    // 1. Invoke deactivation hook
    try {
      await wrapper.plugin.disable();
    } catch (err: any) {
      console.warn(`[ExtensionRegistry Warning] Disable hook for "${id}" failed:`, err.message);
    }

    // 2. Automatic EventBus unsubscriptions cleanup
    this.cleanupEvents(id);

    wrapper.status = "disabled";
  }

  /**
   * Disables, disposes and removes a registered plugin from memory.
   *
   * @since v1.0.0
   */
  async uninstall(id: string): Promise<void> {
    const wrapper = this.plugins.get(id);
    if (!wrapper) return;

    // Force disable first to clean subscriptions
    if (wrapper.status === "enabled") {
      await this.disable(id);
    }

    // Invoke dispose lifecycle hook
    try {
      await wrapper.plugin.dispose();
    } catch (err: any) {
      console.warn(`[ExtensionRegistry Warning] Dispose hook for "${id}" failed:`, err.message);
    }

    this.plugins.delete(id);
  }

  /** Retrieves a plugin wrapper status by ID. */
  get(id: string): PluginWrapper | undefined {
    return this.plugins.get(id);
  }

  /** Lists all wrappers. */
  list(): readonly PluginWrapper[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Cleans up all event bus handle callbacks for a plugin.
   */
  private cleanupEvents(pluginId: string): void {
    const unsubscribers = this.eventUnsubscribers.get(pluginId);
    if (unsubscribers) {
      for (const unsub of unsubscribers) {
        try {
          unsub();
        } catch {
          // Ignore unsubscribe errors
        }
      }
      this.eventUnsubscribers.delete(pluginId);
    }
  }

  /**
   * Proxy generator that injects a wrapper and tracks subscriptions automatically.
   */
  private createApiProxy(pluginId: string): RepositoryRuntimeApi {
    const self = this;
    const runtime = this.runtime;

    return {
      scan: () => runtime.scan(),
      snapshot: () => runtime.snapshot(),
      health: () => runtime.health(),
      validate: (profile) => runtime.validate(profile),
      detectDrift: () => runtime.detectDrift(),
      runSkill: (skillId, input, options) => runtime.runSkill(skillId, input, options),
      ask: (request) => runtime.ask(request),
      
      // automatic event subscription interception
      subscribe(event, handler) {
        const unsub = runtime.eventBus.subscribe(event as any, handler);
        
        if (!self.eventUnsubscribers.has(pluginId)) {
          self.eventUnsubscribers.set(pluginId, new Set());
        }
        self.eventUnsubscribers.get(pluginId)!.add(unsub);
        
        return () => {
          unsub();
          const set = self.eventUnsubscribers.get(pluginId);
          if (set) {
            set.delete(unsub);
          }
        };
      }
    };
  }
}
