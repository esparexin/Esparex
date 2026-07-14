/**
 * filesystem.ts
 * -------------
 * Core filesystem utilities for the Esparex architecture platform.
 * No external dependencies — uses only Node.js built-ins.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

export interface FileEntry {
    absolutePath: string;
    relativePath: string;
    extension: string;
}

const EXCLUDED_DIRS = new Set(['node_modules', 'dist', '.next', 'coverage', '.git']);
const TS_EXTENSIONS = new Set(['.ts', '.tsx']);

/**
 * Recursively walk a directory and collect all files matching the given
 * extension filter. Skips well-known build/dependency directories.
 */
export function walkDirectory(
    dir: string,
    filter: (entry: fs.Dirent) => boolean = () => true,
    root: string = dir
): FileEntry[] {
    if (!fs.existsSync(dir)) return [];

    const results: FileEntry[] = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        if (EXCLUDED_DIRS.has(entry.name)) continue;

        const absolutePath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            results.push(...walkDirectory(absolutePath, filter, root));
        } else if (entry.isFile() && filter(entry)) {
            results.push({
                absolutePath,
                relativePath: toUnixPath(path.relative(root, absolutePath)),
                extension: path.extname(entry.name),
            });
        }
    }

    return results;
}

/**
 * Walk a directory and return only TypeScript source files.
 */
export function walkTypeScriptFiles(dir: string, root?: string): FileEntry[] {
    return walkDirectory(
        dir,
        (entry) => TS_EXTENSIONS.has(path.extname(entry.name)),
        root ?? dir
    );
}

/**
 * Discover all bounded context directories directly under a `domains/` path.
 * Returns the absolute path of each domain folder.
 */
export function findDomains(domainsPath: string): string[] {
    if (!fs.existsSync(domainsPath)) return [];

    return fs
        .readdirSync(domainsPath, { withFileTypes: true })
        .filter((entry) => entry.isDirectory() && !EXCLUDED_DIRS.has(entry.name))
        .map((entry) => path.join(domainsPath, entry.name));
}

/**
 * Resolve the path to a domain's public barrel (`index.ts`).
 */
export function getDomainBarrel(domainPath: string): string {
    return path.join(domainPath, 'index.ts');
}

/**
 * Resolve the path to a domain's manifest file.
 */
export function getDomainManifestPath(domainPath: string): string {
    return path.join(domainPath, 'manifest.yaml');
}

/**
 * Check whether a path exists on disk.
 */
export function pathExists(targetPath: string): boolean {
    return fs.existsSync(targetPath);
}

/**
 * Read a file as a UTF-8 string. Returns null if the file does not exist.
 */
export function readFile(filePath: string): string | null {
    if (!fs.existsSync(filePath)) return null;
    return fs.readFileSync(filePath, 'utf-8');
}

/**
 * Write content to a file, creating parent directories as needed.
 */
export function writeFile(filePath: string, content: string): void {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, content, 'utf-8');
}

/**
 * Create a directory and all missing parents.
 */
export function ensureDir(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

/**
 * Normalize path separators to forward slashes for cross-platform consistency.
 */
export function toUnixPath(input: string): string {
    return input.replaceAll(path.sep, '/');
}

/**
 * Return the name of the domain from its absolute directory path.
 */
export function getDomainName(domainPath: string): string {
    return path.basename(domainPath);
}

/**
 * Count the number of TypeScript files in a directory tree (excluding
 * test and spec files if requested).
 */
export function countFiles(dir: string, includeTests = false): number {
    return walkTypeScriptFiles(dir)
        .filter((f) => includeTests || !/\.(spec|test)\.tsx?$/.test(f.absolutePath))
        .length;
}

/**
 * List immediate subdirectory names within a directory.
 */
export function listSubdirectories(dir: string): string[] {
    if (!fs.existsSync(dir)) return [];
    return fs
        .readdirSync(dir, { withFileTypes: true })
        .filter((e) => e.isDirectory() && !EXCLUDED_DIRS.has(e.name))
        .map((e) => e.name);
}
