import { RepositoryInventory } from "@esparex/repository-scanner";
import { BrainProvider, BrainFragment } from "../provider.js";

export class InfrastructureProvider implements BrainProvider {
  readonly id = "infrastructure-provider";

  async load(inventory: RepositoryInventory): Promise<BrainFragment> {
    const coreDeps = inventory.dependencies["@esparex/core"] || {};

    return {
      namespace: "infrastructure",
      value: {
        redis: coreDeps.ioredis || "unknown",
        bullmq: coreDeps.bullmq || "unknown"
      }
    };
  }
}
