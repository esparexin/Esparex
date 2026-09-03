import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

export interface AxeScanOptions {
  include?: string[];
  exclude?: string[];
  disabledRules?: string[];
}

/**
 * Canonical Axe scanner configured for WCAG 2.2 AA compliance.
 */
export async function runAxeScan(page: Page, options: AxeScanOptions = {}) {
  let builder = new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']);

  if (options.include && options.include.length > 0) {
    options.include.forEach(sel => {
      builder = builder.include(sel);
    });
  }

  if (options.exclude && options.exclude.length > 0) {
    options.exclude.forEach(sel => {
      builder = builder.exclude(sel);
    });
  }

  if (options.disabledRules && options.disabledRules.length > 0) {
    builder = builder.disableRules(options.disabledRules);
  }

  const results = await builder.analyze();

  if (results.violations.length > 0) {
    const formattedErrors = results.violations.map(v => {
      const targets = v.nodes.map(n => `    - ${n.target.join(' ')}: ${n.failureSummary}`).join('\n');
      return `\n❌ [${v.id}] ${v.help} (Impact: ${v.impact}, WCAG Tags: ${v.tags.join(', ')})\n  Help: ${v.helpUrl}\n  Nodes:\n${targets}`;
    }).join('\n');

    return {
      passed: false,
      violationsCount: results.violations.length,
      violations: results.violations,
      report: formattedErrors
    };
  }

  return {
    passed: true,
    violationsCount: 0,
    violations: [],
    report: '✅ Zero WCAG 2.2 AA Axe violations detected.'
  };
}

/**
 * Asserts that the page or component is free of WCAG 2.2 AA violations.
 */
export async function expectNoAxeViolations(page: Page, options: AxeScanOptions = {}) {
  const result = await runAxeScan(page, options);
  expect(result.violations, result.report).toEqual([]);
}
