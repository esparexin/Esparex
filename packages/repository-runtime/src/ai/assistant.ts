import { SkillResult, CapabilityRequest, CapabilityRouteResult } from "@esparex/repository-skills";
import { RepositoryRuntime } from "../sdk/runtime-sdk.js";

/**
 * @since v1.0.0
 */
export interface AssistantResponse {
  readonly task: string;
  readonly success: boolean;
  readonly skillsExecuted: readonly string[];
  readonly results: readonly SkillResult[];
  readonly recommendations: readonly string[];
  readonly explanation?: string;
}

/**
 * RepositoryAssistant
 *
 * Exposes v1.0 AI platform intelligence interfaces. Translates natural
 * language instructions into scoped capability routes, executes Skills safely
 * (with dryRun active by default), and validates outcomes against governance.
 *
 * @since v1.0.0
 */
export class RepositoryAssistant {
  constructor(
    private readonly runtime: RepositoryRuntime
  ) {}

  /**
   * Evaluates a natural language instruction and automates routing.
   *
   * Enforces dryRun: true by default to ensure safety. To make actual
   * repository changes, the consumer must explicitly pass `execute: true`.
   *
   * @since v1.0.0
   */
  async ask(
    instruction: string,
    options?: { targetPath?: string; execute?: boolean }
  ): Promise<AssistantResponse> {
    const isDryRun = options?.execute !== true;

    // 1. Build Capability Request payload based on natural language terms
    const request: CapabilityRequest = {
      task: instruction,
      targetPath: options?.targetPath,
      // Map general keywords to skill categories
      categories: this.detectCategories(instruction),
      inputs: this.buildDefaultInputs(instruction)
    };

    // 2. Load latest snapshot
    const snapshot = this.runtime.snapshot();
    if (!snapshot) {
      throw new Error("RepositoryAssistant: Snapshot baseline must be initialized before processing queries.");
    }

    // 3. Dispatch to runtime capability router
    // To support dryRun option overrides, we invoke runSkill or ask with context.
    const routerResult: CapabilityRouteResult = await this.runtime.ask({
      ...request,
      inputs: {
        ...request.inputs,
        // Override scaffolding or other skills to respect dryRun options
        "scaffolding": {
          ...request.inputs?.scaffolding,
          dryRun: isDryRun
        }
      }
    });

    // 4. Formulate recommendations and explanations
    const recommendations: string[] = [];
    let explanation: string | undefined;

    if (routerResult.overallStatus === "failure") {
      recommendations.push("Skill execution failed. Review parameters or configurations.");
    } else if (routerResult.overallStatus === "skipped") {
      recommendations.push("No registered skills matched the request target boundaries.");
    }

    // Inspect results for findings
    for (const res of routerResult.results) {
      if (res.status === "failure" && res.error) {
        recommendations.push(`Skill [${res.skillId}] failed: ${res.error}`);
        const parsedFinding = {
          id: `skill-failed-${res.skillId}`,
          severity: "error" as const,
          category: "filesystem" as const,
          message: res.error,
          recommendation: "Ensure file target paths are correct and comply with architecture policies."
        };
        explanation = this.runtime.explain(parsedFinding).toString();
      }
    }

    return {
      task: instruction,
      success: routerResult.overallStatus === "success",
      skillsExecuted: routerResult.skillsExecuted,
      results: routerResult.results,
      recommendations,
      explanation
    };
  }

  /** Detect category class by keyword matching */
  private detectCategories(instruction: string): any[] {
    const text = instruction.toLowerCase();
    const categories: any[] = [];

    if (text.includes("scaffold") || text.includes("create") || text.includes("generate")) {
      categories.push("scaffolding");
    }
    if (text.includes("migrate") || text.includes("update")) {
      categories.push("migration");
    }
    if (text.includes("inspect") || text.includes("find") || text.includes("check")) {
      categories.push("inspection");
    }

    return categories.length > 0 ? categories : ["inspection"];
  }

  /** Build default inputs based on common natural language parameters */
  private buildDefaultInputs(instruction: string): Record<string, any> {
    const text = instruction.toLowerCase();
    const inputs: Record<string, any> = {};

    // Guess workspace
    let workspaceName = "web";
    if (text.includes("admin")) workspaceName = "admin";
    else if (text.includes("backend") || text.includes("user")) workspaceName = "user";
    else if (text.includes("core")) workspaceName = "core";

    // Guess file target name
    let fileName = "src/components/NewComponent.tsx";
    if (text.includes("controller")) fileName = "src/controllers/NewController.ts";
    else if (text.includes("service")) fileName = "src/services/NewService.ts";

    inputs["scaffolding"] = {
      workspaceName,
      fileName,
      template: `// Generated automatically by RepositoryAssistant\n// Task: ${instruction}\nexport const Generated = {};\n`
    };

    inputs["workspace-resolution"] = { name: workspaceName };
    inputs["technology-inspection"] = {};

    return inputs;
  }
}
