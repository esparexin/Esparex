import { Reporter, GovernanceSummaryReport } from "../types/index.js";
import * as fs from "fs";

export class HtmlReporter implements Reporter {
  id = "html-reporter";
  name = "HTML Governance Report";

  async write(report: GovernanceSummaryReport, options: Record<string, any>): Promise<void> {
    const outPath = options.outputPath || "./governance-report.html";
    const color = options.color !== false;

    const scoreColor = report.overallScore >= 80 ? "#22c55e"
      : report.overallScore >= 50 ? "#eab308"
      : "#ef4444";

    const severityColors: Record<string, string> = {
      info: "#3b82f6",
      warning: "#eab308",
      error: "#ef4444",
      critical: "#7c3aed"
    };

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Governance Report - ${new Date(report.timestamp).toLocaleDateString()}</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #e2e8f0; line-height: 1.6; padding: 2rem; }
  .container { max-width: 960px; margin: 0 auto; }
  h1 { font-size: 1.75rem; margin-bottom: 0.5rem; }
  .meta { color: #94a3b8; font-size: 0.875rem; margin-bottom: 1.5rem; }
  .score-card { display: inline-flex; align-items: center; gap: 1rem; background: #1e293b; border-radius: 12px; padding: 1.5rem 2rem; margin-bottom: 2rem; }
  .score-circle { width: 80px; height: 80px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: 700; }
  .score-label { font-size: 0.875rem; color: #94a3b8; }
  .score-value { font-size: 2rem; font-weight: 700; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 2rem; }
  th { text-align: left; padding: 0.75rem 1rem; background: #1e293b; color: #94a3b8; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; }
  td { padding: 0.75rem 1rem; border-bottom: 1px solid #1e293b; }
  .badge { display: inline-block; padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; }
  .badge-pass { background: #052e16; color: #22c55e; }
  .badge-fail { background: #450a0a; color: #ef4444; }
  .section-title { font-size: 1.25rem; font-weight: 600; margin: 1.5rem 0 1rem; }
  .violation { padding: 0.75rem 1rem; margin-bottom: 0.5rem; border-radius: 8px; border-left: 3px solid; }
  .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
  .summary-card { background: #1e293b; border-radius: 8px; padding: 1rem; }
  .summary-card .label { font-size: 0.75rem; color: #94a3b8; text-transform: uppercase; }
  .summary-card .value { font-size: 1.5rem; font-weight: 700; }
  .category-chip { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; background: #334155; }
</style>
</head>
<body>
<div class="container">
  <h1>Governance Report</h1>
  <p class="meta">Generated: ${new Date(report.timestamp).toISOString()} &middot; Schema v${report.schemaVersion}</p>

  <div class="score-card">
    <div class="score-circle" style="background: ${scoreColor}20; color: ${scoreColor}">
      ${report.overallScore}
    </div>
    <div>
      <div class="score-label">Overall Health</div>
      <div class="score-value" style="color: ${scoreColor}">${report.overallScore}/100</div>
    </div>
  </div>

  <div class="summary-grid">
    <div class="summary-card">
      <div class="label">Analyzers</div>
      <div class="value">${report.results.length}</div>
    </div>
    <div class="summary-card">
      <div class="label">Passed</div>
      <div class="value" style="color: #22c55e">${report.results.filter(r => r.passed).length}</div>
    </div>
    <div class="summary-card">
      <div class="label">Failed</div>
      <div class="value" style="color: #ef4444">${report.results.filter(r => !r.passed).length}</div>
    </div>
    <div class="summary-card">
      <div class="label">Total Violations</div>
      <div class="value">${report.results.reduce((s, r) => s + r.violationsCount, 0)}</div>
    </div>
  </div>

  <h2 class="section-title">Per-Analyzer Results</h2>
  <table>
    <thead>
      <tr><th>Analyzer</th><th>Score</th><th>Violations</th><th>Status</th></tr>
    </thead>
    <tbody>
      ${report.results.map(r => `
      <tr>
        <td><strong>${r.name}</strong></td>
        <td><span style="color: ${r.score >= 80 ? '#22c55e' : r.score >= 50 ? '#eab308' : '#ef4444'}">${r.score}</span></td>
        <td>${r.violationsCount}</td>
        <td><span class="badge ${r.passed ? 'badge-pass' : 'badge-fail'}">${r.passed ? 'PASS' : 'FAIL'}</span></td>
      </tr>`).join("")}
    </tbody>
  </table>

  ${report.results.filter(r => !r.passed && r.report.violations.length > 0).map(r => `
  <h2 class="section-title">Violations: ${r.name}</h2>
  ${r.report.violations.map(v => `
  <div class="violation" style="border-left-color: ${severityColors[v.severity] || '#94a3b8'}">
    <div>
      <span class="badge" style="background: ${severityColors[v.severity]}22; color: ${severityColors[v.severity]}">${v.severity}</span>
      <span style="font-family: monospace; font-size: 0.875rem; color: #94a3b8">${v.ruleId}</span>
    </div>
    <p style="margin-top: 0.25rem">${v.message}</p>
    ${v.file ? `<p style="font-size: 0.75rem; color: #64748b; margin-top: 0.25rem">${v.file}${v.line ? `:${v.line}` : ""}</p>` : ""}
  </div>`).join("")}
  `).join("")}

  <p class="meta" style="margin-top: 3rem; text-align: center">Generated by @esparex/repository-governance</p>
</div>
</body>
</html>`;

    fs.writeFileSync(outPath, html, "utf-8");
  }
}
