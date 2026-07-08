import { Reporter, GovernanceSummaryReport } from "../types/index.js";
import * as fs from "fs";

export interface MetricsSnapshot {
  timestamp: string;
  overallScore: number;
  totalAnalyzers: number;
  passedCount: number;
  failedCount: number;
  totalViolations: number;
  perValidator: {
    name: string;
    score: number;
    violationsCount: number;
    passed: boolean;
  }[];
}

export class MetricsAggregator implements Reporter {
  id = "metrics-aggregator";
  name = "Governance Metrics Aggregator";

  async write(report: GovernanceSummaryReport, options: Record<string, any>): Promise<void> {
    // Collate metrics into a structured snapshot
    const snapshot: MetricsSnapshot = {
      timestamp: report.timestamp,
      overallScore: report.overallScore,
      totalAnalyzers: report.results.length,
      passedCount: report.results.filter(r => r.passed).length,
      failedCount: report.results.filter(r => !r.passed).length,
      totalViolations: report.results.reduce((s, r) => s + r.violationsCount, 0),
      perValidator: report.results.map(r => ({
        name: r.name,
        score: r.score,
        violationsCount: r.violationsCount,
        passed: r.passed
      }))
    };

    // If a metrics file already exists, append to history
    const metricsPath = options.metricsPath || ".governance-metrics.json";
    let history: MetricsSnapshot[] = [];
    try {
      if (fs.existsSync(metricsPath)) {
        history = JSON.parse(fs.readFileSync(metricsPath, "utf-8"));
      }
    } catch {
      // Start fresh
    }

    history.push(snapshot);

    // Trim to last 100 entries
    if (history.length > 100) {
      history = history.slice(history.length - 100);
    }

    fs.writeFileSync(metricsPath, JSON.stringify(history, null, 2), "utf-8");
  }
}
