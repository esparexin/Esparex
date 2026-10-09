#!/usr/bin/env node

/**
 * patch-tar-interop.js
 *
 * Ensures node-tar v7 CommonJS builds expose `exports.default = exports`
 * so Babel-transpiled CJS consumers (specifically `@expo/cli`) using
 * `_interopRequireDefault(require('tar'))` can resolve `_tar().default.extract()`
 * without runtime TypeError crashes, while keeping tar upgraded to secure v7+.
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

function findTarIndexFiles(startDir) {
  const matches = [];

  function scan(currentDir) {
    if (!fs.existsSync(currentDir)) return;
    try {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          if (entry.name === 'tar') {
            for (const f of ['index.js', 'index.min.js']) {
              const target = path.join(currentDir, 'tar', 'dist', 'commonjs', f);
              if (fs.existsSync(target)) {
                matches.push(target);
              }
            }
          }
          if (entry.name === 'node_modules' || entry.name.startsWith('@')) {
            scan(path.join(currentDir, entry.name));
          }
        }
      }
    } catch {
      // ignore access errors
    }
  }

  scan(startDir);
  return matches;
}

function patchTarIndex(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const snippet = "if (typeof exports.default === 'undefined') { Object.defineProperty(exports, 'default', { enumerable: true, value: exports }); }";
    if (!content.includes(snippet)) {
      fs.appendFileSync(filePath, '\n' + snippet + '\n', 'utf8');
      console.log(`[patch-tar-interop] Patched CommonJS default export in: ${path.relative(rootDir, filePath)}`);
    }
  } catch (err) {
    console.warn(`[patch-tar-interop] Warning: failed to patch ${filePath}: ${err.message}`);
  }
}

const tarFiles = findTarIndexFiles(path.join(rootDir, 'node_modules'));
for (const file of tarFiles) {
  patchTarIndex(file);
}
