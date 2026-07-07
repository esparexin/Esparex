import * as fs from "fs";
import * as path from "path";

export function readJsonFile(workspaceRoot: string, relativePath: string): any {
  const fullPath = path.join(workspaceRoot, relativePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`File not found at ${fullPath}`);
  }
  const content = fs.readFileSync(fullPath, "utf-8");
  return JSON.parse(content);
}

export function readPackageJson(workspaceRoot: string, relativePath: string): any {
  try {
    return readJsonFile(workspaceRoot, relativePath);
  } catch {
    return {};
  }
}
