const fs = require('fs');
const path = require('path');

function replaceStr(filePath, findStr, replaceStr) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.split(findStr).join(replaceStr);
    fs.writeFileSync(filePath, content);
}

const testDir = path.join(__dirname, 'core/src/__tests__/services');

// PlanService.spec.ts
const ps = path.join(testDir, 'PlanService.spec.ts');
// It mocks PlanEngine, AdSlotService, etc.
// The actual implementation PlanService imports:
// `../../../../services/AdSlotService` -> which is `core/src/services/AdSlotService`
// `../domain/policies/PlanEngine` -> which is `core/src/domains/payments/domain/policies/PlanEngine`
// `../../../composition/listings` -> which is `core/src/composition/listings`

// The test mocks `../services/PlanEngine` (shim). It should mock the actual domain file!
replaceStr(ps, "jest.mock('../services/PlanEngine');", "jest.mock('../../domains/payments/domain/policies/PlanEngine');");
replaceStr(ps, "from '../services/PlanEngine'", "from '../../domains/payments/domain/policies/PlanEngine'");

// PaymentProcessingService.spec.ts
const pps = path.join(testDir, 'PaymentProcessingService.spec.ts');
// Implementation imports:
// `../../../../services/GatewayService`
// `./TransactionService` -> which is `core/src/domains/payments/application/TransactionService`
// `./wallet/WalletService` (now `./WalletService`) -> which is `core/src/domains/payments/application/WalletService`
// `../RevenueAnalytics` (now `./RevenueAnalytics`) -> which is `core/src/domains/payments/application/RevenueAnalytics`

replaceStr(pps, "jest.mock('../services/wallet/WalletService');", "jest.mock('../../domains/payments/application/WalletService');");
replaceStr(pps, "from '../services/wallet/WalletService'", "from '../../domains/payments/application/WalletService'");

replaceStr(pps, "jest.mock('../services/RevenueAnalytics');", "jest.mock('../../domains/payments/application/RevenueAnalytics');");
replaceStr(pps, "from '../services/RevenueAnalytics'", "from '../../domains/payments/application/RevenueAnalytics'");

replaceStr(pps, "jest.mock('../services/PaymentProcessingService');", "jest.mock('../../domains/payments/application/PaymentProcessingService');");
replaceStr(pps, "from '../services/PaymentProcessingService'", "from '../../domains/payments/application/PaymentProcessingService'");

// WalletQueryService.spec.ts
const wqs = path.join(testDir, 'WalletQueryService.spec.ts');
replaceStr(wqs, "jest.mock('../services/wallet/WalletService');", "jest.mock('../../domains/payments/application/WalletService');");
replaceStr(wqs, "from '../services/wallet/WalletService'", "from '../../domains/payments/application/WalletService'");

// PlanEngine.spec.ts (doesn't mock much, just imports calculateUserPlan)
const pe = path.join(testDir, 'PlanEngine.spec.ts');
replaceStr(pe, "from '../services/PlanEngine'", "from '../../domains/payments/domain/policies/PlanEngine'");

