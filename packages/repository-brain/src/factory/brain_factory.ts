import { RepositoryInventory } from "@esparex/repository-scanner";
import { BrainSnapshot, SnapshotValidationError } from "../schema/index.js";
import { ProviderRegistry } from "../registry/provider_registry.js";

// ─── Snapshot Validator ────────────────────────────────────────────────────
//
// Runs before the snapshot is frozen. Any missing required fields surface
// as a SnapshotValidationError so that Governance never receives a partial
// or corrupt snapshot.
//
class SnapshotValidator {
  static validate(snapshot: BrainSnapshot): void {
    const violations: string[] = [];

    if (!snapshot.metadata.schemaVersion) violations.push("metadata.schemaVersion is required");
    if (!snapshot.metadata.brainVersion) violations.push("metadata.brainVersion is required");
    if (!snapshot.metadata.repositoryName) violations.push("metadata.repositoryName is required");
    if (!snapshot.metadata.inventoryHash) violations.push("metadata.inventoryHash is required");
    if (!snapshot.metadata.snapshotHash) violations.push("metadata.snapshotHash is required");

    if (!snapshot.repository.root) violations.push("repository.root is required");
    if (!snapshot.repository.branch) violations.push("repository.branch is required");

    if (!snapshot.workspace || snapshot.workspace.length === 0) {
      violations.push("workspace must contain at least one entry");
    }

    if (violations.length > 0) {
      throw new SnapshotValidationError(violations);
    }
  }
}

// ─── Deep Freeze ──────────────────────────────────────────────────────────
function deepFreeze<T>(obj: T): T {
  Object.freeze(obj);
  Object.getOwnPropertyNames(obj).forEach(prop => {
    const val = (obj as any)[prop];
    if (
      val !== null &&
      (typeof val === "object" || typeof val === "function") &&
      !Object.isFrozen(val)
    ) {
      deepFreeze(val);
    }
  });
  return obj;
}

// ─── BrainFactory ─────────────────────────────────────────────────────────
export class BrainFactory {
  static async create(options: {
    inventory: RepositoryInventory;
    workspaceRoot: string;
    registry?: ProviderRegistry;
  }): Promise<BrainSnapshot> {
    const registry = options.registry || new ProviderRegistry();
    const inventory = options.inventory;
    const workspaceRoot = options.workspaceRoot;

    const fragments: Record<string, any> = {};

    for (const provider of registry.getProviders()) {
      try {
        const fragment = await provider.load(inventory, workspaceRoot);
        fragments[fragment.namespace] = fragment.value;
      } catch (err) {
        console.warn(`[Brain Provider Error] Provider ${provider.id} failed:`, err);
      }
    }

    const config = fragments.configuration || {};

    // Collect file paths from the inventory filesystem scan
    const files: string[] = [...(inventory.files ?? [])];
    // Collect workspace paths (identity.workspaces is string[])
    const workspacePaths: string[] = [...(inventory.identity?.workspaces ?? [])];

    const snapshot: BrainSnapshot = {
      metadata: {
        schemaVersion: "1.0",
        brainVersion: "1.0",
        scannerVersion: "1.0",
        repositoryName: inventory.identity.name,
        inventoryHash: inventory.git.inventoryHash,
        configurationHash: "static-config-hash-" + inventory.git.repositoryHash,
        snapshotHash: "snapshot-hash-" + inventory.git.commit.substring(0, 8),
        generatedAt: new Date().toISOString()
      },
      // ── repository: raw discovery context ──────────────────────────────
      // This is the canonical location for paths and file lists.
      // Governance and Skills must read from here, never from AnalyzerContext.
      repository: {
        root: workspaceRoot,
        branch: inventory.git.branch,
        commit: inventory.git.commit,
        files,
        workspaces: workspacePaths
      },
      identity: {
        name: inventory.identity.name,
        workspaceType: inventory.identity.workspaces.length > 0 ? "Workspaces Monorepo" : "Polyrepo",
        packageManager: inventory.identity.packageManager,
        defaultBranch: "main",
        version: inventory.identity.version
      },
      technology: fragments.technology || {
        node: "unknown",
        typescript: "unknown",
        react: "unknown",
        next: "unknown",
        express: "unknown",
        mongodb: "unknown",
        mongoose: "unknown",
        redis: "unknown",
        bullmq: "unknown",
        jest: "unknown",
        playwright: "unknown"
      },
      workspace: fragments.workspace || [],
      architecture: config.architecture || {
        MetadataSchema: "1.0",
        "Brain-ID": "ERB-004",
        layers: [],
        flow: "",
        ownership: {}
      },
      policies: config.policies || {
        MetadataSchema: "1.0",
        "Brain-ID": "ERB-005",
        policies: [],
        boundaries: {}
      },
      vocabulary: config.vocabulary || {
        MetadataSchema: "1.0",
        "Brain-ID": "ERB-011",
        terms: {}
      },
      codingStandards: config.codingStandards || {
        MetadataSchema: "1.0",
        "Brain-ID": "ERB-006",
        conventions: {},
        typing: {}
      }
    };

    // Validate before freezing — Governance must never receive an invalid snapshot.
    SnapshotValidator.validate(snapshot);

    return deepFreeze(snapshot);
  }
}
