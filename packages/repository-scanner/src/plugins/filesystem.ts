import { ScannerPlugin, RepositoryInventory } from "../types.js";
import * as fs from "fs";
import * as path from "path";

export class FilesystemScanner implements ScannerPlugin {
  readonly id = "filesystem-scanner";

  async discover(workspaceRoot: string): Promise<Partial<RepositoryInventory>> {
    const files: string[] = [];

    const walk = (dir: string) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relative = path.relative(workspaceRoot, fullPath).replace(/\\/g, "/");

        // Skip ignored areas to optimize performance
        if (
          entry.name === "node_modules" ||
          entry.name === ".git" ||
          entry.name === "dist" ||
          entry.name === ".next" ||
          relative.startsWith("archive")
        ) {
          continue;
        }

        if (entry.isDirectory()) {
          walk(fullPath);
        } else if (entry.isFile()) {
          files.push(relative);
        }
      }
    };

    try {
      walk(workspaceRoot);
    } catch {
      // Fallback
    }

    return {
      files
    };
  }
}
