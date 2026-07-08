import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import type { BrainSnapshot } from "@esparex/repository-brain";
import { DriftFinding } from "../../events/event-types.js";
import { DriftComparator } from "../registry.js";

interface FileCacheEntry {
  mtime: number;
  size: number;
  sha256: string;
}

/**
 * FilesystemComparator
 *
 * Compares the list of files and detects:
 *   1. Added files
 *   2. Deleted files
 *   3. Modified files (via path, size, mtime, and sha256 hashes cache)
 *
 * Uses a file cache located at `.esparex/runtime/cache/files.json`
 * to store mtime, size, and sha256 hashes of the files to prevent
 * hashing every file on every scan.
 */
export class FilesystemComparator implements DriftComparator {
  readonly id = "filesystem-comparator";

  async compare(previous: BrainSnapshot, current: BrainSnapshot): Promise<DriftFinding[]> {
    const findings: DriftFinding[] = [];
    const root = current.repository.root;

    const prevFiles = new Set(previous.repository.files);
    const currFiles = new Set(current.repository.files);

    // 1. Detect Deleted Files
    for (const file of prevFiles) {
      if (!currFiles.has(file)) {
        findings.push({
          id: `file-deleted-${file}`,
          severity: "error",
          category: "filesystem",
          message: `Tracked file "${file}" has been deleted from the repository.`,
          recommendation: `Confirm deletion. Run "refresh" if intentional, or run skill automation if it was an generated file.`
        });
      }
    }

    // 2. Detect Added Files
    for (const file of currFiles) {
      if (!prevFiles.has(file)) {
        findings.push({
          id: `file-added-${file}`,
          severity: "info",
          category: "filesystem",
          message: `New file "${file}" detected in the repository filesystem.`,
          recommendation: `If this file belongs to a specific architecture layer, ensure it compiles and complies with import gates.`,
          suggestedSkillId: "layer-resolution",
          suggestedSkillInput: { filePath: file }
        });
      }
    }

    // 3. Incremental Content Shift Detection
    // Read cache from `.esparex/runtime/cache/files.json`
    const cacheDir = path.join(root, ".esparex/runtime/cache");
    const cacheFile = path.join(cacheDir, "files.json");
    let cache: Record<string, FileCacheEntry> = {};

    try {
      if (fs.existsSync(cacheFile)) {
        cache = JSON.parse(fs.readFileSync(cacheFile, "utf8"));
      }
    } catch {
      // Ignored: cache corrupted or not yet created
    }

    const nextCache: Record<string, FileCacheEntry> = {};
    let cacheModified = false;

    for (const file of currFiles) {
      const absPath = path.isAbsolute(file) ? file : path.join(root, file);
      try {
        const stats = fs.statSync(absPath);
        if (!stats.isFile()) continue;

        const size = stats.size;
        const mtime = stats.mtimeMs;

        const cached = cache[file];
        let sha256 = cached?.sha256 || "";

        // Incremental algorithm:
        // 1. Compare mtime.
        // 2. Compare size.
        // 3. Compute SHA-256 only when needed.
        if (!cached || cached.mtime !== mtime || cached.size !== size) {
          try {
            const content = fs.readFileSync(absPath);
            sha256 = crypto.createHash("sha256").update(content).digest("hex");
            cacheModified = true;
          } catch {
            // Unreadable file: skip
            continue;
          }

          if (cached && cached.sha256 !== sha256) {
            findings.push({
              id: `file-modified-${file}`,
              severity: "warning",
              category: "filesystem",
              message: `Tracked file "${file}" has been modified.`,
              recommendation: `Verify that recent changes do not introduce code styling or layer boundary drift.`,
              suggestedSkillId: "layer-resolution",
              suggestedSkillInput: { filePath: file }
            });
          }
        }

        nextCache[file] = { mtime, size, sha256 };
      } catch {
        // Missing or locked file
      }
    }

    // Write updated cache back to disk
    if (cacheModified || Object.keys(cache).length !== Object.keys(nextCache).length) {
      try {
        if (!fs.existsSync(cacheDir)) {
          fs.mkdirSync(cacheDir, { recursive: true });
        }
        fs.writeFileSync(cacheFile, JSON.stringify(nextCache, null, 2), "utf8");
      } catch {
        // Read-only filesystem
      }
    }

    return findings;
  }
}
