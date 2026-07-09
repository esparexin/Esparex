# Environment Bootstrap Guide

This document dictates exactly how a new developer (or deployment system) must configure the environment to successfully run the Esparex monorepo.

## 1. Local Developer Onboarding

When a new developer clones the repository, they must bootstrap three environments without relying on undocumented "tribal knowledge".

### A. Core / Backend Setup
1. Navigate to the user backend:
   ```bash
   cd backend/user
   ```
2. Copy the template:
   ```bash
   cp .env.example .env
   ```
3. Generate a secure `JWT_SECRET` (if running locally, the default in `.env.example` is acceptable for development).
4. Start a local MongoDB and Redis instance (or use Docker).
5. The backend will validate via Zod upon starting (`npm run dev`).

### B. User Frontend Setup (Vercel Client)
1. Navigate to the web frontend:
   ```bash
   cd apps/web
   ```
2. Copy the template:
   ```bash
   cp .env.local.example .env.local
   ```
3. *Note:* The template automatically configures `NEXT_PUBLIC_API_URL=http://localhost:5001/api/v1` to point to the local backend.
4. Run `npm run dev`.

### C. Admin Frontend Setup (Vercel Client)
1. Navigate to the admin frontend:
   ```bash
   cd apps/admin
   ```
2. Copy the template:
   ```bash
   cp .env.local.example .env.local
   ```
3. *Note:* The template points to the local backend Admin APIs.
4. Run `npm run dev`.
