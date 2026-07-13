/**
 * scanner.ts
 * ----------
 * AST-based import/export analyser using the TypeScript Compiler API.
 *
 * Uses ts.createSourceFile() to parse TypeScript source into an AST and
 * walks it to extract import and export declarations. This approach correctly
 * handles:
 *   - Multi-line imports
 *   - type-only imports (`import type { ... }`)
 *   - re-exports (`export * from '...'`)
 *   - Path aliases
 *
 * No regex heuristics are used.
 */

import ts from 'typescript';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface ImportRecord {
    /** The bare module specifier string, e.g. `'../ports/CategoryRepositoryPort'` */
    moduleSpecifier: string;
    /** True when the import is `import type { ... }` */
    isTypeOnly: boolean;
    /** 1-based line number of the import statement */
    line: number;
}

export interface ExportRecord {
    /** The module the re-export targets, e.g. `'./domain/policies/CatalogResolutionPolicy'` */
    moduleSpecifier: string | null;
    /** True when the export is `export type { ... }` */
    isTypeOnly: boolean;
    /** 1-based line number */
    line: number;
}

export interface ScanResult {
    filePath: string;
    imports: ImportRecord[];
    exports: ExportRecord[];
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function getLine(sourceFile: ts.SourceFile, node: ts.Node): number {
    const { line } = ts.getLineAndCharacterOfPosition(sourceFile, node.getStart(sourceFile));
    return line + 1; // convert to 1-based
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Parse a TypeScript/TSX source file and extract all import and export
 * declarations from the AST.
 *
 * @param filePath - The path used to construct the SourceFile (for diagnostics).
 * @param content  - The raw file content to parse.
 */
export function scanFile(filePath: string, content: string): ScanResult {
    const sourceFile = ts.createSourceFile(
        filePath,
        content,
        ts.ScriptTarget.Latest,
        /* setParentNodes */ true,
        filePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
    );

    const imports: ImportRecord[] = [];
    const exports: ExportRecord[] = [];

    function visit(node: ts.Node): void {
        // import { ... } from '...'
        // import type { ... } from '...'
        // import '...'
        if (ts.isImportDeclaration(node)) {
            const specifier = (node.moduleSpecifier as ts.StringLiteral).text;
            imports.push({
                moduleSpecifier: specifier,
                isTypeOnly: !!node.importClause?.isTypeOnly,
                line: getLine(sourceFile, node),
            });
        }

        // export { ... } from '...'
        // export * from '...'
        // export type { ... } from '...'
        if (ts.isExportDeclaration(node)) {
            const specifier = node.moduleSpecifier
                ? (node.moduleSpecifier as ts.StringLiteral).text
                : null;
            exports.push({
                moduleSpecifier: specifier,
                isTypeOnly: !!node.isTypeOnly,
                line: getLine(sourceFile, node),
            });
        }

        ts.forEachChild(node, visit);
    }

    visit(sourceFile);

    return { filePath, imports, exports };
}

/**
 * Return only the non-type-only imports from a scan result.
 * Useful when checking for value imports that pull in infrastructure.
 */
export function valueImportsOnly(result: ScanResult): ImportRecord[] {
    return result.imports.filter((i) => !i.isTypeOnly);
}

/**
 * Check whether a scanned file contains any import of a given module
 * (by partial path match). Type-only imports are excluded by default.
 */
export function importsModule(
    result: ScanResult,
    modulePattern: string | RegExp,
    includeTypeOnly = false
): ImportRecord[] {
    const candidates = includeTypeOnly ? result.imports : valueImportsOnly(result);
    return candidates.filter((i) =>
        typeof modulePattern === 'string'
            ? i.moduleSpecifier.includes(modulePattern)
            : modulePattern.test(i.moduleSpecifier)
    );
}

/**
 * Detect whether a file imports directly from a deep internal domain path
 * instead of going through the public barrel. Returns the offending imports.
 *
 * A deep import is any import whose specifier targets a sub-directory of a
 * domain that is NOT the root `index` barrel, e.g.:
 *   `../../domains/catalog/domain/policies/CatalogResolutionPolicy`
 *
 * @param result      - Scan result for the file being checked.
 * @param domainsRoot - The repository-relative prefix for the domains directory.
 *                      e.g. `'core/src/domains'`
 */
export function findDeepDomainImports(
    result: ScanResult,
    domainsRoot: string
): ImportRecord[] {
    // Matches any path that enters a domain sub-directory (not its root barrel)
    const deepPattern = new RegExp(
        `${domainsRoot.replace(/\//g, '\\/')}\/[^/]+\/(domain|ports|application)\/`
    );
    return valueImportsOnly(result).filter((i) => deepPattern.test(i.moduleSpecifier));
}

/**
 * Check for forbidden infrastructure imports inside domain/port code.
 * Returns any non-type-only imports of the supplied banned modules.
 */
export function findForbiddenImports(
    result: ScanResult,
    bannedModules: string[]
): ImportRecord[] {
    return valueImportsOnly(result).filter((i) =>
        bannedModules.some((banned) => i.moduleSpecifier.includes(banned))
    );
}
