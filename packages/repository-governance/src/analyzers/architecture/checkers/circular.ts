import { Checker, AnalyzerContext } from "../../../types/index.js";
import { runSpawn } from "../../../utils/exec.js";

export class CircularDependencyChecker implements Checker<{ passed: boolean; cycles: string[][] }> {
  id = "circular-dependencies";
  name = "Circular Dependency Checker";

  async check(context: AnalyzerContext): Promise<{ passed: boolean; cycles: string[][] }> {
    // Run madge circular check
    const result = runSpawn(
      "npx",
      ["--yes", "madge", "--circular", "--extensions", "ts", "core/src"],
      { cwd: context.workspaceRoot }
    );

    const output = (result.stdout || "") + (result.stderr || "");
    const cycles: string[][] = [];

    // Parse cycles if madge output contains them
    // Output example:
    // ✖ Found 2 circular dependencies:
    //   1) a.ts > b.ts
    //   2) c.ts > d.ts
    if (output.includes("Found") && !output.includes("No circular")) {
      const lines = output.split("\n");
      let startParsing = false;
      for (const line of lines) {
        if (line.includes("circular dependencies")) {
          startParsing = true;
          continue;
        }
        if (startParsing) {
          const trimmed = line.trim();
          if (trimmed.match(/^\d+\)/)) {
            // e.g. "1) a.ts > b.ts > a.ts"
            const pathParts = trimmed.replace(/^\d+\)\s*/, "").split(/\s*>\s*/);
            cycles.push(pathParts);
          }
        }
      }
      return { passed: false, cycles };
    }

    return { passed: true, cycles: [] };
  }
}
