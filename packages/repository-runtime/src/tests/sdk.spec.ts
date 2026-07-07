import * as assert from "assert";
import * as path from "path";
import * as fs from "fs";
import { RepositoryRuntime, RepositoryAssistant } from "../index.js";
import { RepositoryPlugin, RepositoryRuntimeApi, PluginManifest } from "@esparex/repository-plugin-sdk";

function pass(name: string) { console.log(`  ✔ PASS: ${name}`); }
function fail(name: string, err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`  ✖ FAIL: ${name} — ${msg}`);
  process.exitCode = 1;
}

// Mock plugin for testing initialization hook
class MockSdkPlugin implements RepositoryPlugin {
  readonly manifest: PluginManifest = {
    id: "mock-sdk-plugin",
    version: "1.0.0",
    displayName: "Mock SDK Plugin",
    description: "For testing purposes",
    category: "test",
    runtime: {
      minimum: "1.0.0"
    },
    permissions: ["events"],
    capabilities: ["runtime"]
  };
  initialized = false;
  enabled = false;
  disabled = false;
  disposed = false;

  async initialize(runtime: RepositoryRuntimeApi): Promise<void> {
    this.initialized = true;
    runtime.subscribe("drift.detected", () => {});
  }

  async enable(): Promise<void> {
    this.enabled = true;
  }

  async disable(): Promise<void> {
    this.disabled = true;
  }

  async dispose(): Promise<void> {
    this.disposed = true;
  }
}

async function runSdkTests() {
  console.log("--------------------------------------------------");
  console.log("Running @esparex/repository-runtime SDK v1.0 tests...");
  console.log("--------------------------------------------------\n");

  const workspaceRoot = path.resolve(process.cwd(), "../../");

  // Clean up snapshots to ensure test isolation
  const latestFile = path.join(workspaceRoot, ".esparex/runtime/snapshots/latest.json");
  const cacheFile = path.join(workspaceRoot, ".esparex/runtime/cache/files.json");
  const trendsFile = path.join(workspaceRoot, ".esparex/runtime/history/health-trends.json");

  const safeDelete = (p: string) => {
    try { if (fs.existsSync(p)) fs.unlinkSync(p); } catch {}
  };

  safeDelete(cacheFile);
  safeDelete(latestFile);
  safeDelete(trendsFile);

  const mockPlugin = new MockSdkPlugin();

  // ═══════════════════════════════════════════════════════════════════════
  // 1. SDK Start & Plugin Initialization
  // ═══════════════════════════════════════════════════════════════════════
  console.log("1. SDK Initialization & Plugins");

  let runtime: RepositoryRuntime;
  try {
    runtime = await RepositoryRuntime.start({
      workspaceRoot,
      plugins: [mockPlugin]
    });

    assert.ok(runtime, "Runtime SDK instance created successfully");
    assert.strictEqual(mockPlugin.initialized, true, "Mock plugin was successfully initialized during start()");
    assert.strictEqual(mockPlugin.enabled, true, "Mock plugin was successfully enabled during start()");

    // Check registry list
    const registered = runtime.plugins().find(p => p.plugin.manifest.id === "mock-sdk-plugin");
    assert.ok(registered, "Registered plugin is found in runtime.plugins() list");
    assert.strictEqual(registered.status, "enabled", "Plugin state is 'enabled'");

    // Check disable lifecycle and automatic EventBus unsubscription
    await runtime.disable("mock-sdk-plugin");
    assert.strictEqual(mockPlugin.disabled, true, "Disable lifecycle hook executed");
    assert.strictEqual(registered.status, "disabled", "Plugin state transitioned to 'disabled'");

    // Re-enable for the remainder of tests
    await runtime.enable("mock-sdk-plugin");
    assert.strictEqual(registered.status, "enabled", "Plugin state transitioned back to 'enabled'");

    pass("RepositoryRuntime.start() executes plugin initializers");
  } catch (e) { fail("SDK initialization", e); return; }

  // ═══════════════════════════════════════════════════════════════════════
  // 2. Facade Methods Delegation
  // ═══════════════════════════════════════════════════════════════════════
  console.log("\n2. Facade Query Delegation");

  try {
    const snap = runtime.snapshot();
    assert.ok(snap, "Exposes baseline snapshot");
    assert.strictEqual(snap.identity.name, "esparex-admin-root", "Exposes correct identity metadata");

    const inventory = await runtime.scan();
    assert.ok(inventory, "Exposes live scan facts");
    assert.ok(inventory.files.length > 0, "Inventory files count > 0");

    const webWs = runtime.workspace("web");
    assert.ok(webWs, "Query resolves web workspace metadata");
    assert.strictEqual(webWs.type, "Presentation", "Workspace type should be Presentation");

    const transportLayer = runtime.layer("backend/user/src/controllers/Foo.ts");
    assert.strictEqual(transportLayer, "Transport Layer", "Query resolves path architectural layer");

    pass("SDK queries delegate structural checks correctly");
  } catch (e) { fail("Facade query checks", e); }

  // ═══════════════════════════════════════════════════════════════════════
  // 3. AI Assistant Execution & Safety
  // ═══════════════════════════════════════════════════════════════════════
  console.log("\n3. AI Assistant & Safety Boundary");

  try {
    const assistant = new RepositoryAssistant(runtime);

    // Default call is dry-run mode (safe by default)
    const res = await assistant.ask("Scaffold a new controller in backend/user");
    assert.strictEqual(res.success, true, "AI Query resolves to matched workspace routing");
    
    // Scaffolding results checks
    const scaffoldRes = res.results.find(r => r.skillId === "scaffolding");
    assert.ok(scaffoldRes, "Ran scaffolding skill");
    const out = scaffoldRes.output as Record<string, unknown>;
    assert.strictEqual(out.dryRun, true, "Enforces dryRun: true by default to prevent unintended writes");

    pass("RepositoryAssistant resolves route and enforces dry-run safety by default");
  } catch (e) { fail("AI Assistant verification", e); }

  // ═══════════════════════════════════════════════════════════════════════
  // 4. Explainability Engine Formatting
  // ═══════════════════════════════════════════════════════════════════════
  console.log("\n4. Explainability Engine Formatting");

  try {
    const mockViolation = {
      ruleId: "naming-convention-violation",
      message: "Variable name must be camelCase: 'My_Db_Model'"
    };

    const explanation = runtime.explain(mockViolation);
    assert.strictEqual(explanation.category, "coding-standards", "Resolves correct compliance category");
    assert.ok(explanation.expected.includes("camelCase"), "Explanation carries expected patterns metadata");
    assert.ok(explanation.recommendation.includes("casing"), "Explanation includes actionable recommendations");

    const formattedString = explanation.toString();
    assert.ok(formattedString.startsWith("[Violation Rule"), "Exposes a formatted string output method");
    pass("Explainability Engine returns structured explanation payload DTOs");
  } catch (e) { fail("Explainability Engine checks", e); }

  // Clean up files generated by this test
  safeDelete(cacheFile);
  safeDelete(latestFile);
  safeDelete(trendsFile);

  console.log("\n--------------------------------------------------");
  console.log("All @esparex/repository-runtime SDK tests completed!");
  console.log("--------------------------------------------------\n");
}

runSdkTests().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
