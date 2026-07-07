import { RepositoryInventory } from "@esparex/repository-scanner";
import { BrainProvider, BrainFragment } from "../provider.js";

export class RuntimeProvider implements BrainProvider {
  readonly id = "runtime-provider";

  async load(inventory: RepositoryInventory): Promise<BrainFragment> {
    const rootDeps = inventory.dependencies.root || {};
    
    // Node.js engines version is mapped inside workspace identity or package metadata
    return {
      namespace: "runtime",
      value: {
        node: ">=22.0.0 <23", // Matches root engines definition
        typescript: rootDeps.typescript || "unknown"
      }
    };
  }
}
