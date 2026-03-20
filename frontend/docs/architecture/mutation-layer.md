# Mutation Layer Architecture

This document describes the mutation layer architecture for the ESPAREX marketplace frontend.

## 1. Overview
The mutation layer (`src/mutations`) is responsible for managing all outgoing write operations (POST, PUT, PATCH, DELETE). It uses TanStack Query's `useMutation` hook to standardize write behaviors, cache invalidation, and UI synchronicity across the application. 

By grouping mutations inside `src/mutations`—separate from but integrated with `src/queries`—we enforce a clean separation of concerns away from the `src/api` fetching layer and the React view components.

## 2. Architecture structure
All mutations must follow this pattern:
- **`mutationKeys.ts`**: Contains the canonical list of keys used across mutations (prevents typos and duplication collisions).
- **`use[Action][Domain]Mutation.ts`**: Individual hook files for specific mutations. E.g., `useCreateAdMutation.ts`.
- **`index.ts`**: Exports all hooks to the rest of the application.

## 3. Hook Naming Rules
Files and exported hooks should aggressively follow standard TanStack conventions.
- Hook functions must be prefixed with `use` and end with `Mutation`. Example: `useUpdateUserMutation`.
- File names matching exactly the exported hook name are expected.

## 4. Query Invalidation
Every successful mutation must appropriately invalidate the system's corresponding query caches. This guarantees the UI actively and accurately updates upon successful write sequences without explicit page reloads.

To do this, mutations apply `queryClient.invalidateQueries` logic upon standard `onSuccess` triggers.

```ts
// Example: Invalidation Strategy
onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["ads"] });
    // Invalidate further keys if the mutation crosses domains (e.g. saves affecting user state)
}
```

## 5. Migrating Existing Components
When modifying legacy components to implement this new layer:
1. Identify any manually executed write operations, typically triggered inside `onSubmit` or `onClick` handles directly accessing `src/api/` logic via `try/catch`.
2. Remove local `isSubmitting`, `loading`, and `error` state mechanisms.
3. Replace the behavior via `const { mutateAsync, isPending } = use[Action]Mutation()`.
4. Run standard TypeScript verifications to ensure payloads and cache queries match properly across implementation phases.
