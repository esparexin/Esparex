export * from "./types/index.js";
export * from "./engine/index.js";
export * from "./scoring/index.js";
export * from "./registry/index.js";
export * from "./analyzers/index.js";
export * from "./validators/index.js";
export * from "./reporters/index.js";

import { RepositoryScanner } from "@esparex/repository-scanner";
import { BrainFactory } from "@esparex/repository-brain";
import { GovernanceEngine, EngineRunResult } from "./engine/index.js";
import { DefaultRegistry } from "./registry/index.js";

/**
 * Convenience entry point for programmatic usage.
 * Runs the full Scanner → Brain → Governance pipeline for a given profile.
 */
export async function runProfile(
  profile: string,
  options: { workspaceRoot?: string; config?: Record<string, any> } = {}
): Promise<EngineRunResult> {
  const workspaceRoot = options.workspaceRoot || process.cwd();
  const config = options.config || {
    rules: {
      "unicode-hygiene": {},
      "git": {
        allowedBranches: ["main", "master", "develop", "feature/transport-separation-pr2"]
      },
      "env": {},
      "architecture": {
        weights: {
          deepImports: 30,
          circular: 20,
          boundaryCore: 20,
          boundaryBackend: 15,
          publicApi: 15
        }
      }
    }
  };

  const scanner   = new RepositoryScanner({ workspaceRoot });
  const inventory = await scanner.scan();
  const snapshot  = await BrainFactory.create({ inventory, workspaceRoot });

  return GovernanceEngine.run({
    snapshot,
    registry: DefaultRegistry,
    profile,
    config
  });
}
