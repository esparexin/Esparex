# Workspace Tooling & Compiling Standards

This reference documents package management, build tools, and linter configurations.

---

## 1. Package Manager & Workspaces
- **Package Manager**: **npm** (version `10.9.7`). The presence of `package-lock.json` in the root is the authority. Do not run yarn, pnpm, or other custom runners unless explicitly authorized.
- **Monorepo Structure**: Uses npm workspaces. Execute commands workspace-wide using the `-w` flag:
  ```bash
  npm run build -w @esparex/shared
  ```

---

## 2. Formatting & Linting
- **Linter**: **ESLint** (v9.x).
- **Code Formatter**: Prettier.
- **Unused Imports Enforcement**: ESLint is configured to fail builds if there are new unused imports. Run linting using `npm run lint`.

---

## 3. Compiler Boundaries
- **Language**: TypeScript (`typescript`).
- **Workspace Build Order**:
  1. Build `@esparex/shared` (outputs typings and compiled modules to `shared/dist/`).
  2. Build `@esparex/core` (generates declarations and handles path mapping aliases via `tsc-alias`).
  3. Compile `@esparex/backend-api`.
  4. Type-check frontend portals (`apps/web` and `apps/admin`) via `tsc --noEmit`.
