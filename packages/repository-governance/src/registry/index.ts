import { PluginRegistry } from "../types/index.js";
import {
  UnicodeHygieneAnalyzer, GitAnalyzer, EnvAnalyzer, ArchitectureAnalyzer,
  SecureUploadAnalyzer, RBACAnalyzer,
  FontLoadingAnalyzer, RenderBlockingAnalyzer,
  ObservabilityAnalyzer, DTOGovernanceAnalyzer, AppRouterLayoutAnalyzer, DriftPreventionAnalyzer
} from "../analyzers/index.js";
import {
  UnicodeValidator, GitValidator, EnvValidator, ArchitectureValidator,
  SecureUploadValidator, RBACCheckValidator,
  FontLoadingValidator, RenderBlockingValidator,
  ObservabilityValidator, DTOGovernanceValidator, AppRouterLayoutValidator, DriftPreventionValidator
} from "../validators/index.js";
import { ConsoleReporter, JsonReporter, HtmlReporter, MarkdownReporter, MetricsAggregator } from "../reporters/index.js";

export const DefaultRegistry: PluginRegistry = {
  analyzers: [
    new UnicodeHygieneAnalyzer(),
    new GitAnalyzer(),
    new EnvAnalyzer(),
    new ArchitectureAnalyzer(),
    new SecureUploadAnalyzer(),
    new RBACAnalyzer(),
    new FontLoadingAnalyzer(),
    new RenderBlockingAnalyzer(),
    new ObservabilityAnalyzer(),
    new DTOGovernanceAnalyzer(),
    new AppRouterLayoutAnalyzer(),
    new DriftPreventionAnalyzer()
  ],
  validators: [
    new UnicodeValidator(),
    new GitValidator(),
    new EnvValidator(),
    new ArchitectureValidator(),
    new SecureUploadValidator(),
    new RBACCheckValidator(),
    new FontLoadingValidator(),
    new RenderBlockingValidator(),
    new ObservabilityValidator(),
    new DTOGovernanceValidator(),
    new AppRouterLayoutValidator(),
    new DriftPreventionValidator()
  ],
  reporters: [
    new ConsoleReporter(),
    new JsonReporter(),
    new HtmlReporter(),
    new MarkdownReporter(),
    new MetricsAggregator()
  ]
};
export { PluginRegistry };
