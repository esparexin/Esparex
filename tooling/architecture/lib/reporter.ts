/**
 * lib/reporter.ts
 * ---------------
 * Pure renderer: consumes data objects and produces HTML and console strings.
 * Does NOT compute any data. All data is passed in as arguments.
 *
 * Generates a static, self-contained HTML dashboard — no external CDN or framework.
 */

import { ArchitectureReport, HistoryEntry, Metric, Registry, CheckResult } from '../types';

// ---------------------------------------------------------------------------
// Inline CSS
// ---------------------------------------------------------------------------

const CSS = `
:root {
  --bg: #0a0e1a;
  --surface: #0f172a;
  --surface2: #1e293b;
  --border: #334155;
  --text: #e2e8f0;
  --muted: #94a3b8;
  --accent: #6366f1;
  --green: #10b981;
  --yellow: #f59e0b;
  --red: #ef4444;
  --orange: #f97316;
  --blue: #3b82f6;
  --font: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, monospace;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  background: var(--bg);
  color: var(--text);
  font-family: var(--font);
  font-size: 14px;
  line-height: 1.6;
}
a { color: var(--accent); text-decoration: none; }
h1 { font-size: 1.6rem; font-weight: 700; }
h2 { font-size: 1.1rem; font-weight: 600; margin-bottom: 1rem; color: var(--text); }
h3 { font-size: 0.9rem; font-weight: 600; color: var(--muted); text-transform: uppercase;
     letter-spacing: 0.08em; margin-bottom: 0.75rem; }

/* Layout */
.container { max-width: 1280px; margin: 0 auto; padding: 2rem 1.5rem; }
.header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 1.25rem 2rem; background: var(--surface);
  border-bottom: 1px solid var(--border);
}
.header-meta { font-size: 0.8rem; color: var(--muted); text-align: right; }
.header-meta span { display: block; }
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; margin-bottom: 1.25rem; }
.grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.25rem; margin-bottom: 1.25rem; }
.grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.25rem; }
@media (max-width: 768px) {
  .grid-2, .grid-3, .grid-4 { grid-template-columns: 1fr; }
}

/* Cards */
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 1.25rem;
}

/* Score */
.score-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 2rem;
  display: flex;
  align-items: center;
  gap: 2rem;
  margin-bottom: 1.25rem;
}
.score-ring {
  width: 120px; height: 120px; flex-shrink: 0;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 2rem; font-weight: 800;
  border: 6px solid;
}
.score-ring.pass { border-color: var(--green); color: var(--green); }
.score-ring.warn { border-color: var(--yellow); color: var(--yellow); }
.score-ring.fail { border-color: var(--red); color: var(--red); }
.score-detail h2 { font-size: 1.5rem; margin-bottom: 0.25rem; }
.badge {
  display: inline-block; padding: 0.2rem 0.65rem;
  border-radius: 20px; font-size: 0.75rem; font-weight: 700;
  letter-spacing: 0.04em; text-transform: uppercase;
}
.badge.pass { background: rgba(16,185,129,0.15); color: var(--green); border: 1px solid var(--green); }
.badge.fail { background: rgba(239,68,68,0.15); color: var(--red); border: 1px solid var(--red); }

/* Severity pills */
.sev-grid { display: flex; gap: 0.75rem; flex-wrap: wrap; margin-top: 0.75rem; }
.sev-pill {
  display: flex; align-items: center; gap: 0.4rem;
  padding: 0.35rem 0.75rem; border-radius: 6px;
  font-size: 0.78rem; font-weight: 600;
}
.sev-pill.critical { background: rgba(239,68,68,0.12); color: var(--red); border: 1px solid rgba(239,68,68,0.3); }
.sev-pill.high { background: rgba(249,115,22,0.12); color: var(--orange); border: 1px solid rgba(249,115,22,0.3); }
.sev-pill.medium { background: rgba(245,158,11,0.12); color: var(--yellow); border: 1px solid rgba(245,158,11,0.3); }
.sev-pill.low { background: rgba(148,163,184,0.1); color: var(--muted); border: 1px solid var(--border); }

/* Checks list */
.check-row {
  display: flex; align-items: flex-start; gap: 0.75rem;
  padding: 0.6rem 0; border-bottom: 1px solid var(--border);
}
.check-row:last-child { border-bottom: none; }
.check-icon { font-size: 1rem; flex-shrink: 0; margin-top: 2px; }
.check-body { flex: 1; }
.check-name { font-weight: 600; font-size: 0.9rem; }
.check-violations { margin-top: 0.3rem; }
.violation-item {
  font-size: 0.78rem; color: var(--muted); padding: 0.2rem 0 0.2rem 0.75rem;
  border-left: 2px solid var(--border); margin-top: 0.25rem;
}

/* Tables */
table { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
th {
  text-align: left; padding: 0.6rem 0.75rem;
  border-bottom: 1px solid var(--border);
  color: var(--muted); font-weight: 600; font-size: 0.75rem;
  text-transform: uppercase; letter-spacing: 0.06em;
}
td { padding: 0.55rem 0.75rem; border-bottom: 1px solid rgba(255,255,255,0.04); }
tr:last-child td { border-bottom: none; }
tr:hover td { background: rgba(255,255,255,0.02); }
.tag {
  display: inline-block; padding: 0.15rem 0.5rem;
  border-radius: 4px; font-size: 0.7rem; font-weight: 600;
}
.tag.stable { background: rgba(16,185,129,0.15); color: var(--green); }
.tag.experimental { background: rgba(245,158,11,0.15); color: var(--yellow); }
.tag.ref { background: rgba(99,102,241,0.15); color: var(--accent); border: 1px solid rgba(99,102,241,0.4); }

/* Progress bars */
.progress-item { margin-bottom: 0.85rem; }
.progress-label {
  display: flex; justify-content: space-between;
  font-size: 0.8rem; margin-bottom: 0.25rem; color: var(--text);
}
.progress-bar-track {
  height: 6px; background: var(--surface2); border-radius: 3px; overflow: hidden;
}
.progress-bar-fill {
  height: 100%; border-radius: 3px; transition: width 0.3s;
}
.progress-bar-fill.complete { background: var(--green); }
.progress-bar-fill.partial { background: var(--yellow); }
.progress-bar-fill.none { background: var(--border); }

/* Metrics grid */
.metric-card {
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 1rem;
}
.metric-value {
  font-size: 1.6rem; font-weight: 800; line-height: 1;
  margin-bottom: 0.25rem;
}
.metric-name { font-size: 0.75rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.06em; }
.metric-trend { font-size: 0.75rem; margin-top: 0.35rem; }
.trend-up { color: var(--green); }
.trend-down { color: var(--red); }
.trend-stable { color: var(--muted); }

/* Trend chart */
.trend-chart {
  display: flex; align-items: flex-end; gap: 6px;
  height: 80px; padding-top: 0.5rem;
}
.trend-bar {
  flex: 1; border-radius: 3px 3px 0 0;
  background: var(--accent);
  opacity: 0.6;
  position: relative;
  min-height: 4px;
}
.trend-bar.current { opacity: 1; background: var(--green); }
.trend-bar:hover { opacity: 1; }
.trend-labels {
  display: flex; gap: 6px; margin-top: 0.3rem;
}
.trend-label {
  flex: 1; text-align: center; font-size: 0.65rem; color: var(--muted);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

/* Violations */
.violation-row {
  display: flex; gap: 0.75rem; align-items: flex-start;
  padding: 0.6rem 0; border-bottom: 1px solid var(--border);
}
.violation-row:last-child { border-bottom: none; }
.viol-num {
  width: 24px; height: 24px; border-radius: 50%;
  background: var(--surface2); display: flex; align-items: center; justify-content: center;
  font-size: 0.7rem; font-weight: 700; flex-shrink: 0; color: var(--muted);
}
.viol-msg { font-size: 0.82rem; line-height: 1.5; }
.viol-loc { font-size: 0.72rem; color: var(--muted); margin-top: 0.15rem; }

.color-critical { color: var(--red); }
.color-high { color: var(--orange); }
.color-medium { color: var(--yellow); }
.color-low { color: var(--muted); }

.section { margin-bottom: 1.5rem; }
.empty { color: var(--muted); font-size: 0.85rem; padding: 1.5rem; text-align: center; }
`;

// ---------------------------------------------------------------------------
// HTML generation helpers
// ---------------------------------------------------------------------------

function esc(s: string): string {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function scoreClass(score: number): string {
    if (score >= 90) return 'pass';
    if (score >= 70) return 'warn';
    return 'fail';
}

function trendIcon(trend?: string): string {
    if (trend === 'up') return '↑';
    if (trend === 'down') return '↓';
    return '→';
}

function trendClass(trend?: string): string {
    if (trend === 'up') return 'trend-up';
    if (trend === 'down') return 'trend-down';
    return 'trend-stable';
}

function renderSeverityPills(summary: ArchitectureReport['summary']): string {
    const items = [
        { label: 'Critical', count: summary.critical, cls: 'critical', icon: '❌' },
        { label: 'High', count: summary.high, cls: 'high', icon: '⚠' },
        { label: 'Medium', count: summary.medium, cls: 'medium', icon: 'ℹ' },
        { label: 'Low', count: summary.low, cls: 'low', icon: '·' },
    ];
    return `<div class="sev-grid">
        ${items.map((i) => `<div class="sev-pill ${i.cls}">${i.icon} ${i.count} ${i.label}</div>`).join('')}
    </div>`;
}

function renderChecks(results: CheckResult[]): string {
    return results
        .map((r) => {
            const icon = r.passed ? '✓' : '✗';
            const style = r.passed ? 'color:var(--green)' : 'color:var(--red)';
            const violations = r.violations.slice(0, 5)
                .map((v) => `<div class="violation-item">${esc(v.message)}${v.file ? ` <span style="color:var(--accent)">${esc(v.file)}${v.line ? ':' + v.line : ''}</span>` : ''}</div>`)
                .join('');
            const more = r.violations.length > 5
                ? `<div class="violation-item" style="color:var(--muted)">… and ${r.violations.length - 5} more</div>`
                : '';
            return `<div class="check-row">
                <div class="check-icon" style="${style}">${icon}</div>
                <div class="check-body">
                    <div class="check-name">${esc(r.name)}</div>
                    ${!r.passed ? `<div class="check-violations">${violations}${more}</div>` : ''}
                </div>
            </div>`;
        })
        .join('');
}

function renderRegistry(registry: Registry): string {
    const domains = Object.entries(registry);
    if (domains.length === 0) {
        return '<div class="empty">No domains registered yet.</div>';
    }
    const rows = domains
        .map(([id, e]) => {
            const refBadge = e.reference ? `<span class="tag ref" title="Reference implementation">ref</span> ` : '';
            const stabTag = `<span class="tag ${e.stability}">${e.stability}</span>`;
            return `<tr>
                <td><strong>${esc(id)}</strong> ${refBadge}</td>
                <td>${esc(e.owner)}</td>
                <td>${stabTag}</td>
                <td>${e.ports}</td>
                <td>${e.adapters}</td>
                <td>${e.entities}</td>
                <td>${e.services}</td>
                <td>${e.policies}</td>
            </tr>`;
        })
        .join('');
    return `<table>
        <thead><tr>
            <th>Domain</th><th>Owner</th><th>Stability</th>
            <th>Ports</th><th>Adapters</th><th>Entities</th>
            <th>Services</th><th>Policies</th>
        </tr></thead>
        <tbody>${rows}</tbody>
    </table>`;
}

function renderMigrationProgress(registry: Registry): string {
    const domains = Object.entries(registry);
    if (domains.length === 0) return '<div class="empty">No domains found.</div>';
    return domains
        .map(([id, e]) => {
            const score = Math.min(
                100,
                Math.round(
                    ((e.ports > 0 ? 25 : 0) +
                        (e.adapters > 0 ? 25 : 0) +
                        (e.stability === 'stable' ? 25 : 0) +
                        (e.reference ? 25 : 0))
                )
            );
            const cls = score === 100 ? 'complete' : score > 0 ? 'partial' : 'none';
            return `<div class="progress-item">
                <div class="progress-label">
                    <span>${esc(id)}</span>
                    <span style="color:var(--muted)">${score}%</span>
                </div>
                <div class="progress-bar-track">
                    <div class="progress-bar-fill ${cls}" style="width:${score}%"></div>
                </div>
            </div>`;
        })
        .join('');
}

function renderMetrics(metrics: Metric[]): string {
    return metrics
        .map((m) => {
            const trendHtml = m.trend
                ? `<div class="metric-trend ${trendClass(m.trend)}">${trendIcon(m.trend)} ${m.trend}</div>`
                : '';
            const valueColor =
                m.severity === 'critical' ? 'var(--red)'
                : m.severity === 'high' ? 'var(--orange)'
                : m.severity === 'medium' ? 'var(--yellow)'
                : 'var(--text)';
            return `<div class="metric-card">
                <div class="metric-value" style="color:${valueColor}">${esc(String(m.value))}</div>
                <div class="metric-name">${esc(m.name)}</div>
                ${trendHtml}
            </div>`;
        })
        .join('');
}

function renderTopViolations(results: CheckResult[]): string {
    const all = results
        .flatMap((r) => r.violations)
        .sort((a, b) => {
            const order = { critical: 0, high: 1, medium: 2, low: 3 };
            return order[a.severity] - order[b.severity];
        })
        .slice(0, 10);

    if (all.length === 0) {
        return '<div class="empty">✓ No violations detected</div>';
    }

    return all
        .map((v, i) => {
            const loc = v.file
                ? `<div class="viol-loc">${esc(v.file)}${v.line ? ':' + v.line : ''}</div>`
                : '';
            return `<div class="violation-row">
                <div class="viol-num">${i + 1}</div>
                <div>
                    <div class="viol-msg color-${v.severity}">${esc(v.message)}</div>
                    ${loc}
                </div>
            </div>`;
        })
        .join('');
}

function renderTrendChart(history: HistoryEntry[]): string {
    if (history.length === 0) {
        return '<div class="empty">No history yet. Run again tomorrow to see trends.</div>';
    }

    const maxScore = Math.max(...history.map((h) => h.score), 100);
    const recent = history.slice(-14);
    const bars = recent
        .map((h, i) => {
            const pct = Math.round((h.score / maxScore) * 100);
            const isCurrent = i === recent.length - 1;
            const title = `${h.date}: ${h.score}/100 (${h.violations} violations)`;
            return `<div class="trend-bar${isCurrent ? ' current' : ''}" style="height:${pct}%" title="${esc(title)}"></div>`;
        })
        .join('');
    const labels = recent
        .map((h) => `<div class="trend-label">${h.date.slice(5)}</div>`)
        .join('');

    return `<div class="trend-chart">${bars}</div>
    <div class="trend-labels">${labels}</div>`;
}

// ---------------------------------------------------------------------------
// Main HTML generator
// ---------------------------------------------------------------------------

export function renderHtmlReport(report: ArchitectureReport, history: HistoryEntry[]): string {
    const cls = scoreClass(report.score);
    const date = new Date(report.generatedAt).toLocaleString();

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Esparex Architecture Report — ${report.generatedAt.slice(0, 10)}</title>
<style>${CSS}</style>
</head>
<body>

<div class="header">
  <div>
    <h1>🏗 Esparex Architecture Platform</h1>
    <div style="color:var(--muted);font-size:0.8rem;margin-top:0.2rem">
      Architecture governance report
    </div>
  </div>
  <div class="header-meta">
    <span>${esc(date)}</span>
    <span>Commit <code>${esc(report.repositoryCommit)}</code></span>
    <span>Rules v${report.architectureVersion}</span>
  </div>
</div>

<div class="container">

  <!-- Score -->
  <div class="section">
    <div class="score-card">
      <div class="score-ring ${cls}">${report.score}</div>
      <div class="score-detail">
        <h2>Architecture Score</h2>
        <span class="badge ${cls}">${report.passed ? 'PASS' : 'FAIL'}</span>
        ${renderSeverityPills(report.summary)}
      </div>
    </div>
  </div>

  <!-- Checks + Top Violations -->
  <div class="grid-2 section">
    <div class="card">
      <h3>Check Results</h3>
      ${renderChecks(report.checkResults)}
    </div>
    <div class="card">
      <h3>Top Violations</h3>
      ${renderTopViolations(report.checkResults)}
    </div>
  </div>

  <!-- Domain Registry -->
  <div class="card section">
    <h3>Domain Registry</h3>
    ${renderRegistry(report.registry)}
  </div>

  <!-- Migration Progress + Trend History -->
  <div class="grid-2 section">
    <div class="card">
      <h3>Migration Progress</h3>
      ${renderMigrationProgress(report.registry)}
    </div>
    <div class="card">
      <h3>Trend History</h3>
      ${renderTrendChart(history)}
    </div>
  </div>

  <!-- Metrics -->
  <div class="section">
    <h3 style="margin-bottom:1rem">Architecture Metrics</h3>
    <div class="grid-4">
      ${renderMetrics(report.metrics)}
    </div>
  </div>

  <!-- Footer -->
  <div style="text-align:center;color:var(--muted);font-size:0.75rem;padding:2rem 0 1rem">
    Generated by Esparex Architecture Platform v${esc(report.toolVersion)}
    · <a href="architecture-report.json">JSON Report</a>
  </div>

</div>
</body>
</html>`;
}
