# Esparex User Frontend Startup Failure Investigation

This document details the root-cause analysis, evidence, impact assessment, and resolution plan for the local startup failure of the user frontend application (`apps/web`).

---

## 1. Executive Summary
After launching the development server via `npm run dev:all`, the backend API (port 5001) and admin frontend (port 3001) started and ran successfully, but the user frontend (`apps/web` on port 3000) failed to load. The browser hung indefinitely on requests to `http://localhost:3000`. The investigation revealed that a zombie Node.js process (PID `13368`) from a previous session was holding port 3000 in a frozen state, blocking any new dev server instance from binding and causing timeouts for incoming requests.

---

## 2. Root Cause
On Windows systems, when a terminal orchestrator (like `concurrently` or a shell process) is force-closed, child processes spawned by Node.js (such as `next-server` or `start-server.js`) can become detached (orphans) and continue running in the background. 
* **Port-Hogging:** PID `13368` (a Next.js internal server runner) remained active, holding a TCP socket on port 3000 in a `CloseWait` / `Listen` loop.
* **Socket Deadlock:** The process was unresponsive (timed out on HTTP requests) but actively rejected any new process attempts to bind to port 3000 with a standard `EADDRINUSE` socket error.
* **Why only web failed:** 
  1. The backend API uses port 5001 and has a `predev` lifecycle hook that automatically kills any active process on port 5001 (`node ../../scripts/kill-port.js 5001`).
  2. The admin dashboard uses port 3001, which did not have a zombie process active in this session.
  3. The web app on port 3000 lacked any `predev` port-cleaning guard, leaving it completely vulnerable to the zombie process conflict.

---

## 3. Evidence

### 3.1 Next.js Binding Error
Running `npm run dev -w @esparex/apps-web` directly generated the following output:
```text
> @esparex/apps-web@0.0.0 dev
> cross-env NODE_OPTIONS=--disable-warning=DEP0169 next dev -p 3000

⨯ Failed to start server
Error: listen EADDRINUSE: address already in use :::3000
    at <unknown> (Error: listen EADDRINUSE: address already in use :::3000) {
  code: 'EADDRINUSE',
  errno: -4091,
  syscall: 'listen',
  address: '::',
  port: 3000
}
```

### 3.2 Socket Ownership (Windows netstat)
```powershell
PS C:\Users\Administrator\Documents\GitHub\Esparex> Get-NetTCPConnection -LocalPort 3000
LocalAddress LocalPort     State OwningProcess
------------ ---------     ----- -------------
::1               3000 CloseWait         13368
::                3000    Listen         13368
```

### 3.3 Zombie Process Context
```powershell
PS C:\Users\Administrator\Documents\GitHub\Esparex> (Get-CimInstance Win32_Process -Filter "ProcessId = 13368").CommandLine
"C:\Program Files\nodejs\node.exe" C:\Users\Administrator\Documents\GitHub\Esparex\node_modules\next\dist\server\lib\start-server.js
```

---

## 4. Impact Assessment
* **User Frontend (`apps/web`):** Complete outage locally. Unable to boot new instances (crash with `EADDRINUSE`) or load existing connections (timeouts in the browser).
* **Admin Frontend (`apps/admin`):** unaffected (operational on port 3001).
* **Backend API (`backend/api`):** unaffected (operational on port 5001 due to automatic port-killing guard).

---

## 5. Fix Plan

1. **Terminate the Zombie Process (Executed):**
   Killed the zombie processes PID `13368` and PID `11848` to immediately free port 3000.
2. **Add Port-Clearing Guards to Frontend Packages (Executed):**
   Configured the existing cross-platform `scripts/kill-port.js` as a `predev` hook inside both frontend packages. This guarantees that whenever a developer runs `npm run dev`, any hanging processes on ports 3000 and 3001 are safely cleaned up first.

### package.json Diffs

```diff
  // apps/web/package.json
  "scripts": {
+   "clean": "node ../../scripts/kill-port.js 3000",
+   "predev": "npm run clean",
    "dev": "cross-env NODE_OPTIONS=--disable-warning=DEP0169 next dev -p 3000",
```

```diff
  // apps/admin/package.json
  "scripts": {
+   "clean": "node ../../scripts/kill-port.js 3001",
+   "predev": "npm run clean",
    "dev": "next dev -p 3001",
```

---

## 6. Verification Checklist

- [x] **Clear Zombie Process:** Verified port 3000 is fully released.
- [x] **Dev Server Startup:** Running `npm run dev -w @esparex/apps-web` launches the Next.js Turbopack compiler without EADDRINUSE errors.
- [x] **Local Connectivity:** `Invoke-WebRequest -Uri http://localhost:3000` returns `200 OK` instantly (no timeouts).
- [x] **Type Integrity:** `npm run type-check` completes successfully with 0 errors across all workspaces.
- [x] **Developer Flow:** Future launches of `npm run dev:all` automatically clear ports 3000, 3001, and 5001 before starting up, ensuring a clean start every time.
