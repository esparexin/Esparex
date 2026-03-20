# Esparex Governance: Fix & Prevention Guide

This guide provides practical steps for resolving and preventing **Canonical Errors** (naming drift, schema violations, and contract breakages) in the Esparex project.

---

## 1. How to Identify Errors
The project uses automated "Guards" to detect drift. Run these commands locally before pushing any code:

### The "All-in-One" Check
```bash
bash scripts/enforce-local-quality-gates.sh
```
This runs linting, type-checking, and builds for both backend and frontend. If this fails, you likely have a **Canonical Naming Mismatch**.

### API Contract Check
To see if your frontend route definitions match the actual backend routes:
```bash
node scripts/verify-api-contract.js
```

---

## 2. The Process to Fix Canonical Errors

### Step A: Identify the Source of Truth (SSOT)
Refer to the `SYSTEM_CONSTITUTION.md`. Every entity has a "Canonical Owner":
- **Shared Schemas**: `shared/schemas/` (defines the payload shape).
- **Enums**: `shared/enums/` (defines status and categories).

### Step B: Align the Mismatch
1. **Find the drift**: For example, if the backend uses `categoryId` but the frontend uses `category`.
2. **Apply the fix**: Rename the field in the "drifting" module to match the **SSOT**.
3. **Check Plurality**: Ensure you aren't mixing `sparePart` and `spareParts`.
4. **Coordinate Order**: Ensure location coordinates are `[Longitude, Latitude]`.

### Step D: Audit the Guard Tool
Sometimes the "drift" is in the verification script itself. If a script reports a missing route that you can see in the code:
1. Check the extraction logic in the script (e.g., `extractBlock` or `regex` filters).
2. Ensure it accounts for new architectural patterns (like re-exports or shared modules).
3. Fix the script to restore the automated gate.

---

## 3. How to Prevent Errors

### Protocol 1: "Shared First" Development
When adding a new field or entity:
1. First, update the file in `shared/schemas/`.
2. Second, run `npm run build` in the `shared` directory.
3. Only then, import that type into the backend and frontend.

### Protocol 2: Use the Type Suffix
Strictly follow the naming convention for IDs to prevent confusion:
- **String IDs**: Always end with `Id` (e.g., `brandId`, `modelId`).
- **Full Objects**: Use the entity name directly (e.g., `brand`, `model`).

### Protocol 3: Commit Guards
Ensure your local `pre-commit` hooks are active. They run the scripts in the `scripts/` directory automatically to prevent any non-canonical code from reaching the repository.

---

> [!IMPORTANT]
> **Governance Rule 1.1**: Every business entity has one canonical owner module. Frontend mirrors contract, never invents alternate fields.
