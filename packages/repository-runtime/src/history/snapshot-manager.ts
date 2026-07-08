import * as fs from "fs";
import * as path from "path";
import { BrainSnapshot, BrainSnapshotSchema } from "@esparex/repository-brain";

/**
 * SnapshotManager
 *
 * Handles lifecycle operations for the *current active* BrainSnapshot.
 *
 * Responsibilities:
 *   - Exposing the latest valid frozen snapshot.
 *   - Loading the snapshot from disk.
 *   - Serializing and saving the snapshot.
 *   - Validating the snapshot schema (using Zod).
 *
 * It does NOT manage history or trends. Storage is at `.esparex/runtime/snapshots/latest.json`.
 */
export class SnapshotManager {
  private latestSnapshot: BrainSnapshot | null = null;
  private readonly snapshotDir: string;
  private readonly latestPath: string;

  constructor(workspaceRoot: string) {
    this.snapshotDir = path.join(workspaceRoot, ".esparex/runtime/snapshots");
    this.latestPath = path.join(this.snapshotDir, "latest.json");
  }

  /** Expose the active in-memory snapshot. */
  getLatest(): BrainSnapshot | null {
    return this.latestSnapshot;
  }

  /** Validate a snapshot against the BrainSnapshotSchema Zod definition. */
  validate(snapshot: unknown): BrainSnapshot {
    return BrainSnapshotSchema.parse(snapshot);
  }

  /**
   * Load the active snapshot from disk into memory.
   * Returns null if no snapshot exists yet.
   */
  load(): BrainSnapshot | null {
    if (!fs.existsSync(this.latestPath)) {
      return null;
    }

    try {
      const content = fs.readFileSync(this.latestPath, "utf8");
      const parsed = JSON.parse(content);
      const validated = this.validate(parsed);
      this.latestSnapshot = validated;
      return validated;
    } catch (err: any) {
      console.warn(`[SnapshotManager Warning] Failed to load snapshot at "${this.latestPath}":`, err.message);
      return null;
    }
  }

  /**
   * Save a snapshot to the latest directory on disk and update in-memory reference.
   * Validates before writing.
   */
  save(snapshot: BrainSnapshot): void {
    const validated = this.validate(snapshot);

    try {
      if (!fs.existsSync(this.snapshotDir)) {
        fs.mkdirSync(this.snapshotDir, { recursive: true });
      }

      fs.writeFileSync(this.latestPath, JSON.stringify(validated, null, 2), "utf8");
      this.latestSnapshot = validated;
    } catch (err: any) {
      throw new Error(`SnapshotManager: failed to save snapshot: ${err.message}`);
    }
  }

  /**
   * Helper to check if a latest snapshot exists on disk.
   */
  exists(): boolean {
    return fs.existsSync(this.latestPath);
  }
}
