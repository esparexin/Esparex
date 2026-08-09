# DevOps Governance Manual (`DEVOPS-GOVERNANCE.md`)

> **Status:** Enforced · **Owner:** SRE/DevOps · Evidence: Vol-2 §28, Vol-4 §40B/§45, Vol-5 §54–56

---

## 1. CI (pipelines)

| Workflow | Purpose |
| --- | --- |
| `ci.yml` | unit tests, lint, guard matrix — **web suite must be added (V2-1 Wave 4)** |
| `codeql.yml` | security static analysis |
| `governance.yml` | governance reports + gate on schedule/PR |
| `release.yml` | RC certification checks |

- One repo gate: `npm run repo:gate` (ENFORCEMENT_HIERARCHY 5‑tier).
- PR CI budget: < 10 min; heavy quality in separate jobs.

## 2. Environments & promotion

| Env | Host | Promotion gate |
| --- | --- | --- |
| Local | docker-less local | — |
| Development | Render/Vercel dev | guard set |
| QA / Staging | Render (single service) | full suite §6 |
| UAT | staged snapshot | UAT sign-off |
| Production | Render `esparex-api` + Vercel (web/admin) | RC card + rollback plan |

Promotion rules per `RELEASE-GOVERNANCE.md` (no-skip, evidence bundle per REV-001).

## 3. Deployment & rollback

| Concern | Standard |
| --- | --- |
| Deploy | Render (backend) automatic on main? — prefers explicit: tagged commit deploy; Vercel for apps |
| Health | `/health` check on Render; app fails over to maintenance page |
| Rollback | **currently none** → Wave 0/5 add: version-pinned deploys + `render.yaml` redeploy revert (R1) |
| Feature flags | deny in prod rollout (flag=false blocks)

## 4. Monitoring & observability

- Logging: Winston JSON → stdout; morgan access.
- Metrics: Prometheus HTTP/queue/custom (`httpTotalRequests`, `httpLatency`, queue gauges, `revenueMetrics`, `reliabilityAlerts`).
- Tracing: **none today (F46)** — Wave 4 adds OTel; correlation via `requestId` + queue `_trace` (already).
- Dashboards: **none committed** — Wave 4 adds Grafana (import-config in repo).
- SLOs: five targets incl. login, checkout, listing create, chat p95, alert delivery — defined with error budgets (Wave 4; F52).

## 5. Infrastructure ownership

- Render starter single web service (scaling: plan bump; autoscale out-of-scope). `render.yaml` is **the** IaC; no Dockerfiles (documented decision).
- Mongo Atlas: connection via env; cluster settings external to repo — quarterly review w/ backend owner.
- Redis: cloud-backed (TLS/rediss); used for cache + BullMQ queues.
- S3 media: preset env (bucket, region); 4 MiB image guard; no retention cron (Wave 3).
- Disaster recovery: **RTO/RPO NOT defined** (Vol-5 §54 FAIL) — Wave 5 defines RTO≤4h/RPO≤1h, restore drilling.

## 6. Scaling

- Queues: concurrency caps (scheduler 1, ad 5, image 2) — memory-guarded.
- API: rate limits; p95 budgets per `baseline-report.md`.
- On-demand growth: plan-based vertical; future: worker service splits.

## 7. Ops ownership (RACI)

| Area | Owner |
| --- | --- |
| CI orchestration | DevOps |
| runbooks (deploy/incident/disk/CPU…) | SRE — 0/10 today → Wave 4 publishes 10 |
| Dashboard/alert tuning | SRE + Perf lead |
| DR drills | SRE + backend (quarterly) |

---

*Owner: SRE; gates: ci.yml green, repo:gate, render health; refs: CONTINUOUS-COMPLIANCE-PIPELINE.md.*