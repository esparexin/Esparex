import * as fs from "fs";
import * as path from "path";
import { DriftReport } from "../events/event_types.js";

export interface ReportWriterOptions {
  outputPath?: string;
  format?: "json" | "markdown" | "both";
}

/**
 * ReportWriter
 *
 * Formats and writes drift and health analysis results.
 *
 * Supported formats:
 *   - JSON (for machine consumption)
 *   - Markdown (for human consumption)
 *
 * Why ReportWriter?
 *   It isolates formatting and filesystem operations, preventing the core runtime
 *   orchestrator from containing JSON stringification or Markdown layout details.
 */
export class ReportWriter {
  /**
   * Writes a DriftReport according to the specified options.
   */
  async writeDriftReport(report: DriftReport, options: ReportWriterOptions): Promise<string> {
    const format = options.format || "markdown";
    const dir = options.outputPath ? path.dirname(options.outputPath) : "";

    let mdOutput = "";
    let jsonOutput = JSON.stringify(report, null, 2);

    if (format === "markdown" || format === "both") {
      mdOutput = this.formatMarkdown(report);
    }

    if (options.outputPath) {
      try {
        if (dir && !fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        if (format === "json" || format === "both") {
          const jsonPath = format === "both" ? `${options.outputPath}.json` : options.outputPath;
          fs.writeFileSync(jsonPath, jsonOutput, "utf8");
        }

        if (format === "markdown" || format === "both") {
          const mdPath = format === "both" ? `${options.outputPath}.md` : options.outputPath;
          fs.writeFileSync(mdPath, mdOutput, "utf8");
        }
      } catch (err: any) {
        throw new Error(`ReportWriter: failed to write output to "${options.outputPath}": ${err.message}`);
      }
    }

    return format === "json" ? jsonOutput : mdOutput;
  }

  /**
   * Format DriftReport as clean GitHub-style Markdown.
   */
  private formatMarkdown(report: DriftReport): string {
    const lines: string[] = [];
    lines.push(`# Esparex Repository Drift Report`);
    lines.push(`*Generated at: ${report.timestamp}*`);
    lines.push(``);
    lines.push(`### Health Score: **${report.score}/100**`);
    lines.push(`Status: **${report.status.toUpperCase()}**`);
    lines.push(`Snapshot Refresh Required: **${report.requiresSnapshotRefresh ? "YES" : "NO"}**`);
    lines.push(``);

    if (report.findings.length === 0) {
      lines.push(`✔ **Clean**: No drift detected in repository workspaces, dependencies, files, or policies.`);
      return lines.join("\n");
    }

    lines.push(`## Findings (${report.findings.length})`);
    lines.push(``);

    const severityEmoji = {
      info: "ℹ",
      warning: "⚠️",
      error: "❌"
    };

    lines.push(`| Severity | Category | Message | Suggested Skill |`);
    lines.push(`| :--- | :--- | :--- | :--- |`);

    for (const f of report.findings) {
      const skillText = f.suggestedSkillId
        ? `\`${f.suggestedSkillId}\``
        : "_None_";
      lines.push(
        `| ${severityEmoji[f.severity]} **${f.severity.toUpperCase()}** ` +
        `| **${f.category.toUpperCase()}** ` +
        `| ${f.message} *Rec: ${f.recommendation || "N/A"}* ` +
        `| ${skillText} |`
      );
    }

    return lines.join("\n");
  }
}
