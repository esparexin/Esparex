/**
 * @since v1.0.0
 */
export type RuntimePermission =
  | "filesystem"
  | "network"
  | "events"
  | "dashboard"
  | "skills"
  | "governance"
  | "runtime"
  | "reports";

/**
 * @since v1.0.0
 */
export type PluginCapability =
  | "governance"
  | "dashboard"
  | "cli"
  | "ai"
  | "runtime"
  | "report";

/**
 * @since v1.0.0
 */
export type PluginStatus =
  | "installed"
  | "enabled"
  | "disabled"
  | "failed"
  | "incompatible"
  | "pending";

/**
 * @since v1.0.0
 */
export interface RuntimeVersionRange {
  readonly minimum: string;
  readonly maximum?: string;
}

/**
 * @since v1.0.0
 */
export interface PluginManifest {
  readonly id: string;
  readonly version: string;
  readonly displayName: string;
  readonly description: string;
  readonly homepage?: string;
  readonly license?: string;
  readonly tags?: readonly string[];
  readonly category: string;
  readonly runtime: RuntimeVersionRange;
  readonly permissions: readonly RuntimePermission[];
  readonly capabilities: readonly PluginCapability[];
}

/**
 * RepositoryRuntimeApi (v1.0)
 *
 * The official stable facade API injected into plugins.
 * Ensures plugins remain compile-time safe and decouple from lower-level packages.
 *
 * @since v1.0.0
 */
export interface RepositoryRuntimeApi {
  /** @since v1.0.0 */
  scan(): Promise<any>;
  
  /** @since v1.0.0 */
  snapshot(): any | null;
  
  /** @since v1.0.0 */
  health(): Promise<any>;
  
  /** @since v1.0.0 */
  validate(profile?: string): Promise<any>;
  
  /** @since v1.0.0 */
  detectDrift(): Promise<any>;
  
  /** @since v1.0.0 */
  runSkill(skillId: string, input: Record<string, unknown>, options?: { dryRun?: boolean }): Promise<any>;
  
  /** @since v1.0.0 */
  ask(request: any): Promise<any>;
  
  /**
   * Strongly typed EventBus subscription wrapper managed by the registry.
   * Disabling the plugin automatically cleans up all subscriptions registered via this method.
   *
   * @since v1.0.0
   */
  subscribe(event: string, handler: (payload: any) => void | Promise<void>): () => void;
}

/**
 * RepositoryPlugin (v1.0)
 *
 * Every plugin extension must implement this interface.
 * Exposes core lifecycle hooks: initialize, enable, disable, and dispose.
 *
 * @since v1.0.0
 */
export interface RepositoryPlugin {
  readonly manifest: PluginManifest;
  
  /** @since v1.0.0 */
  initialize(runtime: RepositoryRuntimeApi): Promise<void>;
  
  /** @since v1.0.0 */
  enable(): Promise<void>;
  
  /** @since v1.0.0 */
  disable(): Promise<void>;
  
  /** @since v1.0.0 */
  dispose(): Promise<void>;
}
