import * as fs from "fs";
import * as path from "path";
import type { BrainSnapshot } from "@esparex/repository-brain";

export interface HealthHistoryEntry {
  timestamp: string;
  commit: string;
  score: number;
  violationsCount: number;
  passed: boolean;
}

/**
 * HistoryManager
 *
 * Handles version archiving, metric trend logging, and retention policies.
 *
 * Stored paths:
 *   - Archived snapshots: `.esparex/runtime/history/snapshot-<timestamp>-<commit>.json`
 *   - Metrics log: `.esparex/runtime/history/health-trends.json`
 *
 * It is completely decoupled from SnapshotManager to isolate concerns.
 */
export class HistoryManager {
  private readonly historyDir: string;
  private readonly trendsPath: string;
  private readonly maxArchivedSnapshots = 10;

  constructor(workspaceRoot: string) {
    this.historyDir = path.join(workspaceRoot, ".esparex/runtime/history");
    this.trendsPath = path.join(this.historyDir, "health-trends.json");
  }

  /**
   * Archive a snapshot copy in history and enforce retention.
   */
  archive(snapshot: BrainSnapshot): void {
    try {
      if (!fs.existsSync(this.historyDir)) {
        fs.mkdirSync(this.historyDir, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const commit = snapshot.repository.commit.substring(0, 8);
      const filename = `snapshot-${timestamp}-${commit}.json`;
      const archivePath = path.join(this.historyDir, filename);

      fs.writeFileSync(archivePath, JSON.stringify(snapshot, null, 2), "utf8");

      // Apply retention policy (max 10 archived snapshots)
      this.applyRetentionPolicy();
    } catch (err: any) {
      console.warn(`[HistoryManager Warning] Failed to archive snapshot:`, err.message);
    }
  }

  /**
   * Append a health metrics log entry to track historical trends.
   */
  logHealth(entry: HealthHistoryEntry): void {
    try {
      if (!fs.existsSync(this.historyDir)) {
        fs.mkdirSync(this.historyDir, { recursive: true });
      }

      let history: HealthHistoryEntry[] = [];
      if (fs.existsSync(this.trendsPath)) {
        try {
          history = JSON.parse(fs.readFileSync(this.trendsPath, "utf8"));
        } catch {
          // Reset corrupted log
        }
      }

      history.push(entry);
      fs.writeFileSync(this.trendsPath, JSON.stringify(history, null, 2), "utf8");
    } catch (err: any) {
      console.warn(`[HistoryManager Warning] Failed to log health history:`, err.message);
    }
  }

  /**
   * Read the health trends log.
   */
  getHealthHistory(): HealthHistoryEntry[] {
    try {
      if (fs.existsSync(this.trendsPath)) {
        return JSON.parse(fs.readFileSync(this.trendsPath, "utf8"));
      }
    } catch {
      // Ignored
    }
    return [];
  }

  /**
   * Enforce retention policy: keeps only the latest maxArchivedSnapshots files.
   */
  private applyRetentionPolicy(): void {
    try {
      const files = fs.readdirSync(this.historyDir);
      const snapshots = files
        .filter(f => f.startsWith("snapshot-") && f.endsWith(".json"))
        .map(f => {
          const fullPath = path.join(this.historyDir, f);
          const stat = fs.statSync(fullPath);
          return { name: f, fullPath, mtime: stat.mtimeMs };
        });

      if (snapshots.length <= this.maxArchivedSnapshots) {
        return;
      }

      // Sort oldest first
      snapshots.sort((a, b) => a.mtime - b.mtime);

      const toDeleteCount = snapshots.length - this.maxArchivedSnapshots;
      for (let i = 0; i < toDeleteCount; i++) {
        fs.unlinkSync(snapshots[i].fullPath);
      }
    } catch (err: any) {
      console.warn(`[HistoryManager Warning] Failed to apply retention policy:`, err.message);
    }
  }
}
