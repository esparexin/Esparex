/**
 * lib/constants.ts
 * ----------------
 * Shared path constants for the architecture platform.
 * Imported by verify-architecture, registry, metrics, and report.
 */

import * as path from 'node:path';

export const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
export const DOMAINS_PATH = path.join(REPO_ROOT, 'core', 'src', 'domains');
export const ADAPTERS_PATH = path.join(REPO_ROOT, 'core', 'src', 'adapters');
export const TOOLING_DIR = path.join(REPO_ROOT, '.tooling');
export const RULES_PATH = path.join(__dirname, '..', 'architecture-rules.yaml');
export const CHECKS_DIR = path.join(__dirname, '..', 'checks');
