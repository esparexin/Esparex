const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, findReg, replaceStr) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(findReg, replaceStr);
    fs.writeFileSync(filePath, content);
}

const dir = path.join(__dirname, 'core/src/domains/payments/__tests__/application');

// Fix PlanEngine import in PlanService.spec.ts
replaceInFile(path.join(dir, 'PlanService.spec.ts'), /from '\.\.\/\.\.\/application\/PlanEngine'/g, "from '../../domain/policies/PlanEngine'");
replaceInFile(path.join(dir, 'PlanService.spec.ts'), /jest\.mock\('\.\.\/\.\.\/application\/PlanEngine'\)/g, "jest.mock('../../domain/policies/PlanEngine')");

// Fix AdSlotService import in WalletQueryService.spec.ts
replaceInFile(path.join(dir, 'WalletQueryService.spec.ts'), /from '\.\.\/\.\.\/application\/AdSlotService'/g, "from '../../../../../services/AdSlotService'");
replaceInFile(path.join(dir, 'WalletQueryService.spec.ts'), /jest\.mock\('\.\.\/\.\.\/application\/AdSlotService'\)/g, "jest.mock('../../../../../services/AdSlotService')");

// Fix AdSlotService in PlanService.spec.ts
replaceInFile(path.join(dir, 'PlanService.spec.ts'), /from '\.\.\/\.\.\/application\/AdSlotService'/g, "from '../../../../../services/AdSlotService'");
replaceInFile(path.join(dir, 'PlanService.spec.ts'), /jest\.mock\('\.\.\/\.\.\/application\/AdSlotService'\)/g, "jest.mock('../../../../../services/AdSlotService')");

// GatewayService in PaymentProcessingService.spec.ts
replaceInFile(path.join(dir, 'PaymentProcessingService.spec.ts'), /from '\.\.\/\.\.\/application\/GatewayService'/g, "from '../../../../../services/GatewayService'");
replaceInFile(path.join(dir, 'PaymentProcessingService.spec.ts'), /jest\.mock\('\.\.\/\.\.\/application\/GatewayService'\)/g, "jest.mock('../../../../../services/GatewayService')");
