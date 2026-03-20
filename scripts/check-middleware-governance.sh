#!/bin/bash
set -e

echo "🔍 Checking middleware governance..."

# Rule 1: No legacy folder
if [ -d "backend/src/middlewares" ]; then
  echo "❌ Forbidden directory: backend/src/middlewares"
  exit 1
fi

# Rule 2: No global auth / rate limiter / DB guard
# Check for strictly global usage "app.use(middleware)"
if grep -E "app\.use\(authMiddleware\)" backend/src/app.ts; then
  echo "❌ authMiddleware must NOT be global"
  exit 1
fi

if grep -E "app\.use\(globalRateLimiter\)" backend/src/app.ts; then
  echo "❌ globalRateLimiter must be scoped, not global (found 'app.use(globalRateLimiter)')"
  exit 1
fi

if grep -E "app\.use\(requireDb\)" backend/src/app.ts; then
  echo "❌ requireDb must be route-scoped (found 'app.use(requireDb)')"
  exit 1
fi

# Rule 3: No DB models in middleware
if grep -R "models/" backend/src/middleware; then
  echo "❌ DB models imported inside middleware"
  exit 1
fi

# Rule 4: Rate limiter must bypass OPTIONS
if ! grep -R "method === \"OPTIONS\"" backend/src/middleware/rateLimiter.ts; then
  echo "❌ Rate limiter must bypass OPTIONS"
  exit 1
fi

echo "✅ Middleware governance checks passed"
