import { RepositoryScanner } from "../src/index.js";
import * as path from "path";

async function runTests() {
  console.log("--------------------------------------------------");
  console.log("Running @esparex/repository-scanner tests...");
  console.log("--------------------------------------------------");

  const workspaceRoot = path.resolve(process.cwd(), "../../");
  const scanner = new RepositoryScanner({ workspaceRoot });
  const inventory = await scanner.scan();

  console.log("Identity name:", inventory.identity.name);
  console.assert(inventory.identity.name === "esparex-admin-root", "Root workspace name check failed");
  
  console.log("Workspaces list:", inventory.identity.workspaces);
  console.assert(inventory.identity.workspaces.includes("core"), "Missing core workspace");
  console.assert(inventory.identity.workspaces.includes("shared"), "Missing shared workspace");

  console.log("Git branch:", inventory.git.branch);
  console.log("Files found count:", inventory.files.length);
  console.assert(inventory.files.length > 0, "Files count must be greater than zero");

  // Immutability Check
  try {
    (inventory as any).git.branch = "altered";
    console.assert(false, "Inventory mutation should have thrown Error");
  } catch {
    console.log("Mutating inventory correctly threw Error (Object is frozen).");
  }

  console.log("\nAll @esparex/repository-scanner tests completed successfully!");
}

runTests().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
