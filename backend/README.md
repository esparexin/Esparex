# Esparex Backend

**Purpose**: Express.js REST API server providing authentication, data management, and business logic for the Esparex marketplace platform.

**Stack**: Node.js + Express.js + TypeScript + MongoDB (Mongoose) + Redis

---

## 🏗️ Architecture Overview

This backend follows a **layered MVC architecture** with clear separation of concerns:

```
Routes → Controllers → Services → Models → Database
```

**Critical Rule**: Each layer has a specific purpose. **DO NOT** bypass layers or mix responsibilities.

---

## 📁 Folder Structure & Governance

### `/src/config/`
**Purpose**: Application configuration and initialization

**Files**:
- `db.ts` - MongoDB connection setup
- `loadEnv.ts` - Environment variable loading and validation
- `swagger.ts` - API documentation configuration

**Rules**:
- ✅ **ALLOWED**: Add new config files for external services
- ❌ **FORBIDDEN**: Business logic, data models, HTTP handlers
- 🔒 **DO NOT DELETE**: Core config files are required for startup

---

### `/src/controllers/`
**Purpose**: HTTP request/response handling ONLY

**Responsibilities**:
- Parse request parameters
- Call service layer methods
- Return HTTP responses
- Handle HTTP-specific errors

**Rules**:
- ✅ **ALLOWED**: Request validation, response formatting
- ❌ **FORBIDDEN**: Business logic, direct database access, complex calculations
- 🔒 **DO NOT MOVE**: Controllers must stay in this folder
- ⚠️ **PATTERN**: Always delegate to services, never access models directly

**Example Structure**:
```typescript
// ✅ CORRECT
export const getAd = async (req, res) => {
  const ad = await adService.getAdById(req.params.id);
  res.json(ad);
};

// ❌ WRONG - Business logic in controller
export const getAd = async (req, res) => {
  const ad = await Ad.findById(req.params.id);
  if (ad.status === 'pending') { /* complex logic */ }
  res.json(ad);
};
```

---

### `/src/services/`
**Purpose**: Business logic and data orchestration

**Responsibilities**:
- Implement business rules
- Coordinate multiple models
- Handle complex data transformations
- Manage transactions

**Rules**:
- ✅ **ALLOWED**: Complex logic, model interactions, data validation
- ❌ **FORBIDDEN**: HTTP handling, direct request/response access
- 🔒 **DO NOT MOVE**: Services are the core business logic layer
- ⚠️ **PATTERN**: Services call models, controllers call services

**Example Structure**:
```typescript
// ✅ CORRECT - Business logic in service
export const createAdWithValidation = async (adData) => {
  // Validate business rules
  if (adData.price < 0) throw new Error('Invalid price');
  
  // Coordinate multiple models
  const category = await Category.findById(adData.categoryId);
  const ad = await Ad.create({ ...adData, categoryName: category.name });
  
  // Trigger side effects
  await notificationService.notifyAdCreated(ad);
  
  return ad;
};
```

---

### `/src/models/`
**Purpose**: Mongoose schemas and database models

**Responsibilities**:
- Define data structure
- Database validation
- Indexes and constraints
- Simple instance methods

**Rules**:
- ✅ **ALLOWED**: Schema definitions, validators, indexes, simple getters
- ❌ **FORBIDDEN**: Business logic, HTTP handling, complex calculations
- 🔒 **DO NOT DELETE**: Models are the single source of truth for data structure
- ⚠️ **PATTERN**: Models are passive data structures, services contain logic

**Example Structure**:
```typescript
// ✅ CORRECT - Schema definition only
const adSchema = new Schema({
  title: { type: String, required: true, minlength: 10 },
  price: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['pending', 'approved', 'rejected'] }
});

// Simple instance method (allowed)
adSchema.methods.isApproved = function() {
  return this.status === 'approved';
};
```

---

### `/src/routes/`
**Purpose**: API endpoint definitions and routing

**Responsibilities**:
- Define URL patterns
- Map routes to controllers
- Apply middleware (auth, validation, rate limiting)

**Rules**:
- ✅ **ALLOWED**: Route definitions, middleware application
- ❌ **FORBIDDEN**: Business logic, data access, request handling
- 🔒 **DO NOT MOVE**: Routes define the public API contract
- ⚠️ **PATTERN**: Routes → Middleware → Controllers

**Example Structure**:
```typescript
// ✅ CORRECT
router.post('/ads', 
  authMiddleware,
  rateLimiter,
  adController.createAd
);

// ❌ WRONG - Logic in routes
router.post('/ads', async (req, res) => {
  const ad = await Ad.create(req.body);
  res.json(ad);
});
```

---

### `/src/middleware/`
**Purpose**: Request processing pipeline

**Files**:
- `authMiddleware.ts` - JWT authentication
- `rateLimiter.ts` - Rate limiting (Redis-backed)
- `hybridRateLimit.ts` - Advanced rate limiting
- `rateLimitMetrics.ts` - Rate limit monitoring

**Rules**:
- ✅ **ALLOWED**: Request validation, authentication, rate limiting
- ❌ **FORBIDDEN**: Business logic, data manipulation
- 🔒 **DO NOT DELETE**: Security middleware is critical
- ⚠️ **PATTERN**: Middleware modifies req/res or calls next()

---

### `/src/utils/`
**Purpose**: Shared utility functions

**Files**:
- `auth.ts` - JWT token utilities
- `cache.ts` - Caching helpers
- `redisCache.ts` - Redis cache wrapper
- `s3.ts` - AWS S3 file upload
- `adminLogger.ts` - Logging utilities
- `codeValidator.ts` - Code quality checks
- `safeCodeRemover.ts` - Safe code removal utilities

**Rules**:
- ✅ **ALLOWED**: Pure functions, helpers, formatters
- ❌ **FORBIDDEN**: Business logic, database access
- 🔒 **DO NOT MOVE**: Utilities are shared across layers
- ⚠️ **PATTERN**: Utils should be stateless and reusable

---

### `/src/validators/`
**Purpose**: Request validation schemas

**Rules**:
- ✅ **ALLOWED**: Input validation, schema definitions
- ❌ **FORBIDDEN**: Business logic, data transformation
- 🔒 **DO NOT DELETE**: Validation prevents invalid data

---

### `/src/lib/`
**Purpose**: External service integrations

**Files**:
- `redis.ts` - Redis client initialization

**Rules**:
- ✅ **ALLOWED**: Third-party service clients
- ❌ **FORBIDDEN**: Business logic
- 🔒 **DO NOT MOVE**: Library integrations are isolated here

---

### `/src/jobs/`
**Purpose**: Background jobs and scheduled tasks

**Files**:
- `predictiveCacheWarmup.ts` - Cache warming job

**Rules**:
- ✅ **ALLOWED**: Cron jobs, background tasks
- ❌ **FORBIDDEN**: HTTP handling
- 🔒 **DO NOT DELETE**: Jobs maintain system performance

---

### `/src/types/`
**Purpose**: TypeScript type definitions

**Rules**:
- ✅ **ALLOWED**: Type definitions, interfaces
- ❌ **FORBIDDEN**: Runtime code
- 🔒 **DO NOT MOVE**: Types ensure type safety

---

### `/src/scripts/`
**Purpose**: One-time data migration and utility scripts

**Rules**:
- ✅ **ALLOWED**: Data migrations, imports, admin utilities
- ❌ **FORBIDDEN**: Production runtime code
- ⚠️ **WARNING**: Scripts are NOT part of the application runtime
- 🔒 **DO NOT DELETE**: Scripts may be needed for data recovery

---

### `/scripts/` (root level)
**Purpose**: Build and deployment scripts

**Rules**:
- ✅ **ALLOWED**: Build automation, deployment helpers
- ❌ **FORBIDDEN**: Application logic
- 🔒 **DO NOT DELETE**: Required for CI/CD

---

### `/reports/`
**Purpose**: Generated reports and logs

**Rules**:
- ✅ **ALLOWED**: Output files, generated reports
- ⚠️ **GITIGNORED**: Should not be committed
- 🔒 **DO NOT DELETE FOLDER**: May be needed by reporting tools

---

## 🚨 CRITICAL GOVERNANCE RULES

### DO NOT MOVE
- ❌ Controllers out of `/src/controllers/`
- ❌ Services out of `/src/services/`
- ❌ Models out of `/src/models/`
- ❌ Routes out of `/src/routes/`

**Reason**: Breaking the folder structure breaks imports and violates architectural patterns.

---

### DO NOT DELETE
- ❌ Any model file (data structure dependency)
- ❌ Core middleware (security risk)
- ❌ Config files (application won't start)
- ❌ `/src/index.ts` (application entry point)

**Reason**: These are critical to application functionality.

---

### DO NOT BYPASS LAYERS
- ❌ Controllers calling models directly
- ❌ Routes containing business logic
- ❌ Models containing HTTP handling

**Reason**: Layer separation ensures maintainability and testability.

---

## 📋 Layer Responsibilities Summary

| Layer | Allowed | Forbidden |
|-------|---------|-----------|
| **Routes** | URL patterns, middleware | Business logic, data access |
| **Controllers** | Request/response handling | Business logic, direct DB access |
| **Services** | Business logic, orchestration | HTTP handling, direct req/res |
| **Models** | Data structure, validation | Business logic, HTTP handling |
| **Middleware** | Request processing | Business logic, data manipulation |
| **Utils** | Pure functions, helpers | Business logic, state management |

---

## 🔐 Security & Environment

### Environment Variables
**Location**: `.env` and `.env.local`

**Critical Variables**:
- `MONGODB_URI` - Database connection
- `JWT_SECRET` - Authentication secret
- `REDIS_URL` - Cache connection
- `AWS_*` - S3 credentials
- `AI_REQUEST_TIMEOUT_MS` - Upstream AI provider timeout in milliseconds (default `12000`)
- `AI_MAX_IMAGE_BYTES` - Maximum decoded base64 image bytes accepted by AI endpoints (default `4194304`, 4MB)

**Rules**:
- ✅ **GITIGNORED**: `.env*` files must NEVER be committed
- ❌ **DO NOT** hardcode secrets in code
- ⚠️ **VERIFY**: All secrets are in environment variables

### Local Auth Testing Mode (Development Only)
Use this only for local QA when OTP throttling/lock blocks repeated test cycles.

```bash
# backend/.env (local only)
AUTH_LOCAL_RELAXED=true
AUTH_BYPASS_OTP_LOCK=true
ALLOW_DEFAULT_ADMIN_SEED=true
```

**What each flag does**:
- `AUTH_LOCAL_RELAXED=true`: skips OTP send/verify rate limiters in non-production.
- `AUTH_BYPASS_OTP_LOCK=true`: disables OTP `lockUntil` enforcement and lock creation in non-production.
- `ALLOW_DEFAULT_ADMIN_SEED=true`: allows local-only bootstrap of the default admin account.

**Safety rules**:
- ❌ Never enable these flags in production or CI.
- ✅ Flags are ignored unless `NODE_ENV=development` and `CI != true`.

**Quick local run (without editing `.env`)**:
```bash
cd backend
NODE_ENV=development AUTH_LOCAL_RELAXED=true AUTH_BYPASS_OTP_LOCK=true npm run dev
```

---

## 🧪 Development Workflow

### Daily Task Flow (Local + Git)
Use this flow for every task to keep branches and quality gates clean.

```bash
# 1) Start from latest develop
git checkout develop
git pull --rebase origin develop
git checkout -b fix/<short-name>   # or feature/<short-name> / refactor/<short-name> / hotfix/<short-name>

# 2) Make changes, then run quality gates
npm --workspace backend run lint
npm --workspace backend run typecheck
npm --workspace backend run build
npm --workspace backend test -- --runInBand --passWithNoTests

npm --workspace frontend run lint
npm --workspace frontend run typecheck
npm --workspace frontend run build
npm --workspace frontend test -- --run --passWithNoTests

# 3) Commit and push
git add .
git commit -m "fix: <clear message>"
git push -u origin fix/<short-name>
```

### Starting the Server
```bash
npm run dev      # Development with hot reload
npm run build    # Compile TypeScript
npm start        # Production mode
```

### Running Scripts
```bash
npx ts-node --files src/scripts/scriptName.ts
```

**Warning**: Scripts are NOT part of the application. Run manually only.

### Business Uniqueness Migration Runbook
Use this runbook for migration `20260222153000-enforce-business-unique-constraints.js`.

Scope:
- Enforces one active business per user (`userId`)
- Enforces unique active `gstNumber`
- Enforces unique active `registrationNumber`
- Ignores soft-deleted records (`isDeleted: true`)

Execution order:
```bash
cd backend
npm run migrate:status
npm run migrate:up
```

Preflight and conflict handling:
- The migration scans active business records and writes an audit report to `business_unique_index_audit`.
- If duplicates are detected, migration stops and throws with a summary.
- Resolve conflicts first (merge/soft-delete invalid duplicates), then rerun `npm run migrate:up`.

Verification after success:
```bash
cd backend
npm run migrate:status
```

Expected business index names:
- `business_user_unique_active`
- `business_gst_unique_active_ci`
- `business_registration_unique_active_ci`

Rollback:
```bash
cd backend
npm run migrate:down
```

Rollback behavior:
- Drops strict unique indexes above
- Restores non-unique fallback indexes (`userId_1`, `gstNumber_1`, `registrationNumber_1`)
- Removes this migration's audit report entry

---

## 📚 Additional Documentation

- **API Documentation**: See Swagger at `/api-docs` when server is running
- **Rate Limiting**: See `rate-limits.md` in root
- **Security**: See `SECURITY_ARCHITECTURE.md` in root
- **Database**: See `ATLAS_SEARCH_INDEX_SETUP.md`

---

## ⚠️ Common Mistakes to Avoid

1. ❌ **Putting business logic in controllers**
   - ✅ Move to services

2. ❌ **Accessing models directly from controllers**
   - ✅ Use service layer

3. ❌ **Adding HTTP handling to services**
   - ✅ Keep services framework-agnostic

4. ❌ **Mixing data validation with business logic**
   - ✅ Validation in validators, logic in services

5. ❌ **Creating circular dependencies**
   - ✅ Follow the layer hierarchy

---

**Remember**: This structure exists to maintain code quality, testability, and scalability. Respect the layers.
