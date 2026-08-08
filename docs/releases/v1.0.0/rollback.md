# Esparex v1.0.0 Beta Rollback Procedure

**Target Milestone**: `v1.0.0-beta`  

---

## Rollback Triggers

1. Error rate spikes above 1.0% on core API endpoints (`/listings`, `/auth`).
2. Express `/health/liveness` or `/health/readiness` fails persistently for > 2 minutes.
3. Database migration failures or unhandled mutation concurrency exceptions.

---

## Step-by-Step Rollback Plan

1. **Traffic Redirection**: Switch load balancer router to previous stable release target container tag.
2. **Database State Verification**: Run down-migration scripts if schema DTOs were altered.
3. **Cache Flush**: Issue Redis `FLUSHDB` or targeted key eviction for affected DTO cache patterns.
4. **Post-Rollback Verification**: Execute `/health/readiness` probe checks to confirm service stability.
