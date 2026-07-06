export * from "./types/index.js";
export * from "./engine/index.js";
export * from "./scoring/index.js";
export * from "./registry/index.js";
export * from "./analyzers/index.js";
export * from "./validators/index.js";
export * from "./reporters/index.js";

import { GovernanceEngine, EngineRunResult } from "./engine/index.js";
import { DefaultRegistry } from "./registry/index.js";

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

  return GovernanceEngine.run({
    workspaceRoot,
    registry: DefaultRegistry,
    profile,
    config
  });
}
