import { FixResult, FixPreview, GovernanceSummaryReport } from "../types/index.js";

export class FixReporter {
  id = "fix-reporter";
  name = "Auto-Fix Outcome Reporter";

  async writeFixResults(
    results: { analyzerId: string; fixResult: FixResult }[]
  ): Promise<string> {
    const lines: string[] = [
      "# Governance Auto-Fix Report",
      "",
      `Generated: ${new Date().toISOString()}`,
      "",
      "## Summary",
      "",
      `| Analyzer | Fix ID | Changes Applied | Errors |`,
      `|----------|--------|-----------------|--------|`,
    ];

    let totalChanges = 0;
    let totalErrors = 0;

    for (const r of results) {
      lines.push(`| ${r.analyzerId} | ${r.fixResult.fixId} | ${r.fixResult.changesApplied} | ${r.fixResult.errors.length} |`);
      totalChanges += r.fixResult.changesApplied;
      totalErrors += r.fixResult.errors.length;
    }

    lines.push("", `**Total changes applied:** ${totalChanges}`);
    lines.push(`**Total errors:** ${totalErrors}`);

    if (totalErrors > 0) {
      lines.push("", "## Errors", "");
      for (const r of results) {
        for (const err of r.fixResult.errors) {
          lines.push(`- [${r.analyzerId}] ${err}`);
        }
      }
    }

    return lines.join("\n");
  }

  async writeDryRunPreview(
    results: { analyzerId: string; preview: FixPreview }[]
  ): Promise<string> {
    const lines: string[] = [
      "# Governance Auto-Fix Preview (Dry Run)",
      "",
      `Generated: ${new Date().toISOString()}`,
      "",
      "## Proposed Changes",
      "",
    ];

    let totalChanges = 0;
    for (const r of results) {
      for (const change of r.preview.changes) {
        lines.push(`### ${r.analyzerId}: ${change.file}`);
        lines.push("");
        lines.push("```diff");
        lines.push(`- ${change.original}`);
        lines.push(`+ ${change.proposed}`);
        lines.push("```");
        lines.push("");
        totalChanges++;
      }
    }

    lines.push(`**Total changes proposed:** ${totalChanges}`);
    lines.push("", "*No files were modified. Run with --fix to apply.*");
    return lines.join("\n");
  }
}
