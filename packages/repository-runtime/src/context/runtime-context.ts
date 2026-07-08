import { RepositoryScanner } from "@esparex/repository-scanner";
import { BrainFactory } from "@esparex/repository-brain";
import { GovernanceEngine } from "@esparex/repository-governance";
import { SkillRegistry } from "@esparex/repository-skills";
import { EventBus } from "../events/event-bus.js";

export interface RuntimeLogger {
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
}

export interface RuntimeContext {
  readonly scanner: RepositoryScanner;
  readonly brain: typeof BrainFactory;
  readonly governance: typeof GovernanceEngine;
  readonly skills: SkillRegistry;
  readonly eventBus: EventBus;
  readonly logger: RuntimeLogger;
  readonly workspaceRoot: string;
}
