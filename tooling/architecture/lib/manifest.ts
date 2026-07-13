/**
 * manifest.ts
 * -----------
 * Loads and validates a domain's `manifest.yaml` against the canonical
 * JSON Schema (`manifest.schema.json`).
 *
 * Responsibilities:
 *   1. Load YAML from disk.
 *   2. Validate the parsed object against the schema.
 *   3. Return a strongly-typed `DomainManifest` object, or a structured error.
 *
 * Validation is entirely declarative — no manual field checking here.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import yaml from 'js-yaml';
import Ajv from 'ajv';

// ---------------------------------------------------------------------------
// Schema loader
// ---------------------------------------------------------------------------

// __dirname is available in CommonJS / tsx CJS mode.
// The schema file sits one level above the lib/ directory.
const SCHEMA_PATH = path.join(__dirname, '..', 'manifest.schema.json');
const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf-8'));
const ajv = new Ajv({ allErrors: true, strict: false });
const validateManifest = ajv.compile(schema);

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface PublicApi {
    facades: string[];
    ports: string[];
}

export interface DomainManifest {
    id: string;
    name: string;
    owner: string;
    business_owner?: string;
    technical_owner?: string;
    maintainer?: string;
    maturity: 'experimental' | 'growing' | 'stable' | 'strategic';
    visibility?: 'public' | 'private';
    stability: 'experimental' | 'stable';
    criticality: 'low' | 'medium' | 'high' | 'mission-critical';
    sla: 'tier-1' | 'tier-2' | 'tier-3';
    since?: string;
    layer: 'domain' | 'application' | 'infrastructure' | 'adapter';
    /** When `true`, this domain is the reference implementation for the architecture. */
    reference?: boolean;
    depends_on: string[];
    public_api: PublicApi;
}

export type ManifestResult =
    | { ok: true; manifest: DomainManifest }
    | { ok: false; errors: string[] };

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Load and validate a `manifest.yaml` file from the given path.
 *
 * @param manifestPath - Absolute path to the `manifest.yaml` file.
 * @returns A discriminated union — check `result.ok` before accessing `result.manifest`.
 */
export function loadManifest(manifestPath: string): ManifestResult {
    if (!fs.existsSync(manifestPath)) {
        return {
            ok: false,
            errors: [`manifest.yaml not found at: ${manifestPath}`],
        };
    }

    let parsed: unknown;
    try {
        const raw = fs.readFileSync(manifestPath, 'utf-8');
        parsed = yaml.load(raw);
    } catch (e) {
        return {
            ok: false,
            errors: [`Failed to parse YAML: ${(e as Error).message}`],
        };
    }

    const valid = validateManifest(parsed);
    if (!valid) {
        const errors = (validateManifest.errors ?? []).map(
            (err) => `${err.instancePath || '(root)'}: ${err.message}`
        );
        return { ok: false, errors };
    }

    // Normalise optional arrays so callers never need to null-check.
    const raw = parsed as Record<string, unknown>;
    const publicApi = (raw['public_api'] as Record<string, unknown> | undefined) ?? {};
    const manifest: DomainManifest = {
        ...(raw as Omit<DomainManifest, 'depends_on' | 'public_api'>),
        depends_on: (raw['depends_on'] as string[] | undefined) ?? [],
        public_api: {
            facades: (publicApi['facades'] as string[] | undefined) ?? [],
            ports: (publicApi['ports'] as string[] | undefined) ?? [],
        },
    };

    return { ok: true, manifest };
}

/**
 * Convenience wrapper — load the manifest from the domain's root directory.
 *
 * @param domainPath - Absolute path to the bounded context root directory.
 */
export function loadDomainManifest(domainPath: string): ManifestResult {
    return loadManifest(path.join(domainPath, 'manifest.yaml'));
}

/**
 * Validate cross-domain dependency references given a set of known domain ids.
 * Returns an array of error strings (empty if all references are valid).
 */
export function validateDependencyReferences(
    manifest: DomainManifest,
    knownDomainIds: ReadonlySet<string>,
    allowedExternals: string[] = ['shared', 'core/shared-kernel']
): string[] {
    const errors: string[] = [];

    for (const dep of manifest.depends_on) {
        if (allowedExternals.includes(dep)) continue;
        if (!knownDomainIds.has(dep)) {
            errors.push(
                `[${manifest.id}] depends_on references unknown domain: "${dep}"`
            );
        }
    }

    return errors;
}

/**
 * Detect circular dependency chains between domains.
 * Returns an array of cycle descriptions (empty if none).
 *
 * @param manifests - All loaded manifests keyed by domain id.
 */
export function detectCircularDependencies(
    manifests: Map<string, DomainManifest>
): string[] {
    const cycles: string[] = [];
    const visited = new Set<string>();
    const stack = new Set<string>();

    function dfs(id: string, ancestors: string[]): void {
        if (stack.has(id)) {
            const cycleStart = ancestors.indexOf(id);
            cycles.push([...ancestors.slice(cycleStart), id].join(' → '));
            return;
        }
        if (visited.has(id)) return;

        visited.add(id);
        stack.add(id);

        const manifest = manifests.get(id);
        if (manifest) {
            for (const dep of manifest.depends_on) {
                if (manifests.has(dep)) {
                    dfs(dep, [...ancestors, id]);
                }
            }
        }

        stack.delete(id);
    }

    for (const id of manifests.keys()) {
        dfs(id, []);
    }

    return cycles;
}
