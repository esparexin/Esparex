const fs = require('fs');
const path = require('path');

function replaceStr(filePath, findStr, replaceStr) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.split(findStr).join(replaceStr);
    fs.writeFileSync(filePath, content);
}

const appTestDir = path.join(__dirname, 'core/src/domains/payments/__tests__/application');
const policyTestDir = path.join(__dirname, 'core/src/domains/payments/__tests__/domain/policies');

// PaymentProcessingService.spec.ts
const pps = path.join(appTestDir, 'PaymentProcessingService.spec.ts');
replaceStr(pps, 'import User from "../../models/User";', 'import User from "../../../../../models/User";');
replaceStr(pps, 'import { Invoice } from "../../models/Invoice";', 'import { Invoice } from "../../../../../models/Invoice";');
replaceStr(pps, 'import { Transaction } from "../../models/Transaction";', 'import { Transaction } from "../../../../../models/Transaction";');
replaceStr(pps, 'import { credit } from "../../services/wallet/WalletService";', 'import { credit } from "../../application/WalletService";');
replaceStr(pps, 'import { recordRevenue } from "../../services/RevenueAnalytics";', 'import { recordRevenue } from "../../application/RevenueAnalytics";');
replaceStr(pps, 'import { processSuccessfulPayment, recoverPendingPayment } from "../../services/PaymentProcessingService";', 'import { processSuccessfulPayment, recoverPendingPayment } from "../../application/PaymentProcessingService";');

// PlanService.spec.ts
const ps = path.join(appTestDir, 'PlanService.spec.ts');
replaceStr(ps, 'import Ad from \'../../../../../models/Ad\';', 'import Ad from \'../../../../../models/Ad\';'); // wait, if depth is core/src/domains/payments/__tests__/application, it's 5 up to get to core/src/models?
// Let's count: application(1) -> __tests__(2) -> payments(3) -> domains(4) -> src(5). So 5 up IS CORRECT!
// Why did it fail? "Cannot find module '../../../../../models/Ad'" - maybe it's not in models/Ad?
// Let's check `core/src/models/Ad`. Wait, there is no `models/Ad`. Maybe it's `models/Ad.ts`? Yes. Is it `../../../../../models/Ad`? Yes.
// Ah, earlier it said "Cannot find module '../../../../../models/Ad'" which usually means the file doesn't exist. Let's list `core/src/models/`.

// PlanService.spec.ts imports for PlanEngine
replaceStr(ps, "from '../../application/PlanEngine'", "from '../../domain/policies/PlanEngine'");
replaceStr(ps, "jest.mock('../../application/PlanEngine')", "jest.mock('../../domain/policies/PlanEngine')");

// WalletQueryService.spec.ts
const wqs = path.join(appTestDir, 'WalletQueryService.spec.ts');
replaceStr(wqs, "from '../../application/AdSlotService'", "from '../../../../../services/AdSlotService'");
replaceStr(wqs, "jest.mock('../../application/AdSlotService')", "jest.mock('../../../../../services/AdSlotService')");

// PlanEngine.spec.ts
const pe = path.join(policyTestDir, 'PlanEngine.spec.ts');
replaceStr(pe, 'import { calculateUserPlan } from "../../services/PlanEngine";', 'import { calculateUserPlan } from "../../domain/policies/PlanEngine";');
replaceStr(pe, 'from "../../../../../utils', 'from "../../../../../../utils');
replaceStr(pe, 'from "../../../../../models', 'from "../../../../../../models');

// Extra cleanup for PaymentProcessingService
replaceStr(pps, 'jest.mock("../../services/wallet/WalletService");', 'jest.mock("../../application/WalletService");');
replaceStr(pps, 'jest.mock("../../services/RevenueAnalytics");', 'jest.mock("../../application/RevenueAnalytics");');
replaceStr(pps, 'jest.mock("../../application/GatewayService");', 'jest.mock("../../../../../services/GatewayService");');
replaceStr(pps, 'from "../../application/GatewayService"', 'from "../../../../../services/GatewayService"');
