import * as fs from "fs";
import * as path from "path";
import type { BrainSnapshot } from "@esparex/repository-brain";
import { GovernanceAnalyzer, AnalysisResultEnvelope, ViolationSeverity } from "../../types/index.js";

export interface RBACCheckViolation {
  file: string;
  route: string;
  severity: ViolationSeverity;
  message: string;
}

export class RBACAnalyzer implements GovernanceAnalyzer<RBACCheckViolation[]> {
  id = "rbac-check";
  category = "security" as const;

  async analyze(snapshot: BrainSnapshot): Promise<AnalysisResultEnvelope<RBACCheckViolation[]>> {
    const violations: RBACCheckViolation[] = [];
    const workspaceRoot = snapshot.repository.root;

    // RBAC middleware references to look for
    const rbacPatterns = [
      /requireRole\s*\(/,
      /requireAuth\s*\(/,
      /isAdmin\b/,
      /authenticate\s*\(/,
      /authorize\s*\(/,
      /protectRoute\s*\(/,
      /middleware\s*\.\s*auth/,
      /RoleGuard/,
      /AuthGuard/
    ];

    const routeFiles = (snapshot.repository.files || []).filter(f =>
      /\/routes\//.test(f) && /\.(ts|js)$/.test(f) && !/\.(test|spec)\./.test(f)
    );

    for (const file of routeFiles) {
      let content: string;
      try {
        content = fs.readFileSync(path.join(workspaceRoot, file), "utf-8");
      } catch {
        continue;
      }

      // Check if route defines any endpoints (has router.get/post/put/delete)
      const hasRouteDefinition = /router\.(get|post|put|delete|patch)\s*\(/.test(content);
      if (!hasRouteDefinition) continue;

      // Check for RBAC middleware presence
      const hasRBAC = rbacPatterns.some(p => p.test(content));

      if (!hasRBAC) {
        violations.push({
          file,
          route: file,
          severity: "warning",
          message: `Route file ${file} defines endpoints but no RBAC middleware detected. Consider adding requireRole() or requireAuth().`
        });
      }
    }

    const startTime = Date.now();
    return {
      schemaVersion: "1.0.0",
      analyzerId: this.id,
      timestamp: new Date().toISOString(),
      status: "success",
      durationMs: Date.now() - startTime,
      warningsCount: violations.length,
      errorsCount: 0,
      metadata: {},
      payload: violations
    };
  }
}
