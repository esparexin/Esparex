import { RepositoryInventory } from "@esparex/repository-scanner";
import { BrainProvider, BrainFragment } from "../provider.js";

export class ToolingProvider implements BrainProvider {
  readonly id = "tooling-provider";

  async load(inventory: RepositoryInventory): Promise<BrainFragment> {
    const webDeps = inventory.dependencies["@esparex/apps-web"] || {};
    const userDeps = inventory.dependencies["@esparex/backend-user"] || {};

    return {
      namespace: "tooling",
      value: {
        jest: userDeps.jest || "unknown",
        playwright: webDeps.playwright || webDeps["@playwright/test"] || "unknown"
      }
    };
  }
}
