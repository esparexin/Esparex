import { ScannerPlugin, RepositoryInventory } from "../types.js";
import { readPackageJson } from "../utils/fs.js";

export class WorkspaceScanner implements ScannerPlugin {
  readonly id = "workspace-scanner";

  async discover(workspaceRoot: string): Promise<Partial<RepositoryInventory>> {
    const rootPkg = readPackageJson(workspaceRoot, "package.json");
    const workspaces: string[] = rootPkg.workspaces || [];

    const dependencies: Record<string, Record<string, string>> = {
      root: {
        ...(rootPkg.dependencies || {}),
        ...(rootPkg.devDependencies || {})
      }
    };

    for (const w of workspaces) {
      const pkg = readPackageJson(workspaceRoot, `${w}/package.json`);
      if (pkg.name) {
        dependencies[pkg.name] = {
          ...(pkg.dependencies || {}),
          ...(pkg.devDependencies || {})
        };
      }
    }

    return {
      identity: {
        name: rootPkg.name || "unknown",
        version: rootPkg.version || "1.0.0",
        packageManager: rootPkg.packageManager || "npm",
        workspaces
      },
      dependencies
    };
  }
}
