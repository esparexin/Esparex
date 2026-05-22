#!/usr/bin/env node
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

const ROOT = new URL("..", import.meta.url);
const isTruthy = (value) => ["1", "true", "yes", "on"].includes(String(value || "").toLowerCase());

const config = {
  startBackend: isTruthy(process.env.E2E_START_BACKEND),
  startMocks: process.env.E2E_START_MOCKS !== "false",
  seedFixtures: isTruthy(process.env.E2E_SEED_FIXTURES),
  includeAdmin: process.env.E2E_INCLUDE_ADMIN !== "false",
  includeWeb: process.env.E2E_INCLUDE_WEB !== "false",
  fullWebSuite: isTruthy(process.env.E2E_FULL_WEB_SUITE),
  backendHealthUrl: process.env.E2E_BACKEND_HEALTH_URL || "http://127.0.0.1:5001/api/v1/health",
  backendApiUrl: process.env.E2E_BACKEND_API_URL || "http://127.0.0.1:5001/api/v1",
  frontendUrl: process.env.E2E_FRONTEND_URL || "http://127.0.0.1:3000",
  adminUrl: process.env.E2E_ADMIN_URL || "http://127.0.0.1:3001",
};

const children = new Set();

function npmCmd() {
  return process.platform === "win32" ? "npm.cmd" : "npm";
}

function spawnCommand(command, args, options = {}) {
  const child = spawn(command, args, {
    cwd: ROOT,
    stdio: options.capture ? ["ignore", "pipe", "pipe"] : "inherit",
    env: { ...process.env, ...options.env },
    shell: false,
  });
  children.add(child);
  child.on("exit", () => children.delete(child));
  return child;
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawnCommand(command, args, options);
    let output = "";
    if (options.capture) {
      child.stdout.on("data", (chunk) => { output += chunk.toString(); });
      child.stderr.on("data", (chunk) => { output += chunk.toString(); });
    }
    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (signal) {
        reject(new Error(`${command} ${args.join(" ")} exited by ${signal}`));
        return;
      }
      if (code === 0) {
        resolve(output);
        return;
      }
      reject(new Error(`${command} ${args.join(" ")} failed with exit code ${code}${output ? `\n${output}` : ""}`));
    });
  });
}

async function waitForHttp(url, label, timeoutMs = 120_000) {
  const deadline = Date.now() + timeoutMs;
  let lastError = "";
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (response.ok) return;
      lastError = `${response.status} ${response.statusText}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await sleep(1_000);
  }
  throw new Error(`${label} did not become ready at ${url}: ${lastError}`);
}

async function assertRedisIfConfigured() {
  if (!process.env.REDIS_URL && !process.env.REDIS_HOST) {
    console.log("[e2e] Redis readiness skipped: no REDIS_URL/REDIS_HOST configured.");
    return;
  }
  await run(npmCmd(), ["exec", "--", "redis-cli", "ping"], { capture: true });
  console.log("[e2e] Redis readiness passed.");
}

async function startBackendIfRequested() {
  if (!config.startBackend) {
    if (!config.startMocks) {
      console.log("[e2e] Backend startup skipped; tests will use Playwright mocks unless a backend is already running.");
      return null;
    }

    console.log("[e2e] Starting local mock API.");
    const child = spawnCommand(process.execPath, ["scripts/e2e-mock-api.mjs"], {
      env: { E2E_MOCK_API_PORT: "5001" },
    });
    await waitForHttp(config.backendHealthUrl, "mock API");
    console.log("[e2e] Mock API ready.");
    return child;
  }

  console.log("[e2e] Starting backend.");
  const child = spawnCommand(npmCmd(), ["run", "dev", "-w", "@esparex/backend-user"], {
    env: {
      NODE_ENV: "test",
      USE_ADMIN_CATALOG_READS: process.env.USE_ADMIN_CATALOG_READS || "false",
    },
  });
  await waitForHttp(config.backendHealthUrl, "backend");
  console.log("[e2e] Backend ready.");
  return child;
}

async function seedFixturesIfRequested() {
  if (!config.seedFixtures) {
    console.log("[e2e] Fixture seeding skipped. Set E2E_SEED_FIXTURES=true for live backend replay fixtures.");
    return;
  }
  console.log("[e2e] Seeding smoke fixtures.");
  await run(npmCmd(), ["run", "smoke:fixtures", "-w", "@esparex/backend-user"], {
    env: { NODE_ENV: "test" },
  });
}

async function runWebPass(useAdminCatalogReads) {
  console.log(`[e2e] Running web Playwright pass with USE_ADMIN_CATALOG_READS=${useAdminCatalogReads}.`);
  const webArgs = process.env.E2E_WEB_ARGS
    ? process.env.E2E_WEB_ARGS.split(/\s+/).filter(Boolean)
    : config.fullWebSuite
      ? []
      : [
          "tests/post-ad-progressive.spec.ts",
          "tests/auth-screenshots.spec.ts",
          "tests/ui-governance.spec.ts",
          "--project=chromium",
        ];

  if (!config.fullWebSuite && !process.env.E2E_WEB_ARGS) {
    console.log("[e2e] Using critical deterministic web suite. Set E2E_FULL_WEB_SUITE=true for all web Playwright specs.");
  }

  await run(npmCmd(), ["run", "e2e", "-w", "@esparex/apps-web", "--", ...webArgs], {
    env: {
      CI: process.env.CI || "1",
      USE_ADMIN_CATALOG_READS: useAdminCatalogReads,
      BYPASS_POST_AD_QUOTA_CHECK: "true",
      NEXT_PUBLIC_API_URL: `${config.frontendUrl.replace(/\/$/, "")}/api/v1`,
      BACKEND_INTERNAL_URL: config.backendApiUrl.replace(/\/api\/v1\/?$/, ""),
      SMOKE_FRONTEND_URL: config.frontendUrl,
      SMOKE_API_BASE_URL: config.backendApiUrl,
    },
  });
}

async function runAdminPass() {
  console.log("[e2e] Running admin Playwright pass.");
  await run(npmCmd(), ["run", "e2e", "-w", "@esparex/apps-admin", "--", "--ci-mode"], {
    env: {
      CI: process.env.CI || "1",
      ADMIN_FRONTEND_BASE_URL: config.adminUrl,
      NEXT_PUBLIC_ADMIN_API_URL: "/api/v1/admin",
    },
  });
}

async function main() {
  console.log("[e2e] Deterministic orchestration starting.");
  await assertRedisIfConfigured();
  const backend = await startBackendIfRequested();
  try {
    await seedFixturesIfRequested();
    if (config.includeWeb) {
      await runWebPass("false");
      await runWebPass("true");
    }
    if (config.includeAdmin) {
      await runAdminPass();
    }
    console.log("[e2e] Deterministic orchestration complete.");
  } finally {
    if (backend && !backend.killed) {
      backend.kill("SIGTERM");
      await sleep(1_000);
      if (!backend.killed) backend.kill("SIGKILL");
    }
  }
}

process.on("SIGINT", () => {
  for (const child of children) child.kill("SIGTERM");
  process.exit(130);
});

process.on("SIGTERM", () => {
  for (const child of children) child.kill("SIGTERM");
  process.exit(143);
});

main().catch((error) => {
  console.error("[e2e] failed:", error instanceof Error ? error.message : error);
  for (const child of children) child.kill("SIGTERM");
  process.exit(1);
});
