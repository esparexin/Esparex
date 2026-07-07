import { RepositoryInventory } from "@esparex/repository-scanner";
import { BrainProvider, BrainFragment } from "../provider.js";

export class FrameworkProvider implements BrainProvider {
  readonly id = "framework-provider";

  async load(inventory: RepositoryInventory): Promise<BrainFragment> {
    const webDeps = inventory.dependencies["@esparex/apps-web"] || {};
    const adminDeps = inventory.dependencies["@esparex/apps-admin"] || {};
    const userDeps = inventory.dependencies["@esparex/backend-user"] || {};

    return {
      namespace: "framework",
      value: {
        express: userDeps.express || "unknown",
        next: webDeps.next || adminDeps.next || "unknown",
        react: webDeps.react || adminDeps.react || "unknown"
      }
    };
  }
}
