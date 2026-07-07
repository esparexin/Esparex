import { RepositoryIdentity } from "../../schema/index.js";
import { readPackageJson } from "../../utils/fs.js";

export class IdentityProvider {
  static getIdentity(workspaceRoot: string): RepositoryIdentity {
    const pkg = readPackageJson(workspaceRoot, "package.json");
    return {
      name: pkg.name || "unknown",
      workspaceType: pkg.workspaces ? "Workspaces Monorepo" : "Polyrepo",
      packageManager: pkg.packageManager || "npm",
      defaultBranch: "main",
      version: pkg.version || "1.0.0"
    };
  }
}
