import { RepositoryInventory, readJsonFile } from "@esparex/repository-scanner";
import { BrainProvider, BrainFragment } from "./provider.js";
import * as path from "path";

export class ConfigurationProvider implements BrainProvider {
  readonly id = "configuration-provider";

  async load(inventory: RepositoryInventory, workspaceRoot: string): Promise<BrainFragment> {
    const configDir = path.join(workspaceRoot, "packages/repository-brain/config");

    const architecture = readJsonFile(configDir, "architecture.json");
    const policies = readJsonFile(configDir, "policies.json");
    const vocabulary = readJsonFile(configDir, "vocabulary.json");
    const codingStandards = readJsonFile(configDir, "coding-standards.json");

    return {
      namespace: "configuration",
      value: {
        architecture,
        policies,
        vocabulary,
        codingStandards
      }
    };
  }
}
