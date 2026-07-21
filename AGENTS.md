# Esparex AGENTS.md — Architecture Governance

## Similarity Threshold Rule

Components, hooks, or services must not be merged solely because they appear similar. Before consolidation, document:

- Shared UI %
- Shared business rules %
- Shared validation %
- Shared API contract %
- Shared workflow %

Consolidation is recommended only when overall similarity > 75% AND no single dimension is < 50%.

If similarity is below the threshold, keep components separate even if they appear structurally similar. Different responsibilities, future trajectory, and domain-specific behavior must be preserved.
