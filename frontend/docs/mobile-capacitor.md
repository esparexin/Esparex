# Mobile Wrapper Prep

This frontend is a server-dependent Next.js app. The safest first mobile release is a Capacitor wrapper that points to a hosted HTTPS user app via `server.url`.

## Required URLs

- `NEXT_PUBLIC_APP_URL`: the public HTTPS URL of the user-facing Next.js app.
- `NEXT_PUBLIC_API_URL`: the public HTTPS URL of the backend API, including `/api/v1`.
- `CAPACITOR_SERVER_URL`: the HTTPS URL that the native shell should load.

Example production/staging values:

```env
NEXT_PUBLIC_APP_URL=https://esparex.in
NEXT_PUBLIC_API_URL=https://api.exparex.in/api/v1
CAPACITOR_SERVER_URL=https://esparex.in
```

## Device-Safe Rules

- Do not ship Android or iOS builds that still point to `localhost`.
- Keep the app on HTTPS so cookie auth, location, and secure browser APIs continue to work.
- Prefer a real hosted user app for the first native wrapper release instead of trying to statically export this Next app.
- Disable PWA service-worker behavior inside the native shell to avoid stale-cache bugs.
- Disable web-push registration inside the native shell. Native push should replace it later.

## Before Scaffolding Capacitor

1. Confirm the final hosted app origin for the user app.
2. Confirm the final hosted API origin.
3. Confirm iOS/Android app IDs, app name, and icon/splash assets.
4. Keep web baseline green:
   - `npm --workspace frontend run type-check`
   - `npm --workspace frontend run build`
   - `npm --workspace backend run typecheck`
   - `npm --workspace backend run build`
