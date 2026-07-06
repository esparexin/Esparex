import * as fs from "fs";
import { Reporter, GovernanceSummaryReport } from "../types/index.js";

export class JsonReporter implements Reporter {
  id = "json-reporter";
  name = "JSON File Reporter";

  async write(report: GovernanceSummaryReport, options: Record<string, any>): Promise<void> {
    const outputPath = options.outputPath || "./governance-report.json";
    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), "utf8");
    console.log(`JSON report successfully written to: ${outputPath}`);
  }
}
