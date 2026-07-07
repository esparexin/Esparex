import { RepositoryInventory } from "@esparex/repository-scanner";
import { BrainProvider, BrainFragment } from "./provider.js";
import { FrameworkProvider } from "./technology/framework.js";
import { DatabaseProvider } from "./technology/database.js";
import { InfrastructureProvider } from "./technology/infrastructure.js";
import { RuntimeProvider } from "./technology/runtime.js";
import { ToolingProvider } from "./technology/tooling.js";

export class TechnologyProvider implements BrainProvider {
  readonly id = "technology-provider";

  async load(inventory: RepositoryInventory): Promise<BrainFragment> {
    const fChunk = await new FrameworkProvider().load(inventory);
    const dChunk = await new DatabaseProvider().load(inventory);
    const iChunk = await new InfrastructureProvider().load(inventory);
    const rChunk = await new RuntimeProvider().load(inventory);
    const tChunk = await new ToolingProvider().load(inventory);

    return {
      namespace: "technology",
      value: {
        ...(fChunk.value as object),
        ...(dChunk.value as object),
        ...(iChunk.value as object),
        ...(rChunk.value as object),
        ...(tChunk.value as object)
      }
    };
  }
}
