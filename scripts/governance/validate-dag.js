const { loadAllEvidence } = require('./load-evidence');

function validateDag() {
  const evidence = loadAllEvidence();
  let hasErrors = false;

  const adjList = {};
  const inDegree = {};
  
  evidence.forEach(e => {
    adjList[e.id] = [];
    inDegree[e.id] = 0;
  });

  evidence.forEach(e => {
    if (e.dependsOn) {
      e.dependsOn.forEach(depId => {
        // e depends on depId => directed edge depId -> e
        if (adjList[depId]) {
          adjList[depId].push(e.id);
          inDegree[e.id] = (inDegree[e.id] || 0) + 1;
        }
      });
    }
  });

  // Kahn's algorithm for topological sorting / cycle detection
  const queue = [];
  let visitedCount = 0;

  Object.keys(inDegree).forEach(node => {
    if (inDegree[node] === 0) queue.push(node);
  });

  while (queue.length > 0) {
    const node = queue.shift();
    visitedCount++;
    adjList[node].forEach(neighbor => {
      inDegree[neighbor]--;
      if (inDegree[neighbor] === 0) {
        queue.push(neighbor);
      }
    });
  }

  if (visitedCount !== evidence.length) {
    console.error('DAG Error: A cycle was detected in the evidence dependencies.');
    hasErrors = true;
  }

  // Check for duplicate IDs
  const idCounts = {};
  evidence.forEach(e => {
    idCounts[e.id] = (idCounts[e.id] || 0) + 1;
    if (idCounts[e.id] > 1) {
      console.error(`DAG Error: Duplicate evidence ID '${e.id}'`);
      hasErrors = true;
    }
  });

  if (hasErrors) {
    console.error('Governance DAG validation failed.');
    process.exit(1);
  }

  console.log('Governance DAG validation passed.');
}

if (require.main === module) {
  validateDag();
}

module.exports = { validateDag };
