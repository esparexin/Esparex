import { BrainProvider } from "../providers/provider.js";
import { WorkspaceProvider } from "../providers/workspace.js";
import { TechnologyProvider } from "../providers/technology.js";
import { ConfigurationProvider } from "../providers/configuration.js";

export class ProviderRegistry {
  private providers: BrainProvider[] = [];

  constructor() {
    // Register defaults
    this.register(new WorkspaceProvider());
    this.register(new TechnologyProvider());
    this.register(new ConfigurationProvider());
  }

  register(provider: BrainProvider): void {
    this.providers.push(provider);
  }

  getProviders(): readonly BrainProvider[] {
    return Object.freeze([...this.providers]);
  }
}
