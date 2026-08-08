# Esparex v1.0.0 Beta Deployment Guide

**Target Release**: `v1.0.0-beta`  

---

## Pre-Deployment Verification

- [x] Run `npm run guard:buildgraph` (Pass, Exit 0)
- [x] Run `npm run type-check` (Pass, Exit 0)
- [x] Run `npm run build` (Pass, Exit 0)
- [x] Run `npm test` (848 tests pass)
- [x] Run `npx expo export` iOS & Android

---

## Deployment Steps

1. **Build Container Images**:
   ```bash
   docker build -t esparex/backend-api:v1.0.0-beta -f backend/api/Dockerfile .
   docker build -t esparex/web-app:v1.0.0-beta -f apps/web/Dockerfile .
   ```
2. **Execute Database Migrations**:
   ```bash
   npm run db:migrate -w @esparex/backend-api
   ```
3. **Deploy Container Tasks**: Update ECS task definition / Kubernetes deployment manifests with image tag `v1.0.0-beta`.
4. **Post-Deployment Verification**:
   ```bash
   curl -f https://api.esparex.in/health/liveness
   curl -f https://api.esparex.in/health/readiness
   ```
