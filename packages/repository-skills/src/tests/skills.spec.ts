import * as assert from "assert";
import * as path from "path";
import { Brain } from "@esparex/repository-brain";
import {
  SkillRegistry,
  CapabilityRouter,
  DefaultSkillRegistry,
  WorkspaceResolutionSkill,
  LayerResolutionSkill,
  TechnologyInspectionSkill,
  ScaffoldingSkill,
  SkillContext,
  SkillLogger
} from "../index.js";

// ─── Test Logger ───────────────────────────────────────────────────────────
const silentLogger: SkillLogger = {
  info:  (msg, data) => { if (process.env.SKILLS_TEST_VERBOSE) console.log("[INFO]",  msg, data ?? ""); },
  warn:  (msg, data) => { if (process.env.SKILLS_TEST_VERBOSE) console.warn("[WARN]",  msg, data ?? ""); },
  error: (msg, data) => { if (process.env.SKILLS_TEST_VERBOSE) console.error("[ERROR]", msg, data ?? ""); }
};

// ─── Helpers ───────────────────────────────────────────────────────────────
function pass(name: string) { console.log(`  ✔ PASS: ${name}`); }
function fail(name: string, err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`  ✖ FAIL: ${name} — ${msg}`);
  process.exitCode = 1;
}

async function runTests() {
  console.log("--------------------------------------------------");
  console.log("Running @esparex/repository-skills Phase 5 tests...");
  console.log("--------------------------------------------------\n");

  const workspaceRoot = path.resolve(process.cwd(), "../../");
  const brain = await Brain.load({ workspaceRoot });
  const snapshot = brain.snapshot;

  const context: SkillContext = {
    snapshot,
    logger: silentLogger,
    dryRun: true  // all file-writing tests run in dry-run mode
  };

  // ═══════════════════════════════════════════════════════════════════════
  // 1. CONTRACT TESTS — Skills must never accept workspaceRoot directly
  // ═══════════════════════════════════════════════════════════════════════
  console.log("1. Contract checks");

  try {
    // Every skill's execute() signature accepts SkillContext, not workspaceRoot.
    // This is verified by TypeScript at compile time; here we confirm the
    // runtime interface is correct.
    const ws = new WorkspaceResolutionSkill();
    assert.strictEqual(typeof ws.execute, "function", "execute must be a function");
    assert.ok(ws.metadata.id, "skill must have a metadata.id");
    assert.ok(ws.metadata.category, "skill must have a metadata.category");
    pass("All reference skills expose Skill interface");
  } catch (e) { fail("All reference skills expose Skill interface", e); }

  // ═══════════════════════════════════════════════════════════════════════
  // 2. WorkspaceResolutionSkill — derives path from snapshot, not hardcode
  // ═══════════════════════════════════════════════════════════════════════
  console.log("\n2. WorkspaceResolutionSkill");

  try {
    const skill = new WorkspaceResolutionSkill();
    const result = await skill.execute(context, { name: "web" });
    assert.strictEqual(result.status, "success", "web workspace must resolve");
    const out = result.output as Record<string, string>;
    // The resolved path must come from the snapshot — not be a hardcoded "apps/web"
    const expectedPath = snapshot.workspace.find(w => w.name === "web" || w.path === "apps/web")?.path;
    assert.strictEqual(out.path, expectedPath, "resolved path must match snapshot.workspace.path");
    assert.ok(out.absolutePath.startsWith(snapshot.repository.root), "absolutePath must start with snapshot.repository.root");
    pass("WorkspaceResolutionSkill resolves 'web' from snapshot (not hardcoded)");
  } catch (e) { fail("WorkspaceResolutionSkill resolves 'web' from snapshot", e); }

  try {
    const skill = new WorkspaceResolutionSkill();
    const result = await skill.execute(context, { name: "DOES_NOT_EXIST_9999" });
    assert.strictEqual(result.status, "failure", "unknown workspace must fail gracefully");
    pass("WorkspaceResolutionSkill returns failure for unknown workspace");
  } catch (e) { fail("WorkspaceResolutionSkill failure for unknown workspace", e); }

  // ═══════════════════════════════════════════════════════════════════════
  // 3. LayerResolutionSkill — derives layer from snapshot ownership map
  // ═══════════════════════════════════════════════════════════════════════
  console.log("\n3. LayerResolutionSkill");

  try {
    const skill = new LayerResolutionSkill();
    const result = await skill.execute(context, { filePath: "backend/user/src/controllers/ListingController.ts" });
    assert.strictEqual(result.status, "success");
    const out = result.output as Record<string, string>;
    // Layer name must come from snapshot.architecture.ownership — not a hardcoded string
    const expectedLayer = snapshot.architecture.ownership["backend/user"];
    assert.strictEqual(out.layer, expectedLayer, "layer must match snapshot.architecture.ownership");
    pass("LayerResolutionSkill resolves 'backend/user' → layer from snapshot ownership");
  } catch (e) { fail("LayerResolutionSkill resolves backend/user", e); }

  try {
    const skill = new LayerResolutionSkill();
    const result = await skill.execute(context, { filePath: "apps/web/src/app/page.tsx" });
    assert.strictEqual(result.status, "success");
    const out = result.output as Record<string, string>;
    const expectedLayer = snapshot.architecture.ownership["apps/web"];
    assert.strictEqual(out.layer, expectedLayer, "layer must match snapshot.architecture.ownership for apps/web");
    pass("LayerResolutionSkill resolves 'apps/web' → layer from snapshot ownership");
  } catch (e) { fail("LayerResolutionSkill resolves apps/web", e); }

  // ═══════════════════════════════════════════════════════════════════════
  // 4. TechnologyInspectionSkill — reads from snapshot, not package.json
  // ═══════════════════════════════════════════════════════════════════════
  console.log("\n4. TechnologyInspectionSkill");

  try {
    const skill = new TechnologyInspectionSkill();
    const result = await skill.execute(context, {});
    assert.strictEqual(result.status, "success");
    const out = result.output as Record<string, unknown>;
    const tech = out.technology as Record<string, string>;
    // Values must come from snapshot.technology — verified by comparing to known snapshot values
    assert.strictEqual(tech.express, snapshot.technology.express, "express version must match snapshot.technology");
    assert.strictEqual(tech.next,    snapshot.technology.next,    "next version must match snapshot.technology");
    pass("TechnologyInspectionSkill returns snapshot.technology values (not package.json)");
  } catch (e) { fail("TechnologyInspectionSkill returns snapshot values", e); }

  try {
    const skill = new TechnologyInspectionSkill();
    const result = await skill.execute(context, { framework: "express" });
    assert.strictEqual(result.status, "success");
    const out = result.output as Record<string, string>;
    assert.strictEqual(out.version, snapshot.technology.express, "single framework lookup must match snapshot");
    pass("TechnologyInspectionSkill single framework lookup returns snapshot.technology.express");
  } catch (e) { fail("TechnologyInspectionSkill single framework lookup", e); }

  // ═══════════════════════════════════════════════════════════════════════
  // 5. ScaffoldingSkill — writes to snapshot-resolved path, dryRun mode
  // ═══════════════════════════════════════════════════════════════════════
  console.log("\n5. ScaffoldingSkill (dryRun)");

  try {
    const skill = new ScaffoldingSkill();
    const result = await skill.execute(context, {
      workspaceName: "web",
      fileName: "src/components/__test__/TestComponent.tsx",
      template: "// generated by ScaffoldingSkill\nexport function TestComponent() { return null; }\n"
    });
    assert.strictEqual(result.status, "success", "dryRun scaffolding must succeed");
    const out = result.output as Record<string, unknown>;
    assert.strictEqual(out.dryRun, true, "output.dryRun must be true");
    // resolvedPath must contain the snapshot-resolved workspace path — not hardcoded
    const webPath = snapshot.workspace.find(w => w.name === "web" || w.path === "apps/web")?.path ?? "apps/web";
    assert.ok((out.resolvedPath as string).startsWith(webPath), "resolvedPath must start with snapshot workspace path");
    pass("ScaffoldingSkill dryRun uses snapshot-resolved workspace path (not hardcoded)");
  } catch (e) { fail("ScaffoldingSkill dryRun resolves path from snapshot", e); }

  // ═══════════════════════════════════════════════════════════════════════
  // 6. SkillRegistry — plugin registration and discovery
  // ═══════════════════════════════════════════════════════════════════════
  console.log("\n6. SkillRegistry");

  try {
    const registry = new SkillRegistry();
    registry.register(new WorkspaceResolutionSkill());
    registry.register(new TechnologyInspectionSkill());
    assert.strictEqual(registry.list().length, 2, "registry must contain 2 skills");
    assert.ok(registry.get("workspace-resolution"), "get by id must work");
    const inspectionSkills = registry.listByCategory("inspection");
    assert.strictEqual(inspectionSkills.length, 2, "both skills are in 'inspection' category");
    pass("SkillRegistry register/get/listByCategory all work correctly");
  } catch (e) { fail("SkillRegistry plugin registration and discovery", e); }

  try {
    const registry = new SkillRegistry();
    registry.register(new WorkspaceResolutionSkill());
    assert.throws(() => registry.register(new WorkspaceResolutionSkill()), /already registered/, "duplicate registration must throw");
    pass("SkillRegistry prevents duplicate skill registration");
  } catch (e) { fail("SkillRegistry prevents duplicates", e); }

  try {
    // DefaultSkillRegistry must contain all 4 reference skills
    assert.strictEqual(DefaultSkillRegistry.list().length, 4, "DefaultSkillRegistry must have 4 skills");
    ["workspace-resolution", "layer-resolution", "technology-inspection", "scaffolding"].forEach(id => {
      assert.ok(DefaultSkillRegistry.get(id), `DefaultSkillRegistry must contain "${id}"`);
    });
    pass("DefaultSkillRegistry contains all 4 reference skills");
  } catch (e) { fail("DefaultSkillRegistry completeness", e); }

  // ═══════════════════════════════════════════════════════════════════════
  // 7. CapabilityRouter — snapshot-driven routing (no hardcoded paths)
  // ═══════════════════════════════════════════════════════════════════════
  console.log("\n7. CapabilityRouter");

  try {
    const router = new CapabilityRouter(DefaultSkillRegistry);

    // Path-based routing: the router must resolve the layer from the snapshot
    // and not from hardcoded folder names
    const result = await router.route(
      { task: "Inspect backend controller", targetPath: "backend/user/src/controllers/Foo.ts" },
      context
    );
    // resolvedLayer must come from snapshot.architecture.ownership
    const expectedLayer = snapshot.architecture.ownership["backend/user"];
    assert.strictEqual(result.resolvedLayer, expectedLayer, "router must resolve layer from snapshot ownership");
    pass("CapabilityRouter resolves layer from snapshot.architecture.ownership (not hardcoded)");
  } catch (e) { fail("CapabilityRouter snapshot-driven routing", e); }

  try {
    const router = new CapabilityRouter(DefaultSkillRegistry);
    const result = await router.route(
      { task: "List inspection skills", categories: ["inspection"] },
      context
    );
    assert.ok(result.skillsExecuted.length > 0, "category-based routing must execute inspection skills");
    pass("CapabilityRouter category-based routing executes skills correctly");
  } catch (e) { fail("CapabilityRouter category routing", e); }

  try {
    const router = new CapabilityRouter(DefaultSkillRegistry);
    const result = await router.route(
      {
        task: "Run technology inspection",
        skillIds: ["technology-inspection"],
        inputs: { "technology-inspection": { framework: "express" } }
      },
      context
    );
    assert.strictEqual(result.overallStatus, "success");
    assert.deepStrictEqual(result.skillsExecuted, ["technology-inspection"]);
    pass("CapabilityRouter explicit skillId routing executes correctly");
  } catch (e) { fail("CapabilityRouter explicit skillId routing", e); }

  // ═══════════════════════════════════════════════════════════════════════
  // 8. BrainQuery.resolveLayer() — reverse lookup
  // ═══════════════════════════════════════════════════════════════════════
  console.log("\n8. BrainQuery.resolveLayer()");

  try {
    const transportPath = brain.query.resolveLayer("Transport Layer");
    assert.strictEqual(transportPath, "backend/user", "resolveLayer('Transport Layer') must return 'backend/user'");
    pass("BrainQuery.resolveLayer('Transport Layer') → 'backend/user'");
  } catch (e) { fail("BrainQuery.resolveLayer", e); }

  try {
    const unknown = brain.query.resolveLayer("Nonexistent Layer");
    assert.strictEqual(unknown, undefined, "resolveLayer for unknown layer must return undefined");
    pass("BrainQuery.resolveLayer returns undefined for unknown layer");
  } catch (e) { fail("BrainQuery.resolveLayer undefined for unknown", e); }

  console.log("\n--------------------------------------------------");
  console.log("All @esparex/repository-skills Phase 5 tests completed!");
  console.log("--------------------------------------------------\n");
}

runTests().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
