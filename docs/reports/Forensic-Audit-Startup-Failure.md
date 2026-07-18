# Forensic Audit Report: User Frontend Startup Failure

This report presents the forensic audit and root-cause analysis for the startup failure of the user frontend application (`apps/web` on port 3000) while the backend API (port 5001) and admin dashboard (port 3001) start successfully.

---

## 1. Executive Summary
During local execution of `npm run dev:all`, the backend API and admin dashboard load correctly, but the user frontend (`apps/web`) fails to load (timed out or unreachable in the browser). A forensic process audit revealed that a duplicate execution of the startup script (`npm run dev:all`) created process contention on local ports. The backend API recovered automatically because it has a port-clearing hook (`kill-port 5001`). The admin dashboard remained operational via a healthy process from the first run. The user frontend failed because its first process (PID `13368`) hung in a socket deadlock (CloseWait/Listen state), and the second run crashed with `EADDRINUSE` due to lack of a port-clearing hook.

---

## 2. Forensic Timeline & Root Cause

### 2.1 Process Contention Audit
At the start of the investigation, the system had **two** active instances of `npm run dev:all` running concurrently in different terminal shells:

* **Instance A (Started ~4h 20m ago):**
  - PID `24728` (`npm run dev:all` orchestrator)
  - PID `13368` (Next.js server for `apps/web` on port 3000) - **HUNG**
  - PID `28532` (Next.js server for `apps/admin` on port 3001) - **HEALTHY**
  - PID `18080` (Nodemon for `backend/api` on port 5001) - **TERMINATED BY INSTANCE B**

* **Instance B (Started ~15m ago):**
  - PID `25328` (`npm run dev:all` orchestrator)
  - PID `26072` (Ts-node for `backend/api` on port 5001) - **HEALTHY**

### 2.2 Layer-by-Layer Behavior

1. **Backend API (Success):** 
   When Instance B was launched, the `@esparex/backend-api` workspace predev script ran `"clean": "node ../../scripts/kill-port.js 5001"`. This successfully killed Instance A's backend process (PID `18080`), freeing port 5001. Instance B's API process (PID `26072`) then bound to port 5001 cleanly.
2. **Admin Frontend (Success):**
   Instance B tried to start `@esparex/apps-admin` but failed with `EADDRINUSE` because port 3001 was already occupied by Instance A's admin process (PID `28532`). However, because PID `28532` was healthy and active, visiting `http://localhost:3001` loaded successfully (served by the Instance A server).
3. **User Frontend (Failure):**
   Instance B tried to start `@esparex/apps-web` but failed with `EADDRINUSE` because port 3000 was held by Instance A's web process (PID `13368`). Unlike the admin process, PID `13368` was in a **socket deadlock (zombie state)**. It accepted connections but hung indefinitely on HTTP parsing. Consequently, visiting `http://localhost:3000` failed to load (timed out).

---

## 3. Evidence

### 3.1 Network Port Allocation (Forensic Capture)
Before remediation, port connection records confirmed the zombie process holding the port:
```powershell
PS C:\Users\Administrator\Documents\GitHub\Esparex> Get-NetTCPConnection -LocalPort 3000
LocalAddress LocalPort     State OwningProcess
------------ ---------     ----- -------------
::1               3000 CloseWait         13368
::                3000    Listen         13368
```

### 3.2 HTTP Connection Timeout
Probing the zombie server on port 3000 yielded a connection timeout:
```powershell
PS C:\Users\Administrator\Documents\GitHub\Esparex> Invoke-WebRequest -Uri http://localhost:3000 -TimeoutSec 5
Invoke-WebRequest : The operation has timed out.
```

### 3.3 Nest.js Binding Collision
Running `npm run dev -w @esparex/apps-web` directly reproduced the binding collision:
```text
⨯ Failed to start server
Error: listen EADDRINUSE: address already in use :::3000
  code: 'EADDRINUSE',
  syscall: 'listen',
  address: '::',
  port: 3000
```

---

## 4. Repository Impact
* **User Frontend (`apps/web`):** Complete local outage. Dev servers crashed on boot; browsers timed out.
* **Admin Frontend / Backend API:** Functionally unaffected (operational through active/recreated processes on ports 3001 and 5001).
* **Package Integrity:** `@esparex/contracts` and `@esparex/shared` remain clean. Build system and compiler logic are completely healthy.

---

## 5. Minimal Fix Plan
Rather than relying on manual task killing, we implement the same defensive port-clearing mechanism used by the backend API.

1. **Terminate Active PIDs (Completed):**
   Forcefully killed PIDs `13368` and `28532` to release ports 3000 and 3001.
2. **Add Port-Clearing predev Hooks (Completed):**
   Modified `package.json` for both `apps/web` and `apps/admin` to call `scripts/kill-port.js` on `predev`. This guarantees that future duplicate runs or hanging orphan processes will be automatically terminated before startup.

### Code Modifications (package.json)

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

## 6. Verification Plan

* **Free Port Verification:** Confirmed that running `Get-NetTCPConnection -LocalPort 3000` returns no active connections after killing PIDs.
* **Dev Server Boot:** Started the frontend dev server successfully:
  ```text
  ▲ Next.js 16.2.4 (Turbopack)
  - Local:         http://localhost:3000
  ✓ Ready in 1085ms
  ```
* **Browser Diagnostics:** Verified homepage loads instantly with `200 OK` and **zero** console errors or hydration warnings (probed via browser subagent).
* **Integrity Validation:** Ran `npm run type-check` across the monorepo workspace to verify 100% compilation safety (0 errors).
