import { Reporter, GovernanceSummaryReport } from "../types/index.js";

export class ConsoleReporter implements Reporter {
  id = "console-reporter";
  name = "Console Reporter";

  async write(report: GovernanceSummaryReport, options: Record<string, any>): Promise<void> {
    const useColor = options.color !== false;
    const cl = (code: string, text: string) => useColor ? `${code}${text}\x1b[0m` : text;

    const bold = (t: string) => cl("\x1b[1m", t);
    const red = (t: string) => cl("\x1b[31m", t);
    const green = (t: string) => cl("\x1b[32m", t);
    const yellow = (t: string) => cl("\x1b[33m", t);
    const blue = (t: string) => cl("\x1b[34m", t);

    console.log("\n" + bold("======================================================================"));
    console.log(bold(`   Esparex Repository Governance Summary Report — ${new Date(report.timestamp).toLocaleString()}`));
    console.log(bold("======================================================================"));

    let scoreColor = green;
    if (report.overallScore < 50) scoreColor = red;
    else if (report.overallScore < 80) scoreColor = yellow;

    console.log(`\nOverall Repository Health Score: ${scoreColor(bold(report.overallScore.toString() + "/100"))}\n`);

    console.log(bold("Analyzer Execution Results:"));
    for (const r of report.results) {
      const statusIcon = r.passed ? green("✔ PASSED") : red("✖ FAILED");
      const scoreStr = `${r.score}/100`;
      console.log(`  - ${bold(r.name)} (${r.analyzerId}): ${statusIcon} (Score: ${scoreStr}, Violations: ${r.violationsCount})`);

      if (r.report.violations.length > 0) {
        for (const v of r.report.violations) {
          const sev = v.severity.toUpperCase();
          const sevStr = v.severity === "critical" ? red(bold(sev))
                        : v.severity === "error" ? red(sev)
                        : v.severity === "warning" ? yellow(sev)
                        : blue(sev);
          const location = v.file ? ` at ${v.file}${v.line ? `:${v.line}:${v.col || 1}` : ""}` : "";
          console.log(`     [${sevStr}] ${v.message}${location}`);
        }
      }
    }

    console.log("\n" + bold("======================================================================") + "\n");
  }
}
