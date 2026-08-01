const fs = require('fs');
const path = require('path');
const { loadAllEvidence, loadAllWaivers } = require('./load-evidence');

const GOVERNANCE_DIR = path.join(process.cwd(), 'governance');

function buildManifest() {
  const evidenceList = loadAllEvidence().sort((a, b) => a.id.localeCompare(b.id));
  const waiverList = loadAllWaivers().sort((a, b) => a.id.localeCompare(b.id));

  const manifest = {
    version: "RM-1.0",
    release: "v1.0.0-draft",
    evidence: evidenceList.map(e => e.id),
    waivers: waiverList.map(w => w.id)
  };

  fs.writeFileSync(path.join(GOVERNANCE_DIR, 'release', 'release.manifest.json'), JSON.stringify(manifest, null, 2));
  console.log('Successfully generated release.manifest.json');
}

if (require.main === module) {
  buildManifest();
}

module.exports = { buildManifest };
