#!/usr/bin/env node

/**
 * 🛡️ Esparex UI Architecture Guard — Phase 5B
 *
 * Enforces the Single-Instance Responsive Architecture governance rules:
 *
 * ERROR (exit code 1 — blocks commit/CI):
 *   1. Nested PageContainer/Container elements in the same component tree
 *   2. Parallel responsive DOM subtrees (lg:hidden + hidden lg:flex/grid on sibling elements)
 *   3. Multiple <h1> elements in the same file
 *   4. Hardcoded hex colors in .tsx files (outside CSS files and tokens)
 *
 * WARNING (non-blocking, informational):
 *   5. Native <button> elements that could be replaced by <Button> from @esparex/ui
 *   6. Direct inline style attributes with color values
 *
 * EXCEPTIONS:
 *   Any line containing the comment /* ui-guard-ignore: <rule> [Justification] * / is exempt
 *   from that specific rule.
 *
 * Usage:
 *   node scripts/guard-ui-architecture.mjs
 *   node scripts/guard-ui-architecture.mjs --warn-only   (treat errors as warnings)
 *   node scripts/guard-ui-architecture.mjs --path apps/web/src/components/user
 */

const fs = require("fs");
const path = require("path");

// ─── CLI Flags ────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const WARN_ONLY = args.includes("--warn-only");
const SCOPE_ARG = args.find((a) => a.startsWith("--path="));
const SCAN_ROOT = SCOPE_ARG
  ? path.resolve(process.cwd(), SCOPE_ARG.replace("--path=", ""))
  : path.resolve(__dirname, "..", "apps", "web", "src");

// ─── Rules ────────────────────────────────────────────────────────────────────
const RULES = {
  NESTED_CONTAINER: {
    id: "nested-container",
    severity: "error",
    description: "Nested <Container> / <PageContainer> layout wrappers in same file",
  },
  PARALLEL_RESPONSIVE: {
    id: "parallel-responsive-dom",
    severity: "error",
    description: "Parallel responsive DOM subtrees (lg:hidden + hidden lg:)",
  },
  MULTIPLE_H1: {
    id: "multiple-h1",
    severity: "error",
    description: "Multiple <h1> elements in same component",
  },
  HARDCODED_HEX: {
    id: "hardcoded-hex-color",
    severity: "error",
    description: "Hardcoded hex color in TSX (use design tokens or CSS variables)",
  },
  NATIVE_BUTTON: {
    id: "native-button",
    severity: "warning",
    description: "Native <button> element — consider <Button> from @esparex/ui",
  },
  INLINE_COLOR_STYLE: {
    id: "inline-color-style",
    severity: "warning",
    description: "Inline style with color value — prefer design tokens",
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns true when the current line OR the immediately preceding line contains
 * a ui-guard-ignore annotation for the given ruleId.
 * This supports JSX block comments ({/* ui-guard-ignore: ... *​/}) which always
 * appear on a separate line above the element they suppress.
 */
function isIgnored(line, ruleId, prevLine = "") {
  return (
    line.includes(`ui-guard-ignore: ${ruleId}`) ||
    prevLine.includes(`ui-guard-ignore: ${ruleId}`)
  );
}

function walk(dir, collected = []) {
  if (!fs.existsSync(dir)) return collected;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (["node_modules", ".next", "dist", "coverage", "__tests__"].includes(entry.name)) continue;
      walk(full, collected);
    } else if (entry.isFile() && (full.endsWith(".tsx") || full.endsWith(".jsx"))) {
      collected.push(full);
    }
  }
  return collected;
}

// ─── Audit ────────────────────────────────────────────────────────────────────

function auditFile(filePath) {
  const src = fs.readFileSync(filePath, "utf-8");
  const lines = src.split("\n");
  const relPath = path.relative(path.resolve(__dirname, ".."), filePath);

  const violations = [];

  const report = (rule, lineNo, lineContent) => {
    if (isIgnored(lineContent, rule.id)) return;
    violations.push({ rule, file: relPath, line: lineNo + 1, content: lineContent.trim() });
  };

  // ── Rule: Multiple h1 elements ─────────────────────────────────────────────
  const h1Lines = lines.reduce((acc, l, i) => {
    const prevLine = i > 0 ? lines[i - 1] : "";
    if (/<h1[\s>]/.test(l) && !isIgnored(l, RULES.MULTIPLE_H1.id, prevLine)) acc.push(i + 1);
    return acc;
  }, []);
  if (h1Lines.length > 1) {
    violations.push({
      rule: RULES.MULTIPLE_H1,
      file: relPath,
      line: h1Lines[1],
      content: `${h1Lines.length} <h1> elements found (lines: ${h1Lines.join(", ")})`,
    });
  }

  // ── Rule: Nested Container elements ────────────────────────────────────────
  const containerMatches = lines
    .map((l, i) => ({ l, i }))
    .filter(({ l }) => /<(Container|PageContainer)[\s/>]/.test(l));
  if (containerMatches.length > 1) {
    const notIgnored = containerMatches.filter(({ l, i }) => {
      const prevLine = i > 0 ? lines[i - 1] : "";
      return !isIgnored(l, RULES.NESTED_CONTAINER.id, prevLine);
    });
    if (notIgnored.length > 1) {
      violations.push({
        rule: RULES.NESTED_CONTAINER,
        file: relPath,
        line: notIgnored[1].i + 1,
        content: `${notIgnored.length} Container/PageContainer occurrences in file — potential nesting`,
      });
    }
  }

  // ── Rule: Parallel responsive DOM subtrees ─────────────────────────────────
  const hasLgHidden = lines.some((l, i) => /className=["'][^"']*lg:hidden/.test(l) && !isIgnored(l, RULES.PARALLEL_RESPONSIVE.id));
  const hasHiddenLg = lines.some((l, i) => /className=["'][^"']*hidden lg:(?:block|flex|grid)/.test(l) && !isIgnored(l, RULES.PARALLEL_RESPONSIVE.id));
  if (hasLgHidden && hasHiddenLg) {
    violations.push({
      rule: RULES.PARALLEL_RESPONSIVE,
      file: relPath,
      line: 0,
      content: "Both 'lg:hidden' and 'hidden lg:*' classes present — likely parallel DOM duplication",
    });
  }

  // ── Rule: Hardcoded hex colors in TSX ─────────────────────────────────────
  const HEX_PATTERN = /(?:color|background|border(?:-color)?|fill|stroke)\s*[:=]\s*["']?#[0-9a-fA-F]{3,8}\b/;
  lines.forEach((l, i) => {
    const prevLine = i > 0 ? lines[i - 1] : "";
    if (HEX_PATTERN.test(l) && !isIgnored(l, RULES.HARDCODED_HEX.id, prevLine)) {
      // Skip design-token files themselves
      if (!filePath.includes("tokens") && !filePath.includes("colors")) {
        report(RULES.HARDCODED_HEX, i, l);
      }
    }
  });

  // ── Warning: Native <button> elements ─────────────────────────────────────
  const NATIVE_BUTTON_PATTERN = /^\s*<button\b(?!.*ui-guard-ignore)/;
  lines.forEach((l, i) => {
    const prevLine = i > 0 ? lines[i - 1] : "";
    if (NATIVE_BUTTON_PATTERN.test(l) && !isIgnored(l, RULES.NATIVE_BUTTON.id, prevLine)) {
      report(RULES.NATIVE_BUTTON, i, l);
    }
  });

  // ── Warning: Inline style with color ─────────────────────────────────────
  const INLINE_COLOR_PATTERN = /style=\{[^}]*(?:color|background)[^}]*#[0-9a-fA-F]{3,6}/;
  lines.forEach((l, i) => {
    const prevLine = i > 0 ? lines[i - 1] : "";
    if (INLINE_COLOR_PATTERN.test(l) && !isIgnored(l, RULES.INLINE_COLOR_STYLE.id, prevLine)) {
      report(RULES.INLINE_COLOR_STYLE, i, l);
    }
  });

  return violations;
}

// ─── Run ──────────────────────────────────────────────────────────────────────

function run() {
  const files = walk(SCAN_ROOT);
  const allViolations = [];

  for (const file of files) {
    const v = auditFile(file);
    allViolations.push(...v);
  }

  const errors = allViolations.filter((v) => v.rule.severity === "error");
  const warnings = allViolations.filter((v) => v.rule.severity === "warning");

  // ── Print report ──────────────────────────────────────────────────────────
  console.log(`\n🛡️  Esparex UI Architecture Guard`);
  console.log(`   Scanned: ${files.length} TSX/JSX files in ${path.relative(process.cwd(), SCAN_ROOT) || "."}`);
  console.log(`   Errors:   ${errors.length}`);
  console.log(`   Warnings: ${warnings.length}\n`);

  if (errors.length > 0) {
    console.error("❌ Architecture Violations (Errors)\n");
    for (const v of errors) {
      console.error(`  [${v.rule.id}] ${v.file}:${v.line}`);
      console.error(`    ${v.rule.description}`);
      console.error(`    → ${v.content}\n`);
    }
    if (!WARN_ONLY) {
      console.error("To suppress a specific rule on a specific line, add:");
      console.error("  {/* ui-guard-ignore: <rule-id> [Justification] */}\n");
    }
  }

  if (warnings.length > 0) {
    console.warn("⚠️  Architecture Warnings\n");
    for (const v of warnings) {
      console.warn(`  [${v.rule.id}] ${v.file}:${v.line}`);
      console.warn(`    → ${v.content}`);
    }
    console.warn("");
  }

  if (errors.length === 0 && warnings.length === 0) {
    console.log("✅ UI Architecture Guard Passed — 0 violations found.");
  } else if (errors.length === 0) {
    console.log(`✅ UI Architecture Guard Passed — ${warnings.length} warning(s) (non-blocking).`);
  }

  if (errors.length > 0 && !WARN_ONLY) {
    process.exit(1);
  }
}

run();
