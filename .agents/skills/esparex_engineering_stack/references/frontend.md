# Frontend Stack Conventions

This document governs the approved styling systems, state management libraries, and form patterns across frontend applications.

---

## 1. Approved Form Management
- **Primary Library**: **React Hook Form (RHF)** (`react-hook-form`).
- **Resolver**: `@hookform/resolvers/zod` to bind forms with Zod schemas.
- **Constraints**:
  - All form schema definitions must derive from shared schemas in `@esparex/shared`.
  - Local validation duplication is prohibited. Unpack or pick Zod shapes instead of re-typing boundaries.
  - UI inputs should bind using React Hook Form controller registration hooks.

---

## 2. Styling System Mappings

The frontend portals use specific, isolated styling configurations that must be adhered to:

- **User Web Portal (`apps/web`)**:
  - **Hybrid Layout**: Both TailwindCSS and Vanilla CSS Modules are approved and available.
  - **Usage Division**:
    - Use **TailwindCSS** utility classes for structural layouts, responsive grids, alignments, flexbox settings, margins, padding, and Radix UI primitive spacing configurations.
    - Use **Vanilla CSS Modules** (e.g., `[Component].module.css`) for complex visual design features, custom glassmorphism effects, overlay parameters, custom transitions, or specific overrides of style theme properties.
- **Admin Dashboard (`apps/admin`)**:
  - **TailwindCSS** is the primary styling system. Styling must be composed of utility classes.

---

## 3. Page Rendering Rules (Next.js)

- **Client-Side Rendering (CSR)**: Use `'use client'` at the top of files that rely on React hooks, state management, or browser APIs (like geolocation and file readers).
- **Server-Side Rendering (SSR)**: Keep layout wrappers and page entry routes as Server Components to optimize initial HTML load performance.

---

## 4. State Management
- **Server State**: Use TanStack Query (`@tanstack/react-query`) for fetching, caching, and updating server data. Avoid caching api requests in React local states.
- **UI State**: Use React Context / standard React `useState` hooks for local UI states (such as active modals, menu toggles, and drawer states).
