import type { BenchmarkResult, Analyzer, GovernanceAnalyzer } from "../types/index.js";

export class BenchmarkHarness {
  async runAnalyzer(
    analyzer: Analyzer | GovernanceAnalyzer,
    runFn: () => Promise<any>,
    iterations: number = 3
  ): Promise<BenchmarkResult> {
    const id = "metadata" in analyzer ? analyzer.metadata.id : (analyzer as GovernanceAnalyzer).id;
    const runs: { durationMs: number; memoryMb: number }[] = [];

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      const startMem = process.memoryUsage().heapUsed;
      await runFn();
      const end = performance.now();
      const endMem = process.memoryUsage().heapUsed;
      runs.push({
        durationMs: end - start,
        memoryMb: (endMem - startMem) / (1024 * 1024)
      });
    }

    const durations = runs.map(r => r.durationMs);
    const memories = runs.map(r => r.memoryMb);

    return {
      analyzerId: id,
      runs,
      averageDurationMs: durations.reduce((a, b) => a + b, 0) / durations.length,
      averageMemoryMb: memories.reduce((a, b) => a + b, 0) / memories.length,
      minDurationMs: Math.min(...durations),
      maxDurationMs: Math.max(...durations)
    };
  }

  async runAll(
    analyzers: (Analyzer | GovernanceAnalyzer)[],
    context: any,
    iterations: number = 3
  ): Promise<BenchmarkResult[]> {
    const results: BenchmarkResult[] = [];
    for (const analyzer of analyzers) {
      const id = "metadata" in analyzer ? analyzer.metadata.id : (analyzer as GovernanceAnalyzer).id;
      const runFn = () => {
        if ("analyze" in analyzer) {
          return (analyzer as GovernanceAnalyzer).analyze(context);
        }
        return (analyzer as Analyzer).run(context);
      };
      results.push(await this.runAnalyzer(analyzer, runFn, iterations));
    }
    return results;
  }

  static formatReport(results: BenchmarkResult[]): string {
    const lines: string[] = [
      "# Governance Engine Benchmark Report",
      "",
      `| Analyzer | Avg Duration (ms) | Min (ms) | Max (ms) | Avg Memory (MB) |`,
      `|----------|------------------:|---------:|---------:|----------------:|`,
    ];
    for (const r of results) {
      lines.push(
        `| ${r.analyzerId} | ${r.averageDurationMs.toFixed(2)} | ${r.minDurationMs.toFixed(2)} | ${r.maxDurationMs.toFixed(2)} | ${r.averageMemoryMb.toFixed(2)} |`
      );
    }
    lines.push("");
    lines.push(`Total analyzers: ${results.length}`);
    return lines.join("\n");
  }
}
