# Error Handling Architecture

This document describes the centralized error handling architecture for the ESPAREX marketplace frontend.

## 1. Overview
The `src/errors` layer provides a unified error handling system replacing unstructured native `console.error` and `throw new Error()` setups. Error normalization improves observability without leaking implementation stack traces globally onto application viewframes directly, converting ambiguous `AxiosError`, `DOMError`, and `fetch()` disruptions into cleanly structured `AppError` objects.

## 2. Global Error Structure
All network or client-side runtime crashes are wrapped inside an `AppError` instance natively.
```ts
export class AppError extends Error {
  code?: string;
  status?: number;
  details?: unknown; // E.g., nested JSON outputs explicitly providing granular info.
}
```

## 3. Error Normalization (`normalizeApiError`)
The system intercepts outgoing `.get`, `.post`, `.put`, `.patch`, `.delete` commands strictly at the `apiClient` level globally via:
```ts
try {
  const res = await apiCall();
} catch (error) {
  throw normalizeApiError(error);
}
```
This forces all underlying Axios intercepts into consistent outputs.

## 4. Error Logging
Currently, `src/errors/errorLogger.ts` outputs secure and strongly typed console warnings during runtime execution environments safely. 

## 5. Global Boundary (`ErrorBoundary`)
`src/app/layout.tsx` binds `<ErrorBoundary />` tightly executing catch flows globally across standard client components natively. Should an entire route component crash un-safely (e.g. attempting to structurally parse `null.data`), the Error Boundary securely logs output parameters without completely destroying the React Fiber DOM tree, falling back tightly via `ErrorFallback.tsx`.

### Migration Strategy
Developers implementing future network actions safely bypass manual `try { } catch(e)` blocks explicitly handling normalization within nested hooks. Do not rewrite native error shapes manually. Rely purely upon the central `AppError` wrapper instance for consistency.
