const Ajv = require('ajv');
const fs = require('fs');
const path = require('path');
const { loadAllEvidence, loadAllWaivers, loadAllPhases, loadAllCommits } = require('./load-evidence');

const GOVERNANCE_DIR = path.join(process.cwd(), 'governance');

function loadSchema(name) {
  return JSON.parse(fs.readFileSync(path.join(GOVERNANCE_DIR, 'schema', `${name}.schema.json`), 'utf-8'));
}

const addFormats = require('ajv-formats');

function validateSchema() {
  const ajv = new Ajv({ allErrors: true });
  addFormats(ajv);
  
  const validators = {
    evidence: ajv.compile(loadSchema('evidence')),
    waiver: ajv.compile(loadSchema('waiver')),
    phase: ajv.compile(loadSchema('phase')),
    commit: ajv.compile(loadSchema('commit'))
  };

  let hasErrors = false;

  function validateItems(items, validatorName) {
    const validator = validators[validatorName];
    items.forEach(item => {
      const valid = validator(item);
      if (!valid) {
        console.error(`Validation failed for ${validatorName} ${item.id}:`);
        console.error(validator.errors);
        hasErrors = true;
      }
    });
  }

  validateItems(loadAllEvidence(), 'evidence');
  validateItems(loadAllWaivers(), 'waiver');
  validateItems(loadAllPhases(), 'phase');
  validateItems(loadAllCommits(), 'commit');

  if (hasErrors) {
    console.error('Governance schema validation failed.');
    process.exit(1);
  }
  
  console.log('Governance schema validation passed.');
}

if (require.main === module) {
  validateSchema();
}

module.exports = { validateSchema };
