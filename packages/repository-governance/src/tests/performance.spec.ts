import {
  FontLoadingValidator,
  RenderBlockingValidator
} from "../validators/performance.js";
import {
  ObservabilityValidator,
  DTOGovernanceValidator,
  AppRouterLayoutValidator,
  DriftPreventionValidator
} from "../validators/archExtended.js";
import { AnalysisResultEnvelope } from "../types/index.js";

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) { passed++; }
  else { console.error(`FAIL: ${message}`); failed++; }
}

// ── FontLoadingValidator: empty payload ──────────────────────────────────
{
  const v = new FontLoadingValidator();
  const envelope: AnalysisResultEnvelope<any> = {
    schemaVersion: "1.0.0", analyzerId: "font-loading", timestamp: "",
    status: "success", durationMs: 0, warningsCount: 0, errorsCount: 0,
    metadata: {}, payload: []
  };
  const report = await v.validate(envelope, {});
  assert(report.passed === true, "font-loading: empty payload passes");
  assert(report.score === 100, "font-loading: empty payload score 100");
}

// ── FontLoadingValidator: with warnings (external fonts) ──────────────────
{
  const v = new FontLoadingValidator();
  const envelope: AnalysisResultEnvelope<any> = {
    schemaVersion: "1.0.0", analyzerId: "font-loading", timestamp: "",
    status: "success", durationMs: 0, warningsCount: 1, errorsCount: 0,
    metadata: {},
    payload: [{ file: "layout.tsx", severity: "warning", message: "External fonts" }]
  };
  const report = await v.validate(envelope, {});
  assert(report.passed === false, "font-loading: warnings => not passed");
  assert(report.score === 75, "font-loading: warning score 75");
  assert(report.violations[0].ruleId === "optimized-font-loading-external", "font-loading: correct ruleId");
}

// ── FontLoadingValidator: with info (custom @font-face) ───────────────────
{
  const v = new FontLoadingValidator();
  const envelope: AnalysisResultEnvelope<any> = {
    schemaVersion: "1.0.0", analyzerId: "font-loading", timestamp: "",
    status: "success", durationMs: 0, warningsCount: 0, errorsCount: 0,
    metadata: {},
    payload: [{ file: "styles.tsx", severity: "info", message: "Custom @font-face" }]
  };
  const report = await v.validate(envelope, {});
  assert(report.score === 90, "font-loading: info score 90");
  assert(report.violations[0].ruleId === "optimized-font-loading-custom", "font-loading: custom ruleId");
}

// ── RenderBlockingValidator: empty payload ───────────────────────────────
{
  const v = new RenderBlockingValidator();
  const envelope: AnalysisResultEnvelope<any> = {
    schemaVersion: "1.0.0", analyzerId: "render-blocking", timestamp: "",
    status: "success", durationMs: 0, warningsCount: 0, errorsCount: 0,
    metadata: {}, payload: []
  };
  const report = await v.validate(envelope, {});
  assert(report.passed === true, "render-blocking: empty payload passes");
  assert(report.score === 100, "render-blocking: empty payload score 100");
}

// ── RenderBlockingValidator: with violations ──────────────────────────────
{
  const v = new RenderBlockingValidator();
  const envelope: AnalysisResultEnvelope<any> = {
    schemaVersion: "1.0.0", analyzerId: "render-blocking", timestamp: "",
    status: "success", durationMs: 0, warningsCount: 1, errorsCount: 0,
    metadata: {},
    payload: [{ file: "index.html", severity: "warning", message: "Sync script", line: 10 }]
  };
  const report = await v.validate(envelope, {});
  assert(report.passed === false, "render-blocking: violations => not passed");
  assert(report.score === 80, "render-blocking: one violation score 80");
  assert(report.violations[0].line === 10, "render-blocking: preserves line number");
}

// ── ObservabilityValidator: empty payload ────────────────────────────────
{
  const v = new ObservabilityValidator();
  const envelope: AnalysisResultEnvelope<any> = {
    schemaVersion: "1.0.0", analyzerId: "observability", timestamp: "",
    status: "success", durationMs: 0, warningsCount: 0, errorsCount: 0,
    metadata: {}, payload: []
  };
  const report = await v.validate(envelope, {});
  assert(report.passed === true, "observability: empty payload passes");
}

// ── ObservabilityValidator: with violations ──────────────────────────────
{
  const v = new ObservabilityValidator();
  const envelope: AnalysisResultEnvelope<any> = {
    schemaVersion: "1.0.0", analyzerId: "observability", timestamp: "",
    status: "success", durationMs: 0, warningsCount: 1, errorsCount: 0,
    metadata: {},
    payload: [{ file: "service.ts", severity: "warning", message: "console.log", line: 42 }]
  };
  const report = await v.validate(envelope, {});
  assert(report.score === 80, "observability: violation score 80");
}

// ── DTOGovernanceValidator: with violations ──────────────────────────────
{
  const v = new DTOGovernanceValidator();
  const envelope: AnalysisResultEnvelope<any> = {
    schemaVersion: "1.0.0", analyzerId: "dto-governance", timestamp: "",
    status: "success", durationMs: 0, warningsCount: 0, errorsCount: 1,
    metadata: {},
    payload: [{ file: "userController.ts", severity: "error", message: "Direct axios import" }]
  };
  const report = await v.validate(envelope, {});
  assert(report.score === 75, "dto-governance: violation score 75");
  assert(report.violations[0].ruleId === "dto-governance", "dto-governance: correct ruleId");
}

// ── AppRouterLayoutValidator: with violations ────────────────────────────
{
  const v = new AppRouterLayoutValidator();
  const envelope: AnalysisResultEnvelope<any> = {
    schemaVersion: "1.0.0", analyzerId: "app-router-layout", timestamp: "",
    status: "success", durationMs: 0, warningsCount: 1, errorsCount: 0,
    metadata: {},
    payload: [{ file: "app/deep/nested/layout.tsx", severity: "warning", message: "Nesting depth 5" }]
  };
  const report = await v.validate(envelope, {});
  assert(report.score === 80, "app-router: warning score 80");
  assert(report.violations[0].ruleId === "app-router-layout-nesting-depth", "app-router: correct ruleId");
}

// ── DriftPreventionValidator: with violations ────────────────────────────
{
  const v = new DriftPreventionValidator();
  const envelope: AnalysisResultEnvelope<any> = {
    schemaVersion: "1.0.0", analyzerId: "drift-prevention", timestamp: "",
    status: "success", durationMs: 0, warningsCount: 0, errorsCount: 0,
    metadata: {},
    payload: [{ file: "api/route.ts", severity: "info", message: "Inline Zod schema" }]
  };
  const report = await v.validate(envelope, {});
  assert(report.score === 90, "drift-prevention: info score 90");
}

console.log(`\nPerformance & Architecture Extended Tests: ${passed} passed, ${failed} failed out of ${passed + failed}`);
if (failed > 0) process.exit(1);
