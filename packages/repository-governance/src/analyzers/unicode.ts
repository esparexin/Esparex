// ─── Content-Reading Exception ────────────────────────────────────────────────
//
// This is the ONLY analyzer in @esparex/repository-governance that reads
// from the filesystem directly.
//
// Permitted access: fs.readFileSync(absolutePath)  ← content reading
// Forbidden access: fs.readdirSync / glob / walk   ← file discovery
//
// Rationale: Unicode/BOM/ZWSP detection requires raw byte sequences that
// cannot be modeled in the BrainSnapshot. File *paths* are always sourced
// from snapshot.repository.files (populated by RepositoryScanner). This
// analyzer never enumerates directory entries independently.
//
// Architecture Contract Reference: Phase 4 — Governance consumes BrainSnapshot
// ─────────────────────────────────────────────────────────────────────────────

import * as fs from "fs";
import * as path from "path";
import type { BrainSnapshot } from "@esparex/repository-brain";
import { GovernanceAnalyzer, AnalysisResultEnvelope } from "../types/index.js";

export interface UnicodeViolationPayload {
  file: string;
  line: number;
  col: number;
  charName: string;
  unicode: string;
  bytesHex: string;
}

export class UnicodeHygieneAnalyzer implements GovernanceAnalyzer<UnicodeViolationPayload[]> {
  readonly id = "unicode-hygiene";
  readonly category = "code-quality" as const;

  private readonly extSet = new Set([".ts", ".tsx", ".js", ".mjs", ".cjs", ".mts", ".cts"]);

  private findSequence(bytes: number[], pattern: number[]): number[] {
    const hits: number[] = [];
    for (let i = 0; i <= bytes.length - pattern.length; i++) {
      let match = true;
      for (let j = 0; j < pattern.length; j++) {
        if (bytes[i + j] !== pattern[j]) { match = false; break; }
      }
      if (match) hits.push(i);
    }
    return hits;
  }

  private getLineCol(bytes: number[], offset: number) {
    let line = 1, col = 1;
    for (let i = 0; i < offset; i++) {
      if (bytes[i] === 0x0A) { line++; col = 1; } else { col++; }
    }
    return { line, col };
  }

  async analyze(snapshot: BrainSnapshot): Promise<AnalysisResultEnvelope<UnicodeViolationPayload[]>> {
    const startTime = Date.now();
    const violations: UnicodeViolationPayload[] = [];
    const root = snapshot.repository.root;

    // File paths come from the snapshot — RepositoryScanner owns discovery.
    const candidates = snapshot.repository.files.filter(
      f => this.extSet.has(path.extname(f))
    );

    const patternBOM  = [0xEF, 0xBB, 0xBF];
    const patternZWSP = [0xE2, 0x80, 0x8B];

    try {
      for (const relFile of candidates) {
        const absPath = path.isAbsolute(relFile) ? relFile : path.join(root, relFile);
        // Content reading — permitted exception (see header comment above).
        const rawBytes = fs.readFileSync(absPath);
        const bytes = Array.from(rawBytes);
        const relativeFile = path.relative(root, absPath).replace(/\\/g, "/");

        // 1. Check BOM
        for (const offset of this.findSequence(bytes, patternBOM)) {
          if (offset === 0) continue; // legitimate file-start BOM
          const { line, col } = this.getLineCol(bytes, offset);
          violations.push({ file: relativeFile, line, col, charName: "BOM / Zero Width No-Break Space", unicode: "U+FEFF", bytesHex: "0xEF 0xBB 0xBF" });
        }

        // 2. Check ZWSP
        for (const offset of this.findSequence(bytes, patternZWSP)) {
          const { line, col } = this.getLineCol(bytes, offset);
          violations.push({ file: relativeFile, line, col, charName: "Zero Width Space", unicode: "U+200B", bytesHex: "0xE2 0x80 0x8B" });
        }
      }

      return {
        schemaVersion: "1.0.0",
        analyzerId: this.id,
        timestamp: new Date().toISOString(),
        status: "success",
        durationMs: Date.now() - startTime,
        warningsCount: 0,
        errorsCount: violations.length,
        metadata: { filesScanned: candidates.length },
        payload: violations
      };
    } catch (error: any) {
      return {
        schemaVersion: "1.0.0",
        analyzerId: this.id,
        timestamp: new Date().toISOString(),
        status: "failure",
        durationMs: Date.now() - startTime,
        warningsCount: 0,
        errorsCount: 1,
        metadata: { error: error.message },
        payload: []
      };
    }
  }
}
