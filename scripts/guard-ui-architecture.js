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
// Scan roots cover all UI layers (web + admin + canonical primitives).
// Per user governance decision, admin stays covered: the 4 raw admin modals
// were portalized in Phase 5, so multi-scope is green and blocks regressions.
const SCAN_ROOTS = SCOPE_ARG
  ? [path.resolve(process.cwd(), SCOPE_ARG.replace("--path=", ""))]
  : [
      path.resolve(__dirname, "..", "apps", "web", "src"),
      path.resolve(__dirname, "..", "apps", "admin", "src"),
      path.resolve(__dirname, "..", "packages", "ui", "src"),
    ];

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
  RAW_MODAL_OVERLAY: {
    id: "raw-modal-overlay",
    severity: "error",
    description: "Raw unportalled modal dialog overlay (must use @esparex/ui Dialog/Sheet/Drawer or Radix Portal)",
  },
  NATIVE_BUTTON: {
    id: "native-button",
    severity: "warning",
    description: "Native <button> element — consider <Button> from @esparex/ui",
  },
  NATIVE_INPUT: {
    id: "native-input",
    severity: "warning",
    description: "Native <input>/<select>/<textarea> — consume Input/Select/Textarea from @esparex/ui (SSOT)",
  },
  JS_VIEWPORT_BRANCH: {
    id: "js-viewport-branch",
    severity: "warning",
    description: "JS viewport branching (useIsMobile/window.innerWidth) for layout — use single-instance CSS breakpoints",
  },
  RAW_LOCALE_FORMAT: {
    id: "raw-locale-format",
    severity: "warning",
    description: "Raw toLocaleDateString/toLocaleString — use formatAppDate/formatPrice (@esparex/shared) per §20.3",
  },
  RAW_FETCH_UI: {
    id: "raw-fetch-ui",
    severity: "warning",
    description: "Raw fetch() in UI layer — consolidate through apiClient except documented SSR/S3 exceptions",
  },
  INLINE_COLOR_STYLE: {
    id: "inline-color-style",
    severity: "warning",
    description: "Inline style with color value — prefer design tokens",
  },
  LUCIDE_DIRECT_IMPORT: {
    id: "lucide-direct-import",
    severity: "warning",
    description: "Direct import from 'lucide-react' in apps/web. Import from @esparex/ui instead.",
  },
  RAW_INLINE_SVG: {
    id: "raw-inline-svg",
    severity: "warning",
    description: "Inline <svg> element — must use canonical icons exported from @esparex/ui",
  },
  STICKY_Z_HOST: {
    id: "sticky-z-host",
    severity: "error",
    description:
      "Sticky strip with explicit zIndex — status stacking host is owned exclusively by StatusBannerHost.tsx",
  },
};

const NATIVE_BUTTON_BASELINE = 257; // web + admin scope (was 138 web-only)
const LUCIDE_DIRECT_IMPORT_BASELINE = 0;
const RAW_INLINE_SVG_BASELINE = 0;


// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns true when the current line OR the immediately preceding line
 * contains a ui-guard-ignore annotation for the given ruleId.
 * Supports JSX block comments and JS line comments placed on the line above
 * the element being suppressed.
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
  const patternHit = (idx, re) => {
    const line = lines[idx];
    const prevLine = idx > 0 ? lines[idx - 1] : "";
    return re.test(line) && !isIgnored(line, RULES.PARALLEL_RESPONSIVE.id, prevLine);
  };
  const hasLgHidden = lines.some((_, idx) => patternHit(idx, /className=["'][^"']*lg:hidden/));
  const hasHiddenLg = lines.some((_, idx) => patternHit(idx, /className=["'][^"']*hidden lg:(?:block|flex|grid)/));
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

  // ── Rule: Raw unportalled modal overlays ─────────────────────────────────
  // Catches both role=dialog divs AND fixed inset-0 + bg-black overlays
  // without a portal/dialog import (admin modals bypassed the old check).
  const hasPortalOrDialogImport =
    /DialogPortal|DialogContent|DialogOverlay|createPortal/.test(src) ||
    /from\s+["']@radix-ui\/react-dialog["']/.test(src);

  if (!hasPortalOrDialogImport) {
    const RAW_MODAL_PATTERN = /<div[^>]*\brole=["'](?:dialog|alertdialog)["']/;
    lines.forEach((l, i) => {
      const prevLine = i > 0 ? lines[i - 1] : "";
      if (RAW_MODAL_PATTERN.test(l) && !isIgnored(l, RULES.RAW_MODAL_OVERLAY.id, prevLine)) {
        report(RULES.RAW_MODAL_OVERLAY, i, l);
      }
    });
    const hasFixedOverlay = lines.some((l) => /fixed\s+inset-0/.test(l) && !/lg:hidden/.test(l));
    const hasDarkScrim = lines.some((l) => /bg-black\//.test(l));
    if (hasFixedOverlay && hasDarkScrim) {
      const idx = lines.findIndex((l) => /fixed\s+inset-0/.test(l) && !/lg:hidden/.test(l));
      const prevLine = idx > 0 ? lines[idx - 1] : "";
      if (!isIgnored(lines[idx], RULES.RAW_MODAL_OVERLAY.id, prevLine)) {
        report(RULES.RAW_MODAL_OVERLAY, idx, lines[idx]);
      }
    }
  }

  // ── Warning: Native <button> elements ─────────────────────────────────────
  // Canonical @esparex/ui primitives themselves are exempt (they ARE the SSOT).
  const isCanonicalUiOwner = filePath.includes(`${path.sep}packages${path.sep}ui${path.sep}src`) || filePath.includes("packages/ui/src");
  const NATIVE_BUTTON_PATTERN = /^\s*<button\b(?!.*ui-guard-ignore)/;
  lines.forEach((l, i) => {
    if (isCanonicalUiOwner) return;
    const prevLine = i > 0 ? lines[i - 1] : "";
    if (NATIVE_BUTTON_PATTERN.test(l) && !isIgnored(l, RULES.NATIVE_BUTTON.id, prevLine)) {
      report(RULES.NATIVE_BUTTON, i, l);
    }
  });

  // ── Warning: Native <input>/<select>/<textarea> (SSOT primitives) ─────────
  const NATIVE_FIELD_PATTERN = /^\s*<(input|select|textarea)\b/;
  lines.forEach((l, i) => {
    if (isCanonicalUiOwner) return;
    const prevLine = i > 0 ? lines[i - 1] : "";
    if (NATIVE_FIELD_PATTERN.test(l) && !isIgnored(l, RULES.NATIVE_INPUT.id, prevLine)) {
      if (/type=["']hidden["']/.test(l)) return;
      report(RULES.NATIVE_INPUT, i, l);
    }
  });

  // ── Warning: JS viewport branching for layout ────────────────────────────
  // A `responsive-exception:` comment on the same/previous line documents a
  // permitted dynamic-behavior use (sheet routing, ad density, autofocus,
  // canvas measurement) and suppresses this warning for that line.
  lines.forEach((l, i) => {
    const prevLine = i > 0 ? lines[i - 1] : "";
    if (/responsive-exception:/.test(l) || /responsive-exception:/.test(prevLine)) return;
    if ((/useIsMobile|useIsMobileDevice/.test(l) || /window\.innerWidth/.test(l)) && !isIgnored(l, RULES.JS_VIEWPORT_BRANCH.id, prevLine)) {
      report(RULES.JS_VIEWPORT_BRANCH, i, l);
    }
  });

  // ── Warning: Raw locale formatting (§20.3) ────────────────────────────────
  lines.forEach((l, i) => {
    const prevLine = i > 0 ? lines[i - 1] : "";
    if (/\.toLocale(DateString|String)\(/.test(l) && !isIgnored(l, RULES.RAW_LOCALE_FORMAT.id, prevLine)) {
      report(RULES.RAW_LOCALE_FORMAT, i, l);
    }
  });

  // ── Warning: Raw fetch() in UI layer ─────────────────────────────────────
  const isUiLayer = /apps\/(web|admin)\/src\/(components|context|hooks)/.test(filePath);
  if (isUiLayer) {
    lines.forEach((l, i) => {
      const prevLine = i > 0 ? lines[i - 1] : "";
      if (/(^|[^a-zA-Z])fetch\(/.test(l) && !/refetch\(/.test(l) && !isIgnored(l, RULES.RAW_FETCH_UI.id, prevLine)) {
        report(RULES.RAW_FETCH_UI, i, l);
      }
    });
  }

  // ── Warning: Inline style with color ─────────────────────────────────────
  const INLINE_COLOR_PATTERN = /style=\{[^}]*(?:color|background)[^}]*#[0-9a-fA-F]{3,6}/;
  lines.forEach((l, i) => {
    const prevLine = i > 0 ? lines[i - 1] : "";
    if (INLINE_COLOR_PATTERN.test(l) && !isIgnored(l, RULES.INLINE_COLOR_STYLE.id, prevLine)) {
      report(RULES.INLINE_COLOR_STYLE, i, l);
    }
  });

  // ── Warning: Direct lucide-react import ───────────────────────────────────
  lines.forEach((l, i) => {
    if (isCanonicalUiOwner) return;
    const prevLine = i > 0 ? lines[i - 1] : "";
    if (/from\s+["']lucide-react["']/.test(l) && !isIgnored(l, RULES.LUCIDE_DIRECT_IMPORT.id, prevLine)) {
      report(RULES.LUCIDE_DIRECT_IMPORT, i, l);
    }
  });

  // ── Warning: Inline <svg> element ─────────────────────────────────────────
  lines.forEach((l, i) => {
    if (isCanonicalUiOwner) return;
    const prevLine = i > 0 ? lines[i - 1] : "";
    if (/<svg[\s>]/.test(l) && !isIgnored(l, RULES.RAW_INLINE_SVG.id, prevLine)) {
      report(RULES.RAW_INLINE_SVG, i, l);
    }
  });

  // ── Error: Sticky strip with explicit inline zIndex outside status host ───
  // Single stacking-owner invariant: only StatusBannerHost.tsx may combine a
  // `sticky top-0` strip with an explicit inline zIndex (Z_INDEX.statusBanner).
  // This prevents the former dual-banner stacking (two sticky hosts at
  // z 9999/10000 painting above dialog/sheet backdrops) from reappearing.
  const isStatusBannerHost = relPath.replace(/\\/g, "/").endsWith("common/StatusBannerHost.tsx");
  if (!isStatusBannerHost) {
    const stickyIdx = lines.findIndex((l) => l.includes("sticky top-0"));
    const hasInlineZIndex = lines.some((l) => /style=\{\{[^}]*zIndex/.test(l));
    if (stickyIdx !== -1 && hasInlineZIndex) {
      const prevLine = stickyIdx > 0 ? lines[stickyIdx - 1] : "";
      if (!isIgnored(lines[stickyIdx], RULES.STICKY_Z_HOST.id, prevLine)) {
        report(RULES.STICKY_Z_HOST, stickyIdx, lines[stickyIdx]);
      }
    }
  }

  return violations;
}

// ─── Run ──────────────────────────────────────────────────────────────────────

function run() {
  const files = SCAN_ROOTS.flatMap((root) => walk(root));
  const allViolations = [];

  for (const file of files) {
    const v = auditFile(file);
    allViolations.push(...v);
  }

  const errors = allViolations.filter((v) => v.rule.severity === "error");
  const warnings = allViolations.filter((v) => v.rule.severity === "warning");

  // Ratchet checks
  const nativeButtonCount = allViolations.filter((v) => v.rule.id === RULES.NATIVE_BUTTON.id).length;
  if (nativeButtonCount > NATIVE_BUTTON_BASELINE) {
    errors.push({
      rule: {
        id: "native-button-ratchet",
        severity: "error",
        description: `Native <button> count (${nativeButtonCount}) exceeds baseline (${NATIVE_BUTTON_BASELINE}). Use @esparex/ui Button primitive.`,
      },
      file: "apps/web",
      line: 0,
      content: `Current: ${nativeButtonCount}, Baseline: ${NATIVE_BUTTON_BASELINE}`,
    });
  }

  const lucideImportCount = allViolations.filter((v) => v.rule.id === RULES.LUCIDE_DIRECT_IMPORT.id).length;
  if (lucideImportCount > LUCIDE_DIRECT_IMPORT_BASELINE) {
    errors.push({
      rule: {
        id: "lucide-import-ratchet",
        severity: "error",
        description: `Direct 'lucide-react' imports count (${lucideImportCount}) exceeds baseline (${LUCIDE_DIRECT_IMPORT_BASELINE}). Import from @esparex/ui.`,
      },
      file: "apps/web",
      line: 0,
      content: `Current: ${lucideImportCount}, Baseline: ${LUCIDE_DIRECT_IMPORT_BASELINE}`,
    });
  }

  const rawSvgCount = allViolations.filter((v) => v.rule.id === RULES.RAW_INLINE_SVG.id).length;
  if (rawSvgCount > RAW_INLINE_SVG_BASELINE) {
    errors.push({
      rule: {
        id: "raw-svg-ratchet",
        severity: "error",
        description: `Raw inline <svg> count (${rawSvgCount}) exceeds baseline (${RAW_INLINE_SVG_BASELINE}). Use @esparex/ui icons.`,
      },
      file: "apps/web",
      line: 0,
      content: `Current: ${rawSvgCount}, Baseline: ${RAW_INLINE_SVG_BASELINE}`,
    });
  }

  // ── Print report ──────────────────────────────────────────────────────────
  const scannedLabel = SCOPE_ARG
    ? path.relative(process.cwd(), SCAN_ROOTS[0]) || "."
    : SCAN_ROOTS.map((r) => path.relative(process.cwd(), r) || ".").join(", ");
  console.log(`\n🛡️  Esparex UI Architecture Guard`);
  console.log(`   Scanned: ${files.length} TSX/JSX files in ${scannedLabel}`);
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
