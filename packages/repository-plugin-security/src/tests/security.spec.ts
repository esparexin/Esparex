import * as assert from "assert";
import { SecurityPlugin, LocalVulnerabilityProvider } from "../index.js";

function pass(name: string) { console.log(`  ✔ PASS: ${name}`); }
function fail(name: string, err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`  ✖ FAIL: ${name} — ${msg}`);
  process.exitCode = 1;
}

async function runTests() {
  console.log("--------------------------------------------------");
  console.log("Running @esparex/repository-plugin-security tests...");
  console.log("--------------------------------------------------\n");

  const provider = new LocalVulnerabilityProvider();
  const plugin = new SecurityPlugin(provider);

  // Mock API
  const mockApi: any = {
    snapshot: () => ({
      technology: {
        lodash: "4.15.0",      // vulnerable (limit is <4.17.21)
        express: "4.20.0",     // secure (limit is <4.19.2)
        react: "^18.2.0"
      }
    }),
    subscribe: () => () => {}
  };

  try {
    await plugin.initialize(mockApi);
    const findings = await plugin.audit();

    assert.strictEqual(findings.length, 1, "Should flag exactly one vulnerability");
    assert.strictEqual(findings[0].packageName, "lodash", "Vulnerability is in lodash");
    assert.strictEqual(findings[0].severity, "error", "Lodash vulnerability carries 'error' severity");

    pass("SecurityPlugin audits snapshot package vulnerabilities correctly");
  } catch (e) {
    fail("SecurityPlugin audit check", e);
  }

  console.log("\n--------------------------------------------------");
  console.log("All @esparex/repository-plugin-security tests passed!");
  console.log("--------------------------------------------------\n");
}

runTests().catch(err => {
  console.error("Test execution failure:", err);
  process.exit(1);
});
