/**
 * registry.ts
 * -----------
 * Scans all domain manifests and the adapters directory to produce a rich
 * per-domain registry.
 *
 * Writes output to .tooling/registry.json (git-ignored).
 * Exports buildRegistry() for consumption by the metrics and report pipelines.
 */

import * as path from 'node:path';
import * as fs from 'node:fs';
import { loadDomainManifest } from './lib/manifest';
import { walkTypeScriptFiles, ensureDir, writeFile } from './lib/filesystem';
import { DOMAINS_PATH, ADAPTERS_PATH, TOOLING_DIR } from './lib/constants';
import { Registry, RegistryEntry, DomainInfo } from './types';
import { discoverDomains } from './verify-architecture';

// ---------------------------------------------------------------------------
// Counting helpers
// ---------------------------------------------------------------------------

function countTsFiles(dir: string): number {
    if (!fs.existsSync(dir)) return 0;
    return walkTypeScriptFiles(dir)
        .filter((f) => !/\.(spec|test)\.tsx?$/.test(f.absolutePath))
        .length;
}

function countPortFiles(domainPath: string): number {
    return countTsFiles(path.join(domainPath, 'ports'));
}

function countAdapterFiles(domainId: string, adaptersPath: string): number {
    const adapterDir = path.join(adaptersPath, 'outbound', 'database', domainId);
    return countTsFiles(adapterDir);
}

function countSubDir(domainPath: string, layer: string, subDir: string): number {
    return countTsFiles(path.join(domainPath, layer, subDir));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function buildRegistry(domains: DomainInfo[], adaptersPath: string): Registry {
    const registry: Registry = {};

    // First pass: load all manifests
    const manifests = new Map(
        domains.map((d) => [d.id, loadDomainManifest(d.path)])
    );

    // Build dependents map
    const dependentsMap = new Map<string, string[]>(domains.map((d) => [d.id, []]));
    for (const [domainId, result] of manifests) {
        if (!result.ok) continue;
        for (const dep of result.manifest.depends_on) {
            if (dependentsMap.has(dep)) {
                dependentsMap.get(dep)!.push(domainId);
            }
        }
    }

    // Second pass: build entries
    for (const domain of domains) {
        const manifestResult = manifests.get(domain.id);

        const entry: RegistryEntry = {
            owner: 'unknown',
            stability: 'experimental',
            maturity: 'experimental',
            reference: false,
            dependencies: [],
            dependents: dependentsMap.get(domain.id) ?? [],
            ports: countPortFiles(domain.path),
            adapters: countAdapterFiles(domain.id, adaptersPath),
            entities: countSubDir(domain.path, 'domain', 'entities'),
            services: countSubDir(domain.path, 'domain', 'services'),
            policies: countSubDir(domain.path, 'domain', 'policies'),
            events: countSubDir(domain.path, 'domain', 'events'),
        };

        if (manifestResult?.ok) {
            const m = manifestResult.manifest;
            entry.owner = m.owner;
            entry.stability = m.stability;
            entry.maturity = m.maturity;
            entry.reference = m.reference ?? false;
            entry.dependencies = m.depends_on;
        }

        registry[domain.id] = entry;
    }

    return registry;
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

export async function generateRegistry(): Promise<Registry> {
    const domains = discoverDomains(DOMAINS_PATH);
    const registry = buildRegistry(domains, ADAPTERS_PATH);

    ensureDir(TOOLING_DIR);
    writeFile(
        path.join(TOOLING_DIR, 'registry.json'),
        JSON.stringify(registry, null, 2)
    );

    return registry;
}

if (require.main === module) {
    generateRegistry()
        .then((reg) => {
            const count = Object.keys(reg).length;
            console.log(`Registry generated: ${count} domain(s) → .tooling/registry.json`);
        })
        .catch((err) => {
            console.error('Registry generation failed:', err);
            process.exit(1);
        });
}
