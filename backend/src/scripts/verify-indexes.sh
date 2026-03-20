#!/bin/bash
# backend/src/scripts/verify-indexes.sh

echo "🔍 Running MongoDB Index Governance Audit..."

cd backend
npx ts-node src/scripts/indexAudit.ts

if [ $? -eq 0 ]; then
  echo "✅ Index Governance Audit Passed!"
  exit 0
else
  echo "❌ Index Governance Audit Failed! Property-level index flags detected."
  echo "Please use Schema.index({ field: 1 }, { name: 'explicit_name_idx' }) instead."
  exit 1
fi
