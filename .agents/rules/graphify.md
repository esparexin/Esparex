---
trigger: always_on
description: Consult the graphify knowledge graph at graphify-out/ for codebase and architecture questions.
---

## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:
- For codebase or architecture questions, when `graphify-out/graph.json` exists, first run `graphify query "<question>"` (CLI) or `query_graph` (MCP). Use `graphify path "<A>" "<B>"` / `shortest_path` for relationships and `graphify explain "<concept>"` / `get_node` for focused concepts. These return a scoped subgraph, usually much smaller than `GRAPH_REPORT.md` or raw grep output.
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context
- After modifying code files in this session, run `graphify update .` to keep the graph current (AST-only, no API cost)

## Artifact Governance

Generated outputs are classified as:

| Classification | Directory/Pattern | Committed |
|---|---|---|
| Source | `core/src/**`, `backend/api/src/**`, `.agents/**`, `tooling/**` | ✅ Yes |
| Generated | `graphify-out/` (all contents) | ❌ Never |
| Generated | `.tooling/` (all contents) | ❌ Never |
| Cache | `.eslintcache/`, `__pycache__/`, `.venv/` | ❌ Never |
| Export | `*.graphml`, `cypher.txt`, `GRAPH_REPORT.md` (root-level) | ❌ Never |
| Snapshot | `graphify-out/YYYY-MM-DD/` | ❌ Never |

Rules:
- Set `GRAPHIFY_NO_BACKUP=1` in the environment when running `graphify update .` during AI sessions to suppress dated backup folders (`graphify-out/YYYY-MM-DD/`).
- Never run `graphify` with `--graphml`, `--neo4j`, or `--svg` flags unless the user explicitly requests it, as these create additional large output files.
- `graphify-out/` is fully git-ignored. No file within it should ever be staged or committed.

