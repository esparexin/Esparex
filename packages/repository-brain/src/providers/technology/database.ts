import { RepositoryInventory } from "@esparex/repository-scanner";
import { BrainProvider, BrainFragment } from "../provider.js";

export class DatabaseProvider implements BrainProvider {
  readonly id = "database-provider";

  async load(inventory: RepositoryInventory): Promise<BrainFragment> {
    const userDeps = inventory.dependencies["@esparex/backend-user"] || {};
    const coreDeps = inventory.dependencies["@esparex/core"] || {};

    return {
      namespace: "database",
      value: {
        mongodb: userDeps.mongodb || "unknown",
        mongoose: coreDeps.mongoose || "unknown"
      }
    };
  }
}
