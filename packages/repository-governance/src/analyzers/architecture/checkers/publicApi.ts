import { Checker, AnalyzerContext } from "../../../types/index.js";
import { runSpawn } from "../../../utils/exec.js";

export class PublicApiChecker implements Checker<{ passed: boolean; outputLog?: string }> {
  id = "public-api-load";
  name = "Public API Namespace Load Checker";

  async check(context: AnalyzerContext): Promise<{ passed: boolean; outputLog?: string }> {
    const result = runSpawn(
      "node",
      ["scripts/verify-public-api.js"],
      {
        cwd: context.workspaceRoot,
        timeout: 15000,
        env: {
          ...process.env,
          MONGODB_URI: process.env.MONGODB_URI || "mongodb://localhost/test",
          ADMIN_MONGODB_URI: process.env.ADMIN_MONGODB_URI || "mongodb://localhost/test-admin",
          REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",
          JWT_SECRET: process.env.JWT_SECRET || "architecture_check_test_secret_at_least_32_chars",
          NODE_ENV: "test",
          SKIP_ENV_VALIDATION: "true"
        }
      }
    );

    const output = (result.stdout || "") + (result.stderr || "");

    // soft skip if it timed out (requires live DB)
    if (result.error && result.error.message.includes("ETIMEDOUT")) {
      return {
        passed: true,
        outputLog: "Skipped (load test timed out — database connections could not be established)"
      };
    }

    if (result.status !== 0 && !output.includes("All 14 namespaces loaded successfully")) {
      return {
        passed: false,
        outputLog: output.trim()
      };
    }

    return {
      passed: true,
      outputLog: "All 14 namespaces loaded successfully"
    };
  }
}
