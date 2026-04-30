#!/bin/bash

# ESPAREX EMERGENCY ROLLBACK SCRIPT
# Reverts the repository to the last known stable architectural tag.

TARGET_TAG="v1.0.0-arch-hardened"

echo "⚠️  EMERGENCY ROLLBACK INITIATED"
echo "Target: $TARGET_TAG"

# 1. Verify tag exists
if ! git rev-parse "$TARGET_TAG" >/dev/null 2>&1; then
    echo "❌ ERROR: Tag $TARGET_TAG not found. Rollback aborted."
    exit 1
fi

# 2. Hard reset
echo "📦 Resetting main branch to $TARGET_TAG..."
git reset --hard "$TARGET_TAG"

# 3. Clean environment
echo "🧹 Cleaning temporary artifacts..."
npm run clean

# 4. Re-install & Re-build
echo "🏗️  Re-building for stability..."
npm ci --legacy-peer-deps && npm run build

echo "✅ ROLLBACK COMPLETE."
echo "Please verify system health and force-push to main if necessary."
