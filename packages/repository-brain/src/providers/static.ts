import { ArchitectureConventions, DeclarativePolicies, RepositoryVocabulary } from "../schema/index.js";
import { readJsonFile } from "../utils/fs.js";

export class StaticConfigProvider {
  static getArchitecture(workspaceRoot: string): ArchitectureConventions {
    return readJsonFile(workspaceRoot, ".agents/brain/static/architecture.json");
  }

  static getPolicies(workspaceRoot: string): DeclarativePolicies {
    return readJsonFile(workspaceRoot, ".agents/brain/static/policies.json");
  }

  static getVocabulary(workspaceRoot: string): RepositoryVocabulary {
    return readJsonFile(workspaceRoot, ".agents/brain/static/vocabulary.json");
  }

  static getCodingStandards(workspaceRoot: string): any {
    return readJsonFile(workspaceRoot, ".agents/brain/static/coding_standards.json");
  }
}
