# Authoritative Frameworks and Boundaries

This reference maps package boundaries and framework assignments across the Esparex monorepo.

---

## 1. Monorepo Package Layout

The monorepo contains the following workspace packages:

| Workspace | Package Name | Role | Technology Stack |
| :--- | :--- | :--- | :--- |
| `apps/web` | `@esparex/apps-web` | Client Web Portal | Next.js (App Router) + React |
| `apps/admin` | `@esparex/apps-admin` | Admin Portal | Next.js (App Router) + React |
| `backend/api` | `@esparex/backend-api` | REST Server | Express (v5.x) + Node.js |
| `core` | `@esparex/core` | Service Layer | Pure TypeScript Class Services |
| `shared` | `@esparex/shared` | Model Definitions | Zod schemas, TypeScript types |

---

## 2. Dependency Direction Boundaries

To maintain modularity and compile successfully, dependency boundaries must follow this single direction:

```text
Apps (web / admin) ──> Backend API ──> Core Services ──> Shared schemas/types
```

### Invariant Rules
- **No Upstream Imports**: Imports from `apps/` or `backend/` into `core/` or `shared/` are strictly prohibited.
- **Shared Layer Isolation**: `@esparex/shared` must not import anything from `core/` or the apps. It must remain a leaf package containing only Zod shapes, custom validator preprocessors, and TypeScript interfaces.
- **Framework Independence**: The `core` package must remain framework-independent. Banish Express request/response types or any HTTP-specific modules from `core/src/services`.
