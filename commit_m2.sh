#!/bin/bash

# Ensure we are in the workspace root
cd /Users/admin/Desktop/Esparex

# Unstage everything first to avoid accidental commits
git reset

# Phase 2 - Commit M2.1 Payments Domain Migration

# Commit 1
git add .agents/governance/DDD_CORE_CONSOLIDATION_PLAN.md
git add .gemini/antigravity-ide/brain/*/payments_dependency_inventory.md
git add .gemini/antigravity-ide/brain/*/walkthrough.md
git add .gemini/antigravity-ide/brain/*/task.md
git add .gemini/antigravity-ide/brain/*/arch_v2_verification.md
git add .gemini/antigravity-ide/brain/*/implementation_plan.md
git commit -m "docs(payments): add migration plan and dependency inventory"

# Commit 2
git add core/src/domains/payments/manifest.yaml
git add core/src/domains/payments/index.ts
git commit -m "refactor(payments): establish payments bounded context"

# Commit 3
git add core/src/domains/payments/ports/
git commit -m "refactor(payments): introduce repository and infrastructure ports"

# Commit 4
git add core/src/domains/payments/adapters/
git commit -m "refactor(payments): add Mongo repository adapters"

# Commit 5
git add core/src/domains/payments/application/
git commit -m "refactor(payments): migrate payment application services"

# Commit 6
git add core/src/services/InvoicePdfService.ts
git add core/src/services/InvoiceService.ts
git add core/src/services/PaymentProcessingService.ts
git add core/src/services/PlanEngine.ts
git add core/src/services/PlanService.ts
git add core/src/services/RevenueAnalytics.ts
git add core/src/services/TransactionService.ts
git add core/src/services/wallet/WalletQueryService.ts
git add core/src/services/wallet/WalletService.ts
git commit -m "refactor(payments): add compatibility shims"

# Commit 7
git add core/src/__tests__/services/PaymentProcessingService.spec.ts
git add core/src/__tests__/services/PlanEngine.spec.ts
git add core/src/__tests__/services/PlanService.spec.ts
git add core/src/__tests__/services/WalletQueryService.spec.ts
git commit -m "test(payments): update tests after domain migration"


# Phase 3 - Commit M2.2 Notifications Domain Migration

# Commit 8
git add core/src/domains/notifications/manifest.yaml
git commit -m "docs(notifications): add migration documentation"

# Commit 9
git add core/src/domains/notifications/index.ts
git commit -m "refactor(notifications): establish notifications bounded context"

# Commit 10
git add core/src/domains/notifications/ports/
git commit -m "refactor(notifications): introduce repository and infrastructure ports"

# Commit 11
git add core/src/domains/notifications/adapters/
git commit -m "refactor(notifications): add Mongo repository adapters"

# Commit 12
git add core/src/domains/notifications/application/
git commit -m "refactor(notifications): migrate notification application services"

# Commit 13
git add core/src/services/AdminNotificationService.ts
git add core/src/services/EmailService.ts
git add core/src/services/NotificationService.ts
git add core/src/services/SmartAlertQueryService.ts
git add core/src/services/SmartAlertService.ts
git add core/src/services/notification/
git add core/src/services/smartAlert/
git commit -m "refactor(notifications): add compatibility shims"

# Commit 14
git add core/src/__tests__/services/NotificationService.spec.ts
git add core/src/__tests__/services/SmartAlertMutationService.spec.ts
git commit -m "test(notifications): update tests after domain migration"

# Commit 15
git add -A # add everything else (like scripts we made, any other changes)
git commit -m "docs(architecture): record M2.1 and M2.2 completion"

echo "Done committing!"
