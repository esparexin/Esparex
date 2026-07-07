import { BrainSnapshot, WorkspaceMetadata } from "../schema/index.js";

export class BrainQuery {
  private snapshot: BrainSnapshot;

  constructor(snapshot: BrainSnapshot) {
    this.snapshot = snapshot;
  }

  workspace(name: string): WorkspaceMetadata | undefined {
    return this.snapshot.workspace.find(
      w => w.name === name || w.path === `apps/${name}` || w.path === `backend/${name}` || w.path === `packages/${name}` || w.path === name
    );
  }

  layer(filePath: string): string | undefined {
    const arch = this.snapshot.architecture;
    const normalized = filePath.replace(/\\/g, "/");
    for (const [prefix, layerName] of Object.entries(arch.ownership)) {
      if (normalized.startsWith(prefix)) {
        return layerName;
      }
    }
    return undefined;
  }

  /**
   * Reverse lookup: given a layer name, returns the canonical path prefix.
   *
   * Example: resolveLayer("Transport") → "backend/user"
   *
   * Skills use this instead of hardcoding folder paths, making them
   * repository-portable. If the repository is restructured, only
   * architecture.json changes — no skill source code changes.
   */
  resolveLayer(layerName: string): string | undefined {
    const arch = this.snapshot.architecture;
    for (const [prefix, name] of Object.entries(arch.ownership)) {
      if (name === layerName) return prefix;
    }
    return undefined;
  }

  policy(policyId: string): boolean {
    const policies = this.snapshot.policies;
    return policies.policies.some(p => p.id === policyId);
  }

  vocabulary(term: string): string | undefined {
    const vocab = this.snapshot.vocabulary;
    return vocab.terms[term];
  }
}
