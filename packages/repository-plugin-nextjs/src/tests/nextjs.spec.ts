import * as assert from "assert";
import { NextJsPlugin } from "../index.js";

function pass(name: string) { console.log(`  ✔ PASS: ${name}`); }
function fail(name: string, err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`  ✖ FAIL: ${name} — ${msg}`);
  process.exitCode = 1;
}

async function runTests() {
  console.log("--------------------------------------------------");
  console.log("Running @esparex/repository-plugin-nextjs tests...");
  console.log("--------------------------------------------------\n");

  const plugin = new NextJsPlugin();

  // Mock API
  const mockApi: any = {
    snapshot: () => ({
      technology: {
        next: "^16.2.4"
      },
      repository: {
        files: [
          "apps/web/app/dashboard/page.tsx",
          "apps/web/app/dashboard/button.tsx"
        ]
      }
    })
  };

  try {
    await plugin.initialize(mockApi);
    const issues = await plugin.auditRouting();

    assert.strictEqual(issues.length, 1, "Should flag exactly routing component issue");
    assert.ok(issues[0].includes("button.tsx"), "Flags button.tsx placing location deviation");

    pass("NextJsPlugin audits workspace app routing layout conventions correctly");
  } catch (e) {
    fail("NextJsPlugin routing check", e);
  }

  console.log("\n--------------------------------------------------");
  console.log("All @esparex/repository-plugin-nextjs tests passed!");
  console.log("--------------------------------------------------\n");
}

runTests().catch(err => {
  console.error("Test execution failure:", err);
  process.exit(1);
});
