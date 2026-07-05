# Rollback Guide for Transport Separation

This guide defines the explicit commands for rolling back changes at any batch stage during the Transport Separation migration.

---

## 1. Rollback Tag Reference Map

After every batch successfully compiles, passes tests, and passes the integration gates, the commit will be tagged. If a regression is detected in a later batch, you can immediately revert back to the last verified tag state.

| Verified Batch Stage | Rollback Tag | Reversion Command |
| :--- | :--- | :--- |
| **Initial Stable Checkpoint** | `baseline-stable-v1` | `git reset --hard baseline-stable-v1` |
| **Batch 1: Middlewares** | `transport-batch-1` | `git reset --hard transport-batch-1` |
| **Batch 2: SmartAlert & Wallet** | `transport-batch-2` | `git reset --hard transport-batch-2` |
| **Batch 3: AI & Admin Systems** | `transport-batch-3` | `git reset --hard transport-batch-3` |
| **Batch 4: Admin Core Controllers** | `transport-batch-4` | `git reset --hard transport-batch-4` |
| **Batch 5: Catalog, Plan & Splits** | `transport-batch-5` | `git reset --hard transport-batch-5` |

---

## 2. Step-by-Step Rollback Execution Procedure

If verification fails at any stage (e.g. during Batch 3 validation):

1. **Abort Current Run**: Terminate any running development server loops or testing frameworks.
2. **Discard Local Changes**:
   ```bash
   git add .
   git reset --hard HEAD
   ```
3. **Checkout Last Valid Tag**: Revert back to the tag checkpoint of the previous successful batch:
   ```bash
   # Revert local working tree to Batch 2 state
   git checkout transport-batch-2
   ```
4. **Clean Workspace Installs & Cache**:
   ```bash
   npm run clean:workspace-installs
   npm install
   ```
5. **Verify Reversion**: Assert that the baseline compiles:
   ```bash
   npm run type-check
   npm run build
   ```
