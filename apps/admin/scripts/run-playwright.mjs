import { spawn } from "node:child_process";

const rawArgs = process.argv.slice(2);
const ciModeFlag = "--ci-mode";
const ciMode = rawArgs.includes(ciModeFlag);
const forwardedArgs = rawArgs.filter((arg) => arg !== ciModeFlag);

const env = { ...process.env };
if (ciMode) {
  env.CI = env.CI || "1";
}

const playwrightBin = process.platform === "win32" ? "playwright.cmd" : "playwright";
const child = spawn(playwrightBin, ["test", ...forwardedArgs], {
  stdio: "inherit",
  env,
  shell: false,
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});

