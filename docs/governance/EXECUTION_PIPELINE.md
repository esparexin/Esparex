# Governance Execution Pipeline

The execution pipeline processes target workspace files through a topological validator graph, executing them in a stable and reproducible order.

---

## 1. Topological Sorting & Dependency Ordering

To execute validators containing inter-dependencies correctly, the engine uses a depth-first search (DFS) topological sort algorithm.

### Execution Scheduler Ordering Algorithm
- Stable sorting by **priority** is applied first.
- Pre-sorted items are traversed; if a validator declares dependencies, its dependency validators are traversed and scheduled before it.
- If a dependency node is already visiting, a cycle is detected, and execution is halted immediately.

---

## 2. CLI Execution Filtering

Filters specified in the CLI (such as `--rule`, `--category`, `--validator`, `--owner`, `--severity`) are evaluated during the planning phase:
- Active validators are filtered down to only those claiming the targeted rules or categories.
- Topological sort is then run on the subset of matched validators to construct a safe, minimal execution plan.
- The scheduler runs only the planned validators.
