# Email Delivery Regression Audit

## 1. Issue Overview
Users experience inconsistent or failing transaction email deliveries, including OTP codes, sign-in magic links, and booking PDFs.

---

## 2. Root Cause & Detailed Investigation

### Lack of Queue Name Isolation across Environments
* **Root Cause**: The queue name used for enqueuing and processing emails (`notification-queue`) is a hardcoded string. The Redis URL (`REDIS_URL`) configured in `.env` is a remote cloud instance:
  `redis://mad:MV_kalyan9@stew-collaborative-macrofresh-13290.db.redis.io:14748`
  Since both development environments (local developer machines) and production/staging instances connect to the **same** Redis database and listen to the **same** queue name without prefixing, they are in direct competition for jobs.
  When a production user triggers an OTP request, the job is pushed to `notification-queue` on the shared Redis. If a developer starts their local server, their local BullMQ worker immediately competes to consume this job.
  If the local worker consumes the job, it attempts to dispatch the email. If the local worker is in a broken state, lacks proper SMTP credentials, or is terminated mid-execution, the email fails to deliver or is completely lost.
* **Evidence**:
  * Shared `REDIS_URL` in `apps/server/.env` (Line 10):
    `REDIS_URL=redis://mad:MV_kalyan9@stew-collaborative-macrofresh-13290.db.redis.io:14748`
  * Hardcoded Queue Name in `apps/server/src/workers/email.worker.ts` (Line 14):
    `const QUEUE_NAME = 'notification-queue';`
  * Hardcoded Queue Enqueue in `apps/server/src/services/public/auth.service.ts` (Line 55):
    `await QueueService.enqueue('notification-queue', 'email-dispatch', { ... })`
  * Hardcoded Queue Name in `apps/server/src/workers/pdf.worker.ts` (Line 43-44):
    ```ts
    await QueueService.enqueue('notification-queue', 'email:dispatch', { ... })
    ```

### SMTP Configuration (ZeptoMail Delivery)
* **Root Cause**: Nodemailer is configured to use SMTP with ZeptoMail (`smtp.zeptomail.in`, port `587`).
  If a local worker consumes a production email job, it will try to make an SMTP connection using the local developer’s machine. Residential ISP networks frequently block outbound traffic on port `587` to prevent spam, causing the SMTP connection to timeout or fail completely.
  Furthermore, any credential mismatch between the local `.env` file and the remote production server will cause SMTP authentication errors (`535 Authentication Failed`) on the consuming worker.
* **Evidence**:
  * SMTP config in `apps/server/.env` (Lines 38-42):
    ```ini
    SMTP_HOST=smtp.zeptomail.in
    SMTP_PORT=587
    SMTP_SECURE=false
    SMTP_USER=emailapikey
    SMTP_PASS=PHtE6r1YE+C/2m959xUJ4KW4Q86kPYx/...
    ```
  * In `apps/server/src/utils/email.ts` (Lines 39-48):
    ```ts
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE ?? env.SMTP_PORT === 465,
      pool: true,
      auth: env.SMTP_USER && env.SMTP_PASS ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
    });
    ```

---

## 3. Affected Files
* **Backend Configurations**:
  * [apps/server/src/services/queue.service.ts](../../apps/server/src/services/queue.service.ts)
  * [apps/server/src/config/queue.config.ts](../../apps/server/src/config/queue.config.ts)
* **Workers**:
  * [apps/server/src/workers/email.worker.ts](../../apps/server/src/workers/email.worker.ts)
  * [apps/server/src/workers/pdf.worker.ts](../../apps/server/src/workers/pdf.worker.ts)
  * [apps/server/src/workers/booking.worker.ts](../../apps/server/src/workers/booking.worker.ts)

---

## 4. Impact & Risk Assessment
* **Impact**: **CRITICAL**. Extremely inconsistent transactional email delivery in production, including critical OTP sign-in notifications. Users are locked out of their accounts because they do not receive the access passcode.
* **Risk Level**: **HIGH** (Severe impact on sign-in, account activation, and ticket delivery).

---

## 5. Recommended Fix & Action Plan
1. **Dynamic Queue Names (Prefixing)**:
   * Introduce a `queuePrefix` configuration based on the environment (e.g., `local:`, `staging:`, `production:`).
   * Update the BullMQ setup in `apps/server/src/config/queue.config.ts` to include a `prefix` option or dynamically interpolate the queue name (e.g., `${env.NODE_ENV}:notification-queue`).
2. **Dedicated Redis Databases/Instances**:
   * Staging and production instances should not share the same Redis instance as local development environments. Setup separate Redis URL instances for development.
3. **Robust Local Fallback (EventEmitter)**:
   * When running in development, if Redis is offline, ensure the local fallback correctly routes all jobs seamlessly to the local memory emitter without attempting remote connections.
