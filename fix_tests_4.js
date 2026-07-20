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

const pps = path.join(appTestDir, 'PaymentProcessingService.spec.ts');
replaceStr(pps, 'import User from "../../../../../models/User";', 'import User from "../../../../models/User";');
replaceStr(pps, 'import { Invoice } from "../../../../../models/Invoice";', 'import { Invoice } from "../../../../models/Invoice";');
replaceStr(pps, 'import { Transaction } from "../../../../../models/Transaction";', 'import { Transaction } from "../../../../models/Transaction";');
replaceStr(pps, 'jest.mock("../../../../../services/GatewayService");', 'jest.mock("../../../../services/GatewayService");');
replaceStr(pps, 'from "../../../../../services/GatewayService"', 'from "../../../../services/GatewayService"');
replaceStr(pps, 'from "../../../../../utils/logger"', 'from "../../../../utils/logger"');
replaceStr(pps, 'jest.mock("../../../../../utils/logger"', 'jest.mock("../../../../utils/logger"');


const ps = path.join(appTestDir, 'PlanService.spec.ts');
replaceStr(ps, "import Ad from '../../../../../models/Ad';", "import Ad from '../../../../models/Ad';");
replaceStr(ps, "from '../../../../../models/UserPlan'", "from '../../../../models/UserPlan'");
replaceStr(ps, "from '../../../../../models/Plan'", "from '../../../../models/Plan'");
replaceStr(ps, "from '../../../../../models/UserWallet'", "from '../../../../models/UserWallet'");
replaceStr(ps, "jest.mock('../../../../../models/UserWallet'", "jest.mock('../../../../models/UserWallet'");
replaceStr(ps, "from '../../../../../services/AdSlotService'", "from '../../../../services/AdSlotService'");
replaceStr(ps, "jest.mock('../../../../../services/AdSlotService')", "jest.mock('../../../../services/AdSlotService')");


const wqs = path.join(appTestDir, 'WalletQueryService.spec.ts');
replaceStr(wqs, "from '../../../../../services/AdSlotService'", "from '../../../../services/AdSlotService'");
replaceStr(wqs, "jest.mock('../../../../../services/AdSlotService')", "jest.mock('../../../../services/AdSlotService')");

const pe = path.join(policyTestDir, 'PlanEngine.spec.ts');
replaceStr(pe, 'import { calculateUserPlan } from "../../domain/policies/PlanEngine";', 'import { calculateUserPlan } from "../../../domain/policies/PlanEngine";');
replaceStr(pe, 'from "../../../../../../utils', 'from "../../../../../utils');
replaceStr(pe, 'from "../../../../../../models', 'from "../../../../../models');

