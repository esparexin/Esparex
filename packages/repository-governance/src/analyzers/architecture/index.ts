import type { BrainSnapshot } from "@esparex/repository-brain";
import { GovernanceAnalyzer, AnalysisResultEnvelope, ArchitectureAnalysisPayload } from "../../types/index.js";
import { DeepImportChecker } from "./checkers/deepImports.js";
import { CircularDependencyChecker } from "./checkers/circular.js";
import { DependencyCruiserChecker } from "./checkers/dependencyCruiser.js";
import { PublicApiChecker } from "./checkers/publicApi.js";

export class ArchitectureAnalyzer implements GovernanceAnalyzer<ArchitectureAnalysisPayload> {
  readonly id = "architecture";
  readonly category = "architecture" as const;

  async analyze(snapshot: BrainSnapshot): Promise<AnalysisResultEnvelope<ArchitectureAnalysisPayload>> {
    const startTime = Date.now();

    // All path context comes from the snapshot — never from AnalyzerContext.
    // Architecture layers and boundaries are modeled in the Brain and forwarded here.
    const root       = snapshot.repository.root;
    const layers     = snapshot.architecture.layers;
    const boundaries = snapshot.policies.boundaries;
    const fastMode   = false; // future: source from snapshot.codingStandards or a runtime flag

    const deepImportChecker      = new DeepImportChecker();
    const circularChecker        = new CircularDependencyChecker();
    const boundaryCoreChecker    = new DependencyCruiserChecker("core/src");
    const boundaryBackendChecker = new DependencyCruiserChecker("backend/user/src");
    const publicApiChecker       = new PublicApiChecker();

    // Build a minimal context shell so existing checkers still receive root.
    // Checkers that read context.workspaceRoot will use snapshot.repository.root.
    // @deprecated — checkers will be migrated to accept snapshot directly in Phase 5.
    const legacyContext = {
      workspaceRoot: root,
      config: { layers, boundaries },
      git: { currentBranch: snapshot.repository.branch, isClean: true }
    };

    const deepImportsRes  = await deepImportChecker.check(legacyContext);
    const circularRes     = await circularChecker.check(legacyContext);

    let boundaryCoreRes:    { passed: boolean; errorOutput?: string } = { passed: true, errorOutput: "Skipped in fast mode" };
    let boundaryBackendRes: { passed: boolean; errorOutput?: string } = { passed: true, errorOutput: "Skipped in fast mode" };
    let publicApiRes:       { passed: boolean; outputLog?: string }   = { passed: true, outputLog:  "Skipped in fast mode" };

    if (!fastMode) {
      boundaryCoreRes    = await boundaryCoreChecker.check(legacyContext);
      boundaryBackendRes = await boundaryBackendChecker.check(legacyContext);
      publicApiRes       = await publicApiChecker.check(legacyContext);
    }

    const payload: ArchitectureAnalysisPayload = {
      deepImports:    deepImportsRes,
      circular:       circularRes,
      boundaryCore:   boundaryCoreRes,
      boundaryBackend: boundaryBackendRes,
      publicApi:      publicApiRes
    };

    let errorsCount = 0;
    if (!deepImportsRes.passed)    errorsCount++;
    if (!circularRes.passed)       errorsCount++;
    if (!boundaryCoreRes.passed)   errorsCount++;
    if (!boundaryBackendRes.passed) errorsCount++;
    if (!publicApiRes.passed)      errorsCount++;

    return {
      schemaVersion: "1.0.0",
      analyzerId: this.id,
      timestamp: new Date().toISOString(),
      status: "success",
      durationMs: Date.now() - startTime,
      warningsCount: 0,
      errorsCount,
      metadata: { fastMode, layers, boundariesCount: Object.keys(boundaries).length },
      payload
    };
  }
}

export { DeepImportChecker, CircularDependencyChecker, DependencyCruiserChecker, PublicApiChecker };
