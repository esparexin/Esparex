const fs = require('fs');
const path = require('path');

function replaceStr(filePath, findStr, replaceStr) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.split(findStr).join(replaceStr);
    fs.writeFileSync(filePath, content);
}

const testDir = path.join(__dirname, 'core/src/__tests__/services');

// 1. PaymentProcessingService.spec.ts
const pps = path.join(testDir, 'PaymentProcessingService.spec.ts');

replaceStr(pps, '@esparex/core/services/wallet/WalletService', '@esparex/core/domains/payments/application/WalletService');
replaceStr(pps, '../../services/wallet/WalletService', '../../domains/payments/application/WalletService');

replaceStr(pps, '@esparex/core/services/RevenueAnalytics', '@esparex/core/domains/payments/application/RevenueAnalytics');
replaceStr(pps, '../../services/RevenueAnalytics', '../../domains/payments/application/RevenueAnalytics');

replaceStr(pps, '@esparex/core/services/PaymentProcessingService', '@esparex/core/domains/payments/application/PaymentProcessingService');
replaceStr(pps, '../../services/PaymentProcessingService', '../../domains/payments/application/PaymentProcessingService');

// 2. PlanService.spec.ts
const ps = path.join(testDir, 'PlanService.spec.ts');

replaceStr(ps, '@esparex/core/services/PlanEngine', '@esparex/core/domains/payments/domain/policies/PlanEngine');
replaceStr(ps, '../../services/PlanEngine', '../../domains/payments/domain/policies/PlanEngine');

replaceStr(ps, '@esparex/core/services/PlanService', '@esparex/core/domains/payments/application/PlanService');
replaceStr(ps, '../../services/PlanService', '../../domains/payments/application/PlanService');

// 3. WalletQueryService.spec.ts
const wqs = path.join(testDir, 'WalletQueryService.spec.ts');

replaceStr(wqs, '@esparex/core/services/wallet/WalletService', '@esparex/core/domains/payments/application/WalletService');
replaceStr(wqs, '../../services/wallet/WalletService', '../../domains/payments/application/WalletService');

replaceStr(wqs, '@esparex/core/services/wallet/WalletQueryService', '@esparex/core/domains/payments/application/WalletQueryService');
replaceStr(wqs, '../../services/wallet/WalletQueryService', '../../domains/payments/application/WalletQueryService');

// 4. PlanEngine.spec.ts
const pe = path.join(testDir, 'PlanEngine.spec.ts');

replaceStr(pe, '@esparex/core/services/PlanEngine', '@esparex/core/domains/payments/domain/policies/PlanEngine');
replaceStr(pe, '../../services/PlanEngine', '../../domains/payments/domain/policies/PlanEngine');

