import {
  SecureUploadValidator,
  RBACCheckValidator
} from "../validators/security.js";
import { AnalysisResultEnvelope, ValidationReport } from "../types/index.js";

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) { passed++; }
  else { console.error(`FAIL: ${message}`); failed++; }
}

// ── SecureUploadValidator: empty payload ─────────────────────────────────
{
  const v = new SecureUploadValidator();
  const envelope: AnalysisResultEnvelope<any> = {
    schemaVersion: "1.0.0", analyzerId: "secure-upload", timestamp: "",
    status: "success", durationMs: 0, warningsCount: 0, errorsCount: 0,
    metadata: {}, payload: []
  };
  const report = await v.validate(envelope, {});
  assert(report.passed === true, "secure-upload: empty payload passes");
  assert(report.score === 100, "secure-upload: empty payload score 100");
  assert(report.violations.length === 0, "secure-upload: empty payload no violations");
}

// ── SecureUploadValidator: with violations ────────────────────────────────
{
  const v = new SecureUploadValidator();
  const envelope: AnalysisResultEnvelope<any> = {
    schemaVersion: "1.0.0", analyzerId: "secure-upload", timestamp: "",
    status: "success", durationMs: 0, warningsCount: 1, errorsCount: 0,
    metadata: {},
    payload: [{ file: "routes/api.ts", route: "routes/api.ts", severity: "warning", message: "No upload middleware" }]
  };
  const report = await v.validate(envelope, {});
  assert(report.passed === false, "secure-upload: violations => not passed");
  assert(report.score === 80, "secure-upload: one violation score 80");
  assert(report.violations.length === 1, "secure-upload: one violation");
  assert(report.violations[0].ruleId === "secure-upload-handling", "secure-upload: correct ruleId");
}

// ── RBACCheckValidator: empty payload ────────────────────────────────────
{
  const v = new RBACCheckValidator();
  const envelope: AnalysisResultEnvelope<any> = {
    schemaVersion: "1.0.0", analyzerId: "rbac-check", timestamp: "",
    status: "success", durationMs: 0, warningsCount: 0, errorsCount: 0,
    metadata: {}, payload: []
  };
  const report = await v.validate(envelope, {});
  assert(report.passed === true, "rbac: empty payload passes");
  assert(report.score === 100, "rbac: empty payload score 100");
}

// ── RBACCheckValidator: with violations ──────────────────────────────────
{
  const v = new RBACCheckValidator();
  const envelope: AnalysisResultEnvelope<any> = {
    schemaVersion: "1.0.0", analyzerId: "rbac-check", timestamp: "",
    status: "success", durationMs: 0, warningsCount: 1, errorsCount: 0,
    metadata: {},
    payload: [{ file: "routes/user.ts", route: "routes/user.ts", severity: "warning", message: "No RBAC" }]
  };
  const report = await v.validate(envelope, {});
  assert(report.passed === false, "rbac: violations => not passed");
  assert(report.score === 75, "rbac: one violation score 75");
  assert(report.violations[0].ruleId === "rbac-authorization-validation", "rbac: correct ruleId");
}

console.log(`\nSecurity Validator Tests: ${passed} passed, ${failed} failed out of ${passed + failed}`);
if (failed > 0) process.exit(1);
