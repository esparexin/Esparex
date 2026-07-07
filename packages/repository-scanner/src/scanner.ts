import { ImmutableInventory, ScannerPlugin } from "./types.js";
import { WorkspaceScanner } from "./plugins/workspace.js";
import { GitScanner } from "./plugins/git.js";
import { FilesystemScanner } from "./plugins/filesystem.js";

export class RepositoryScanner {
  private workspaceRoot: string;
  private plugins: ScannerPlugin[] = [];

  constructor(options: { workspaceRoot?: string; plugins?: ScannerPlugin[] } = {}) {
    this.workspaceRoot = options.workspaceRoot || process.cwd();
    this.plugins = options.plugins || [
      new WorkspaceScanner(),
      new GitScanner(),
      new FilesystemScanner()
    ];
  }

  async scan(): Promise<ImmutableInventory> {
    let identity: { name: string; version: string; packageManager: string; workspaces: readonly string[] } = {
      name: "unknown",
      version: "1.0.0",
      packageManager: "npm",
      workspaces: []
    };
    let dependencies: Record<string, Record<string, string>> = {};
    let git = { branch: "main", commit: "unknown", repositoryHash: "unknown", inventoryHash: "unknown" };
    let files: string[] = [];

    for (const plugin of this.plugins) {
      try {
        const chunk = await plugin.discover(this.workspaceRoot);
        if (chunk.identity) identity = { ...identity, ...chunk.identity };
        if (chunk.dependencies) dependencies = { ...dependencies, ...chunk.dependencies };
        if (chunk.git) git = { ...git, ...chunk.git };
        if (chunk.files) files = [...files, ...chunk.files];
      } catch (err) {
        console.warn(`[Scanner Plugin Error] Plugin ${plugin.id} failed:`, err);
      }
    }

    // Freeze snapshot data to enforce immutability
    const inventory: ImmutableInventory = {
      identity: Object.freeze(identity),
      dependencies: Object.freeze(dependencies),
      git: Object.freeze(git),
      files: Object.freeze(files)
    };

    return Object.freeze(inventory);
  }
}
