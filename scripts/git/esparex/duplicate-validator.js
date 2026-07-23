#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { Validation, runStandalone, ROOT } = require('../shared');

const META = { id: 'DUP-001', name: 'Duplicate & Dead Code Baseline', version: '2.0.0', category: 'Architecture' };

function run(val) {
  // 1. Orphan file check (using existing orphan sweep logic)
  const SEARCH_DIRS = ['apps', 'backend', 'core', 'shared'];
  const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

  function getAllFiles(dir, allFiles = []) {
    if (!fs.existsSync(dir)) return allFiles;
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const name = path.join(dir, file);
      const stat = fs.statSync(name);
      if (stat.isDirectory()) {
        if (file !== 'node_modules' && file !== 'dist' && file !== 'coverage' && !file.startsWith('.')) {
          getAllFiles(name, allFiles);
        }
      } else {
        if (EXTENSIONS.includes(path.extname(file)) && !file.endsWith('.d.ts')) {
          allFiles.push(name);
        }
      }
    });
    return allFiles;
  }

  const allFiles = SEARCH_DIRS.flatMap(dir => getAllFiles(path.join(ROOT, dir)));
  const fileContents = [];
  allFiles.forEach(file => {
    try {
      fileContents.push({
        relPath: path.relative(ROOT, file),
        content: fs.readFileSync(file, 'utf8')
      });
    } catch { /* ignore */ }
  });

  const metadataFiles = ['package.json', 'package-lock.json', '.eslintcache', '.jscpd-report/jscpd-report.json'];
  metadataFiles.forEach(f => {
    const fullPath = path.join(ROOT, f);
    try {
      if (fs.existsSync(fullPath)) {
        fileContents.push({ relPath: f, content: fs.readFileSync(fullPath, 'utf8') });
      }
    } catch { /* ignore */ }
  });

  const orphans = [];
  allFiles.forEach(file => {
    const fileName = path.basename(file, path.extname(file));
    const relPath = path.relative(ROOT, file);
    const normalizedPath = relPath.replace(/\\/g, '/');
    const isTest = normalizedPath.includes('__tests__') || normalizedPath.endsWith('.spec.ts') || normalizedPath.endsWith('.spec.tsx') || normalizedPath.endsWith('.test.ts') || normalizedPath.endsWith('.test.tsx');
    const isScriptOrConfig = normalizedPath.includes('scripts/') || normalizedPath.includes('seeds/') || normalizedPath.includes('cron/') || normalizedPath.includes('migrations/') || normalizedPath.endsWith('config.ts') || normalizedPath.endsWith('config.js') || normalizedPath.endsWith('config.json');
    
    if (isTest || isScriptOrConfig) return;

    let isReferenced = false;
    for (const entry of fileContents) {
      if (entry.relPath === relPath) continue;
      if (entry.content.includes(fileName)) {
        isReferenced = true;
        break;
      }
    }
    if (!isReferenced) {
      orphans.push(relPath);
    }
  });

  if (orphans.length > 0) {
    for (const orphan of orphans) {
      val.error(`Orphan/dead file detected: ${orphan}`);
    }
  } else {
    val.info('Zero orphan files detected');
  }

  // 2. Automatic Zero-Config Dynamic Baseline & Regression Guard
  const reportPath = path.join(ROOT, '.jscpd-report/jscpd-report.json');
  const baselinePath = path.join(ROOT, '.jscpd-baseline.json');
  let previousBaseline = 0.11;

  if (fs.existsSync(baselinePath)) {
    try {
      const b = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
      previousBaseline = typeof b.baselinePercentage === 'number' ? b.baselinePercentage : 0.11;
    } catch { /* fallback */ }
  }

  if (fs.existsSync(reportPath)) {
    try {
      const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
      const currentRate = report.statistics?.total?.percentage || 0;

      if (currentRate > previousBaseline + 0.01) {
        val.error(`Duplicate Rate Regression: Current ${currentRate}% exceeds previous baseline ${previousBaseline}%`);
      } else if (currentRate < previousBaseline) {
        val.info(`Duplicate Rate Improved: ${currentRate}% (Previous baseline: ${previousBaseline}%)`);
        // Automatically save new tighter baseline
        fs.writeFileSync(baselinePath, JSON.stringify({ baselinePercentage: currentRate, lastUpdated: new Date().toISOString() }, null, 2));
      } else {
        val.info(`Duplicate Rate Preserved: ${currentRate}% (Baseline: ${previousBaseline}%)`);
      }
    } catch {
      val.warning('Could not parse JSCPD report file');
    }
  }
}

if (require.main === module) {
  runStandalone(META, run);
}
module.exports = { meta: META, run };
