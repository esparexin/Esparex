import { Checker, AnalyzerContext } from "../../../types/index.js";
import { runSpawn } from "../../../utils/exec.js";

export class DeepImportChecker implements Checker<{ passed: boolean; filesFound: string[] }> {
  id = "deep-imports";
  name = "Deep Imports Checker";

  async check(context: AnalyzerContext): Promise<{ passed: boolean; filesFound: string[] }> {
    const result = runSpawn(
      "git",
      ["grep", "-rn", "--", "@esparex/core/[a-zA-Z0-9_-]+/"],
      { cwd: context.workspaceRoot }
    );

    // git grep exits with 1 if no matches are found, which means PASS
    const stdout = result.stdout.trim();
    if (result.status === 0 && stdout) {
      const filesFound = stdout.split("\n").map(line => line.trim()).filter(Boolean);
      return { passed: false, filesFound };
    }

    return { passed: true, filesFound: [] };
  }
}
