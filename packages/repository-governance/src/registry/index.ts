import { PluginRegistry } from "../types/index.js";
import { UnicodeHygieneAnalyzer, GitAnalyzer, EnvAnalyzer, ArchitectureAnalyzer } from "../analyzers/index.js";
import { UnicodeValidator, GitValidator, EnvValidator, ArchitectureValidator } from "../validators/index.js";
import { ConsoleReporter, JsonReporter } from "../reporters/index.js";

export const DefaultRegistry: PluginRegistry = {
  analyzers: [
    new UnicodeHygieneAnalyzer(),
    new GitAnalyzer(),
    new EnvAnalyzer(),
    new ArchitectureAnalyzer()
  ],
  validators: [
    new UnicodeValidator(),
    new GitValidator(),
    new EnvValidator(),
    new ArchitectureValidator()
  ],
  reporters: [
    new ConsoleReporter(),
    new JsonReporter()
  ]
};
export { PluginRegistry };
