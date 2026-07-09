# Taste (Continuously Learned by [CommandCode][cmd])

[cmd]: https://commandcode.ai/


# workflow
- When conducting repository documentation audits, follow a structured multi-phase methodology: audit → verify → report → approval → cleanup, covering duplicate detection, legacy detection, dead/orphan docs, SSOT validation, broken references, and git safety verification. Confidence: 0.70

# workflow
- When conducting audits of the codebase, strictly follow audit-only mode: do not implement any fixes, code changes, or improvements during the audit itself. Confidence: 0.85
- Strict rule: Do not create new features or functions. Only fix architecture issues, governance issues, rules, SSOT, and SOP. Confidence: 0.80

# testing
- When adding test coverage, first add the framework and write meaningful tests, then add coverage thresholds only after a stable baseline is established. Confidence: 0.75
- Priority order: (1) increase test coverage (core, backend, shared), (2) parallelize CI, (3) backend completion + security hardening, (4) Docker/local parity (optional), (5) governance docs → backlog. Confidence: 0.75

# workflow
- After stabilization/cleanup is complete, switch to feature-development phase: prioritize tests, operational reliability, and shipping functionality over structural cleanup or governance reorganization. Confidence: 0.70
- Before implementing any recommendation, verify the finding independently and understand why existing configurations exist before changing them. Confidence: 0.70
- When improving existing code, extend the current logic rather than replacing it wholesale. Confidence: 0.65
- Before parallelizing CI or refactoring build pipelines, audit workspace dependency graphs first to avoid introducing flaky jobs. Confidence: 0.60
- Before deleting any code, verify it is safe to delete via imports, runtime references, package.json scripts, CI workflows, git history, and dynamic require/import references. If verification fails, restore immediately. Confidence: 0.75

# workflow
- When fixing CI failures or code errors, first understand the root cause before applying any fix; do not fix blindly. Confidence: 0.70
- For large file refactoring/decomposition: execute exactly one file per PR in sequential order (one issue → one branch → one PR → merge → next); never combine multiple file splits in a single PR. Confidence: 0.75
