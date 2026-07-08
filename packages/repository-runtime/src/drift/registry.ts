import type { BrainSnapshot } from "@esparex/repository-brain";
import { DriftFinding } from "../events/event-types.js";

export interface DriftComparator {
  readonly id: string;
  compare(previous: BrainSnapshot, current: BrainSnapshot): Promise<DriftFinding[]>;
}

/**
 * ComparatorRegistry
 *
 * Stores and manages active drift detection comparators.
 *
 * Why a registry?
 *   It enforces extensibility. Future comparators (Docker, Kubernetes, CI configurations,
 *   lint config shifts) can be added as plugin modules without modifying the runtime orchestrator.
 */
export class ComparatorRegistry {
  private comparators = new Map<string, DriftComparator>();

  /** Register a drift comparator. Throws if a comparator with the same ID is already registered. */
  register(comparator: DriftComparator): this {
    if (this.comparators.has(comparator.id)) {
      throw new Error(`ComparatorRegistry: comparator with ID "${comparator.id}" is already registered.`);
    }
    this.comparators.set(comparator.id, comparator);
    return this;
  }

  /** Deregister a comparator by ID. */
  deregister(id: string): boolean {
    return this.comparators.delete(id);
  }

  /** Retrieve a comparator by ID. */
  get(id: string): DriftComparator | undefined {
    return this.comparators.get(id);
  }

  /** Retrieve all registered comparators. */
  list(): DriftComparator[] {
    return Array.from(this.comparators.values());
  }

  /** Clears the registry (useful for testing). */
  clear(): void {
    this.comparators.clear();
  }
}
