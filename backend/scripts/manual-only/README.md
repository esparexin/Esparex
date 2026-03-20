## Manual-Only Mutation Scripts

These scripts can mutate data or indexes and must **not** be part of normal local development flows.

Execution policy:

- Run only on explicit operator intent.
- Require `ALLOW_MANUAL_MUTATION=true` in the shell before execution.
- Never run against primary databases without sandbox rehearsal and snapshot comparison.

Current inventory and quarantine candidate list:

- `backend/logs/mutation-script-inventory.txt`
- `backend/logs/migration-rehearsal/mutation-script-quarantine-report.json`

Recommended command pattern:

```bash
ALLOW_MANUAL_MUTATION=true node <script-path>
```
