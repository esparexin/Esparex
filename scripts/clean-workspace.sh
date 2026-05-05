#!/bin/bash

# Esparex Workspace Cleanup Script
# This script removes all build artifacts, logs, and temporary files to ensure a clean state.

echo "🧹 Starting workspace cleanup..."

# 1. Remove build artifacts
echo "📦 Removing dist folders..."
find . -name "dist" -type d -not -path "*/node_modules/*" -exec rm -rf {} +

# 2. Remove log files
echo "📝 Removing log files..."
find . -name "*.log" -type f -exec rm -f {} +
rm -rf logs/
rm -rf backend/user/logs/
rm -rf backend/logs/

# 3. Remove system temporary files
echo "📁 Removing OS temporary files (.DS_Store, etc)..."
find . -name ".DS_Store" -type f -delete

# 4. Optional: Remove node_modules (uncomment if you want a total fresh start)
# echo "📚 Removing node_modules..."
# find . -name "node_modules" -type d -not -path "*/node_modules/*" -exec rm -rf {} +

echo "✅ Cleanup complete! You are ready for a fresh build."
