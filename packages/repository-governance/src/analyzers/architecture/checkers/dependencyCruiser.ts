import { Checker, AnalyzerContext } from "../../../types/index.js";
import { runSpawn, getBinPath } from "../../../utils/exec.js";
import * as fs from "fs";
import * as path from "path";

export class DependencyCruiserChecker implements Checker<{ passed: boolean; errorOutput?: string }> {
  id = "dependency-cruiser";
  name = "Dependency Cruiser Checker";
  private targetPath: string;

  constructor(targetPath: string) {
    this.targetPath = targetPath;
  }

  async check(context: AnalyzerContext): Promise<{ passed: boolean; errorOutput?: string }> {
    const root = context.workspaceRoot;
    const configPath = path.join(root, ".dependency-cruiser.cjs");

    if (!fs.existsSync(configPath)) {
      return {
        passed: false,
        errorOutput: ".dependency-cruiser.cjs not found. Run scripts/architecture/generate-depcruiser.js"
      };
    }

    const bin = getBinPath(root, "depcruise");
    const result = runSpawn(
      bin,
      ["--config", ".dependency-cruiser.cjs", "--output-type", "err", this.targetPath],
      { cwd: root }
    );

    const combinedOutput = (result.stdout || "") + (result.stderr || "");

    if (result.status !== 0) {
      return {
        passed: false,
        errorOutput: combinedOutput.trim()
      };
    }

    return { passed: true };
  }
}
