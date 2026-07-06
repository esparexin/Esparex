import { spawnSync, SpawnSyncOptions } from "child_process";
import * as path from "path";

export interface ExecResult {
  status: number | null;
  stdout: string;
  stderr: string;
  error?: Error;
}

export function runSpawn(cmd: string, args: string[], options: SpawnSyncOptions = {}): ExecResult {
  const isWindows = process.platform === "win32";
  // Resolve cmd path if inside node_modules/.bin on Windows
  let command = cmd;
  let cmdArgs = args;
  
  if (isWindows && cmd.includes(".bin")) {
    command = "cmd.exe";
    cmdArgs = ["/c", cmd.replace(/\//g, "\\"), ...args];
  }

  const result = spawnSync(command, cmdArgs, {
    encoding: "utf8",
    ...options
  });

  return {
    status: result.status,
    stdout: result.stdout ? String(result.stdout) : "",
    stderr: result.stderr ? String(result.stderr) : "",
    error: result.error
  };
}

export function getBinPath(workspaceRoot: string, binName: string): string {
  const isWindows = process.platform === "win32";
  const binSuffix = isWindows ? ".cmd" : "";
  return path.join(workspaceRoot, "node_modules", ".bin", `${binName}${binSuffix}`);
}
