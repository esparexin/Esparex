#!/bin/bash

# Esparex Cleanup Script - Phase 1 Quick Wins
# Run this script to perform immediate cleanup tasks
# Estimated time: 15 minutes

set -e  # Exit on error

if [[ "${ALLOW_MANUAL_SCRIPT:-false}" != "true" ]]; then
    echo "Blocked: set ALLOW_MANUAL_SCRIPT=true to run scripts/manual-only/cleanup-phase1.sh"
    exit 1
fi

echo "🧹 Esparex Cleanup Script - Phase 1"
echo "===================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Confirm before proceeding
echo "This script will:"
echo "  1. Delete legacy test files (backend/tests/)"
echo "  2. Delete temporary files (duplicates_report.txt)"
echo "  3. Update .gitignore"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    print_warning "Cleanup cancelled"
    exit 1
fi

echo ""
echo "Starting cleanup..."
echo ""

# 1. Delete legacy backend test files
if [ -d "backend/tests" ]; then
    echo "📁 Removing legacy backend test files..."
    rm -rf backend/tests/
    print_success "Deleted backend/tests/"
else
    print_warning "backend/tests/ not found (already deleted?)"
fi

# 2. Delete temporary files
if [ -f "duplicates_report.txt" ]; then
    echo "📄 Removing temporary files..."
    rm duplicates_report.txt
    print_success "Deleted duplicates_report.txt"
else
    print_warning "duplicates_report.txt not found (already deleted?)"
fi

# 3. Update .gitignore
echo "📝 Updating .gitignore..."
if ! grep -q "duplicates_report.txt" .gitignore 2>/dev/null; then
    echo "" >> .gitignore
    echo "# Temporary audit files" >> .gitignore
    echo "duplicates_report.txt" >> .gitignore
    echo "*_report.txt" >> .gitignore
    print_success "Updated .gitignore"
else
    print_warning ".gitignore already contains duplicates_report.txt"
fi

# 4. Summary
echo ""
echo "=================================="
echo "✨ Cleanup Complete!"
echo "=================================="
echo ""
echo "Summary:"
echo "  - Removed legacy test files"
echo "  - Removed temporary files"
echo "  - Updated .gitignore"
echo ""
echo "Next steps:"
echo "  1. Review changes: git status"
echo "  2. Run tests: cd backend && npm test"
echo "  3. Commit changes: git add . && git commit -m 'chore: cleanup legacy files'"
echo ""
echo "For more cleanup tasks, see: docs/CLEANUP_OPTIMIZATION_AUDIT.md"
echo ""
