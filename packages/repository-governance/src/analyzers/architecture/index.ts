import { Analyzer, AnalyzerContext, AnalysisResultEnvelope, ArchitectureAnalysisPayload } from "../../types/index.js";
import { DeepImportChecker } from "./checkers/deepImports.js";
import { CircularDependencyChecker } from "./checkers/circular.js";
import { DependencyCruiserChecker } from "./checkers/dependencyCruiser.js";
import { PublicApiChecker } from "./checkers/publicApi.js";

export class ArchitectureAnalyzer implements Analyzer<ArchitectureAnalysisPayload> {
  metadata = {
    id: "architecture",
    name: "Architecture Governance Analyzer",
    category: "architecture" as const,
    version: "1.1.0",
    dependsOn: []
  };

  async run(context: AnalyzerContext): Promise<AnalysisResultEnvelope<ArchitectureAnalysisPayload>> {
    const startTime = Date.now();

    // Check configuration parameters
    const fastMode = context.config.fastMode === true || context.config.architecture?.fastMode === true;

    // Instantiate checkers
    const deepImportChecker = new DeepImportChecker();
    const circularChecker = new CircularDependencyChecker();
    const boundaryCoreChecker = new DependencyCruiserChecker("core/src");
    const boundaryBackendChecker = new DependencyCruiserChecker("backend/user/src");
    const publicApiChecker = new PublicApiChecker();

    // Execute checkers
    const deepImportsRes = await deepImportChecker.check(context);
    const circularRes = await circularChecker.check(context);

    let boundaryCoreRes: { passed: boolean; errorOutput?: string } = { passed: true, errorOutput: "Skipped in fast mode" };
    let boundaryBackendRes: { passed: boolean; errorOutput?: string } = { passed: true, errorOutput: "Skipped in fast mode" };
    let publicApiRes: { passed: boolean; outputLog?: string } = { passed: true, outputLog: "Skipped in fast mode" };

    if (!fastMode) {
      boundaryCoreRes = await boundaryCoreChecker.check(context);
      boundaryBackendRes = await boundaryBackendChecker.check(context);
      publicApiRes = await publicApiChecker.check(context);
    }

    const payload: ArchitectureAnalysisPayload = {
      deepImports: deepImportsRes,
      circular: circularRes,
      boundaryCore: boundaryCoreRes,
      boundaryBackend: boundaryBackendRes,
      publicApi: publicApiRes
    };

    let errorsCount = 0;
    if (!deepImportsRes.passed) errorsCount++;
    if (!circularRes.passed) errorsCount++;
    if (!boundaryCoreRes.passed) errorsCount++;
    if (!boundaryBackendRes.passed) errorsCount++;
    if (!publicApiRes.passed) errorsCount++;

    return {
      schemaVersion: "1.0.0",
      analyzerId: this.metadata.id,
      timestamp: new Date().toISOString(),
      status: "success",
      durationMs: Date.now() - startTime,
      warningsCount: 0,
      errorsCount,
      metadata: { fastMode },
      payload
    };
  }
}
export { DeepImportChecker, CircularDependencyChecker, DependencyCruiserChecker, PublicApiChecker };
