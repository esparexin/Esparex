import { RepositoryScanner } from "@esparex/repository-scanner";
import { BrainFactory } from "../factory/brain_factory.js";
import { BrainSnapshot } from "../schema/index.js";
import { BrainQuery } from "../query/index.js";

export class Brain {
  readonly snapshot: BrainSnapshot;
  readonly query: BrainQuery;

  private constructor(snapshot: BrainSnapshot) {
    this.snapshot = snapshot;
    this.query = new BrainQuery(snapshot);
  }

  static async load(options: { workspaceRoot?: string } = {}): Promise<Brain> {
    const workspaceRoot = options.workspaceRoot || process.cwd();
    const scanner = new RepositoryScanner({ workspaceRoot });
    const inventory = await scanner.scan();

    const snapshot = await BrainFactory.create({
      inventory,
      workspaceRoot
    });

    return new Brain(snapshot);
  }
}
