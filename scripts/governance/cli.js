const { validateSchema } = require('./validate-schema');
const { validateReferences } = require('./validate-references');
const { validateDag } = require('./validate-dag');
const { generateLedger } = require('./build-ledger');
const { buildManifest } = require('./build-manifest');
const fs = require('fs');
const path = require('path');

const command = process.argv[2];

switch (command) {
  case 'validate':
    validateSchema();
    validateReferences();
    validateDag();
    break;
  case 'generate':
    validateSchema();
    validateReferences();
    validateDag();
    generateLedger();
    buildManifest();
    break;
  case 'check':
    validateSchema();
    validateReferences();
    validateDag();
    
    // Read current
    const current = fs.readFileSync(path.join(process.cwd(), 'governance', 'IMPLEMENTATION_PROGRESS.md'), 'utf-8');
    const generated = generateLedger(false);
    if (current !== generated) {
      console.error('Governance ledger is out of sync. Please run `npm run governance:generate` and commit the result.');
      process.exit(1);
    }
    console.log('Governance ledger snapshot check passed.');
    break;
  case 'graph':
    console.log('DAG visualization not yet implemented.');
    break;
  default:
    console.error('Unknown command:', command);
    process.exit(1);
}
