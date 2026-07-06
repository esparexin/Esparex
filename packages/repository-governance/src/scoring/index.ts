import { ValidationReport } from "../types/index.js";

export function calculateScore(report: ValidationReport): number {
  let score = 100;
  for (const violation of report.violations) {
    switch (violation.severity) {
      case "critical":
        score -= 50;
        break;
      case "error":
        score -= 15;
        break;
      case "warning":
        score -= 5;
        break;
      case "info":
      default:
        break;
    }
  }
  return Math.max(0, Math.min(100, score));
}

export function calculateOverallScore(reports: { score: number }[]): number {
  if (reports.length === 0) return 100;
  const total = reports.reduce((acc, curr) => acc + curr.score, 0);
  return Math.round(total / reports.length);
}
