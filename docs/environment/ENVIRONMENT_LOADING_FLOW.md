# Environment Loading Flow

This document visualizes the exact sequence of environment variable loading across different execution contexts.

## 1. Local Backend Development (Core/User)
When running `npm run dev` in `backend/api`:

```mermaid
graph TD
    A[.env (core) / .env (backend/api)] --> B[dotenv configuration]
    B --> C[core/src/config/loadEnvFiles.ts]
    C --> D[core/src/config/env.ts]
    D -->|Zod Schema Parse| E{Validation Check}
    E -->|Pass| F[Application Runtime]
    E -->|Fail| G[Throw Synchronous Boot Error]
```

## 2. Local Frontend Development (Next.js)
When running `npm run dev` in `apps/web` or `apps/admin`:

```mermaid
graph TD
    A[.env.local] --> B[Next.js Core Loader]
    B --> C{Process NEXT_PUBLIC_}
    C -->|Yes| D[Injected into Client Bundle]
    C -->|No| E[Available Server-Side Only]
    D --> F[Runtime Assertion / validateAdminApiEnv.ts]
    F --> G[Browser Runtime]
```

## 3. GitHub Actions CI Pipeline
When a PR is pushed, avoiding missing secret crashes during builds:

```mermaid
graph TD
    A[ci.yml env: block] --> B[GitHub Runner Context]
    B --> C[npm run build / Next.js]
    C -->|SKIP_ENV_VALIDATION=true| D{Bypass Local Validation}
    D -->|Pass| E[Build Complete]
```

## 4. Render Backend Deployment
When Render spins up the Node service:

```mermaid
graph TD
    A[Render Dashboard Environment Config] --> B[Docker / OS Environment variables]
    B --> C[core/src/config/env.ts]
    C -->|Zod Schema Parse| D{Validation Check}
    D -->|Pass| E[Application Runtime]
    D -->|Fail| F[Container Crash / Deploy Failed]
```

## 5. Vercel Frontend Deployment
When Vercel builds the Next.js applications:

```mermaid
graph TD
    A[Vercel Dashboard Environment Config] --> B[Vercel Build Environment]
    B --> C[Next.js SSG / getStaticPaths]
    C -->|Inlines NEXT_PUBLIC_| D[Edge Artifacts]
    D --> E[Browser Runtime]
```
