import * as fs from "fs";
import * as path from "path";
import { Analyzer, AnalyzerContext, AnalysisResultEnvelope } from "../types/index.js";

export interface UnicodeViolationPayload {
  file: string;
  line: number;
  col: number;
  charName: string;
  unicode: string;
  bytesHex: string;
}

export class UnicodeHygieneAnalyzer implements Analyzer<UnicodeViolationPayload[]> {
  metadata = {
    id: "unicode-hygiene",
    name: "Unicode Hygiene Analyzer",
    category: "code-quality" as const,
    version: "1.0.0",
    dependsOn: []
  };

  private extSet = new Set([".ts", ".tsx", ".js", ".mjs", ".cjs", ".mts", ".cts"]);
  private excludeDirs = new Set(["node_modules", ".next", "dist", ".git", "archive", ".eslintcache"]);

  private *walkFiles(dir: string): Generator<string> {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!this.excludeDirs.has(entry.name)) {
          yield* this.walkFiles(fullPath);
        }
      } else if (this.extSet.has(path.extname(entry.name))) {
        yield fullPath;
      }
    }
  }

  private findSequence(bytes: number[], pattern: number[]): number[] {
    const hits: number[] = [];
    for (let i = 0; i <= bytes.length - pattern.length; i++) {
      let match = true;
      for (let j = 0; j < pattern.length; j++) {
        if (bytes[i + j] !== pattern[j]) {
          match = false;
          break;
        }
      }
      if (match) hits.push(i);
    }
    return hits;
  }

  private getLineCol(bytes: number[], offset: number) {
    let line = 1;
    let col = 1;
    for (let i = 0; i < offset; i++) {
      if (bytes[i] === 0x0A) {
        line++;
        col = 1;
      } else {
        col++;
      }
    }
    return { line, col };
  }

  async run(context: AnalyzerContext): Promise<AnalysisResultEnvelope<UnicodeViolationPayload[]>> {
    const startTime = Date.now();
    const violations: UnicodeViolationPayload[] = [];
    const root = context.workspaceRoot;

    const patternBOM = [0xEF, 0xBB, 0xBF];
    const patternZWSP = [0xE2, 0x80, 0x8B];

    try {
      for (const file of this.walkFiles(root)) {
        const rawBytes = fs.readFileSync(file);
        const bytes = Array.from(rawBytes);
        const relativeFile = path.relative(root, file).replace(/\\/g, "/");

        // 1. Check BOM
        const bomHits = this.findSequence(bytes, patternBOM);
        for (const offset of bomHits) {
          // Skip legitimate file-start BOM
          if (offset === 0) continue;
          const { line, col } = this.getLineCol(bytes, offset);
          violations.push({
            file: relativeFile,
            line,
            col,
            charName: "BOM / Zero Width No-Break Space",
            unicode: "U+FEFF",
            bytesHex: "0xEF 0xBB 0xBF"
          });
        }

        // 2. Check ZWSP
        const zwspHits = this.findSequence(bytes, patternZWSP);
        for (const offset of zwspHits) {
          const { line, col } = this.getLineCol(bytes, offset);
          violations.push({
            file: relativeFile,
            line,
            col,
            charName: "Zero Width Space",
            unicode: "U+200B",
            bytesHex: "0xE2 0x80 0x8B"
          });
        }
      }

      const errorsCount = violations.length;

      return {
        schemaVersion: "1.0.0",
        analyzerId: this.metadata.id,
        timestamp: new Date().toISOString(),
        status: "success",
        durationMs: Date.now() - startTime,
        warningsCount: 0,
        errorsCount,
        metadata: {},
        payload: violations
      };
    } catch (error: any) {
      return {
        schemaVersion: "1.0.0",
        analyzerId: this.metadata.id,
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
