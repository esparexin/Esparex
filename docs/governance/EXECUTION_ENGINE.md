# Governance Execution Engine

The Governance Execution Engine is the centralized orchestration coordinator that executes governance scans on the codebase. It replaces the old hardcoded loader loops and isolates validator execution, handling filter dispatching, dependency ordering, timing diagnostics, and memory footprint tracking.

---

## 1. Engine Core Flow

```
Governance CLI ──> ExecutionEngine ──> ExecutionPlanner ──> ExecutionScheduler ──> Validators
```

The execution flow consists of three distinct pipeline stages:
1. **Registry Initialization**: Validator metadata (supported file types, execution priority, and prerequisites) is registered.
2. **Planner Assembly**: The planner resolves dependencies, runs cycle detection, applies filters (by rule, category, owner, etc.), and generates a topological execution schedule.
3. **Deterministic Scheduling**: The scheduler executes validators sequentially in topological order, isolating validator crashes and gathering granular timing and memory usage metrics.

---

## 2. Timing and Performance Instrumentation

Granular metrics are collected during execution:
- **Planning Duration**: Time elapsed during filter parsing and topological sort.
- **Execution Duration**: Milliseconds spent by each validator running analysis.
- **Memory Footprint**: Heap usage delta (`heapUsed`) recorded before and after execution of each validator block.

---

## 3. Failure Isolation

If a validator encounters an unhandled exception or crash, the scheduler intercepts it and logs a `Validator Crash` error under `ValidationResult.errors` instead of aborting the entire governance check, ensuring other validators still complete and report metrics.
