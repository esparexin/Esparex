const fs = require('fs');
const path = require('path');

const GOVERNANCE_DIR = path.join(process.cwd(), 'governance');

function loadJsonFiles(dir) {
  const dirPath = path.join(GOVERNANCE_DIR, dir);
  if (!fs.existsSync(dirPath)) return [];
  const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.json'));
  return files.map(file => {
    const content = fs.readFileSync(path.join(dirPath, file), 'utf-8');
    return JSON.parse(content);
  });
}

function loadAllEvidence() {
  return loadJsonFiles('evidence');
}

function loadAllWaivers() {
  return loadJsonFiles('waivers');
}

function loadAllPhases() {
  return loadJsonFiles('phases');
}

function loadAllCommits() {
  return loadJsonFiles('commits');
}

module.exports = {
  loadAllEvidence,
  loadAllWaivers,
  loadAllPhases,
  loadAllCommits
};
