import { ScannerPlugin, RepositoryInventory } from "../types.js";
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

export class GitScanner implements ScannerPlugin {
  readonly id = "git-scanner";

  async discover(workspaceRoot: string): Promise<Partial<RepositoryInventory>> {
    let branch = "main";
    let commit = "unknown";

    // Attempt 1: Read via command subprocess
    try {
      branch = execSync("git branch --show-current", { cwd: workspaceRoot, encoding: "utf8" }).trim();
      commit = execSync("git rev-parse HEAD", { cwd: workspaceRoot, encoding: "utf8" }).trim();
    } catch {
      // Attempt 2: Read directly from filesystem (.git folder)
      try {
        const gitDirPath = path.join(workspaceRoot, ".git");
        if (fs.existsSync(gitDirPath)) {
          const headContent = fs.readFileSync(path.join(gitDirPath, "HEAD"), "utf8").trim();
          if (headContent.startsWith("ref: ")) {
            const refPath = headContent.substring(5);
            branch = path.basename(refPath);
            const refFullPath = path.join(gitDirPath, refPath);
            if (fs.existsSync(refFullPath)) {
              commit = fs.readFileSync(refFullPath, "utf8").trim();
            }
          } else {
            commit = headContent;
          }
        }
      } catch {
        // Fallback structures
      }
    }

    return {
      git: {
        branch,
        commit,
        repositoryHash: commit.substring(0, 8),
        inventoryHash: "derived-hash-" + commit.substring(0, 4)
      }
    };
  }
}
