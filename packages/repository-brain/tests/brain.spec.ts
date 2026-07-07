import { Brain } from "../src/index.js";
import * as path from "path";

async function runTests() {
  console.log("--------------------------------------------------");
  console.log("Running @esparex/repository-brain Phase 3 tests...");
  console.log("--------------------------------------------------");

  const workspaceRoot = path.resolve(process.cwd(), "../../");
  const brain = await Brain.load({ workspaceRoot });

  // 1. Snapshot metadata validation
  const metadata = brain.snapshot.metadata;
  console.log("Schema version:", metadata.schemaVersion);
  console.log("Generated at timestamp:", metadata.generatedAt);
  console.assert(metadata.schemaVersion === "1.0", "Metadata SchemaVersion mismatch");
  console.assert(metadata.snapshotHash !== "", "snapshotHash must be populated");

  // 1b. Repository context (branch/root live here, not in metadata)
  const repo = brain.snapshot.repository;
  console.log("Branch name:", repo.branch);
  console.log("Repository root:", repo.root);
  console.assert(repo.root !== "", "repository.root must be populated");
  console.assert(repo.branch !== "", "repository.branch must be populated");
  console.assert(Array.isArray(repo.files), "repository.files must be an array");

  // 2. Identity assertions
  const identity = brain.snapshot.identity;
  console.log("Identity name:", identity.name);
  console.assert(identity.name === "esparex-admin-root", "Identity name mismatch");
  console.assert(identity.workspaceType === "Workspaces Monorepo", "Workspace type mismatch");

  // 3. Technology stack assertions
  const tech = brain.snapshot.technology;
  console.log("Express version:", tech.express);
  console.log("Next version:", tech.next);
  console.log("Node version:", tech.node);
  console.assert(tech.express !== "unknown", "Express version should be resolved");
  console.assert(tech.next !== "unknown", "Next.js version should be resolved");

  // 4. Workspaces & structure queries
  const webWorkspace = brain.query.workspace("web");
  console.assert(webWorkspace !== undefined, "Web workspace query failed");
  console.assert(webWorkspace?.type === "Presentation", "Web workspace type should be Presentation");

  // 5. Architecture queries
  const arch = brain.snapshot.architecture;
  console.log("Layers configured:", arch.layers);
  console.assert(arch.layers.includes("Presentation"), "Missing Presentation layer");

  const layer = brain.query.layer("backend/user/src/controllers/ListingController.ts");
  console.log("Resolved layer name:", layer);
  console.assert(layer === "Transport Layer", "Layer resolution path mismatch");

  // 6. Policy queries
  console.assert(brain.query.policy("R-001") === true, "Missing policy R-001");
  console.assert(brain.query.policy("R-NON_EXISTENT") === false, "Found non-existent policy");

  // 7. Vocabulary queries
  const vocabDef = brain.query.vocabulary("Transport");
  console.log("Vocabulary 'Transport' definition:", vocabDef);
  console.assert(vocabDef !== undefined, "Transport glossary lookup failed");

  // 8. Immutability checks
  try {
    (brain.snapshot as any).identity.name = "hacked";
    console.assert(false, "Snapshot mutation should have thrown Error");
  } catch {
    console.log("Mutating snapshot correctly threw Error (deeply frozen).");
  }

  console.log("\nAll @esparex/repository-brain tests completed successfully!");
}

runTests().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
