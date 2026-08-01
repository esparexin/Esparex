const { loadAllEvidence, loadAllWaivers, loadAllPhases, loadAllCommits } = require('./load-evidence');

function validateReferences() {
  const evidence = loadAllEvidence();
  const waivers = loadAllWaivers();
  const phases = loadAllPhases();
  const commits = loadAllCommits();

  const evidenceIds = new Set(evidence.map(e => e.id));
  const commitIds = new Set(commits.map(c => c.id));
  let hasErrors = false;

  // 1. Check Phase Commits
  phases.forEach(phase => {
    phase.commits.forEach(commitId => {
      if (!commitIds.has(commitId)) {
        console.error(`Reference Error: Phase '${phase.id}' references missing commit '${commitId}'`);
        hasErrors = true;
      }
    });
  });

  // 2. Check Evidence dependsOn
  evidence.forEach(item => {
    if (item.dependsOn) {
      item.dependsOn.forEach(depId => {
        if (!evidenceIds.has(depId)) {
          console.error(`Reference Error: Evidence '${item.id}' depends on missing evidence '${depId}'`);
          hasErrors = true;
        }
      });
    }
    if (item.supersedes) {
      item.supersedes.forEach(depId => {
        if (!evidenceIds.has(depId)) {
          console.error(`Reference Error: Evidence '${item.id}' supersedes missing evidence '${depId}'`);
          hasErrors = true;
        }
      });
    }
  });

  // 3. Check Waiver affects
  waivers.forEach(waiver => {
    waiver.affects.forEach(affectsId => {
      if (!evidenceIds.has(affectsId)) {
        console.error(`Reference Error: Waiver '${waiver.id}' affects missing evidence '${affectsId}'`);
        hasErrors = true;
      }
    });
  });

  if (hasErrors) {
    console.error('Governance reference validation failed.');
    process.exit(1);
  }

  console.log('Governance reference validation passed.');
}

if (require.main === module) {
  validateReferences();
}

module.exports = { validateReferences };
