import { PluginRegistry } from "../types/index.js";
import { UnicodeHygieneAnalyzer, GitAnalyzer, EnvAnalyzer } from "../analyzers/index.js";
import { UnicodeValidator, GitValidator, EnvValidator } from "../validators/index.js";
import { ConsoleReporter, JsonReporter } from "../reporters/index.js";

export const DefaultRegistry: PluginRegistry = {
  analyzers: [
    new UnicodeHygieneAnalyzer(),
    new GitAnalyzer(),
    new EnvAnalyzer()
  ],
  validators: [
    new UnicodeValidator(),
    new GitValidator(),
    new EnvValidator()
  ],
  reporters: [
    new ConsoleReporter(),
    new JsonReporter()
  ]
};
export { PluginRegistry };
