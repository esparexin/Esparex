import { RepositoryInventory } from "@esparex/repository-scanner";

export interface BrainFragment {
  readonly namespace: string;
  readonly value: unknown;
}

export interface BrainProvider {
  readonly id: string;
  load(inventory: RepositoryInventory, workspaceRoot: string): Promise<BrainFragment>;
}
