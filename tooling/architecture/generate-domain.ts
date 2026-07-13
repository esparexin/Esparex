#!/usr/bin/env node
/**
 * generate-domain.ts
 * ------------------
 * Scaffolds a new bounded context under core/src/domains/<name>/.
 *
 * Usage:
 *   npm run generate:domain -- billing
 *   npm run generate:domain -- --name billing --owner billing-team --stability experimental
 *   npm run generate:domain -- --name billing --template event-sourced
 *
 * What it creates (minimal — no empty noise folders):
 *   core/src/domains/<name>/
 *   ├── application/          (empty dir held by .gitkeep)
 *   ├── domain/               (empty dir held by .gitkeep)
 *   ├── ports/                (empty dir held by .gitkeep)
 *   ├── __tests__/            (empty dir held by .gitkeep)
 *   ├── manifest.yaml         (populated from CLI flags)
 *   ├── index.ts              (empty barrel with guidance comments)
 *   └── README.md             (Purpose / Owner / Dependencies)
 *
 * Sub-folders like entities/, services/, policies/, events/ are NOT created
 * upfront. Teams add them when they are genuinely needed.
 *
 * The --template flag selects a template set under tooling/architecture/templates/.
 * Only "default" exists now; the structure supports future sets (event-sourced, crud).
 */

import * as path from 'node:path';
import * as fs from 'node:fs';
import { ensureDir, pathExists, writeFile } from './lib/filesystem';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GeneratorOptions {
    name: string;
    owner: string;
    stability: 'experimental' | 'stable';
    template: string;
}

// ---------------------------------------------------------------------------
// Argument parsing
// ---------------------------------------------------------------------------

function parseArgs(argv: string[]): GeneratorOptions {
    const args = argv.slice(2); // strip node + script path

    // Positional shorthand: generate:domain billing
    const positional = args.find((a) => !a.startsWith('--'));

    function flag(name: string, fallback = ''): string {
        const idx = args.indexOf(`--${name}`);
        return idx !== -1 && args[idx + 1] ? args[idx + 1] : fallback;
    }

    const name = flag('name') || positional || '';
    if (!name) {
        console.error('❌  Missing domain name.');
        console.error('    Usage: npm run generate:domain -- <name>');
        console.error('           npm run generate:domain -- --name <name> --owner <owner> --stability experimental');
        process.exit(1);
    }

    const rawStability = flag('stability', 'experimental');
    if (rawStability !== 'experimental' && rawStability !== 'stable') {
        console.error(`❌  Invalid --stability "${rawStability}". Must be "experimental" or "stable".`);
        process.exit(1);
    }

    return {
        name: toKebabCase(name),
        owner: flag('owner', 'platform'),
        stability: rawStability as 'experimental' | 'stable',
        template: flag('template', 'default'),
    };
}

// ---------------------------------------------------------------------------
// String helpers
// ---------------------------------------------------------------------------

function toKebabCase(str: string): string {
    return str
        .replace(/([A-Z])/g, '-$1')
        .toLowerCase()
        .replace(/^-/, '')
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-');
}

function toPascalCase(str: string): string {
    return str
        .split(/[-_\s]+/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join('');
}

/** Replace {{placeholder}} tokens in a template string. */
function render(template: string, vars: Record<string, string>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}

// ---------------------------------------------------------------------------
// Template loader
// ---------------------------------------------------------------------------

function loadTemplate(templateSet: string, fileName: string): string {
    const templatePath = path.join(
        __dirname,
        'templates',
        templateSet,
        fileName
    );
    if (!fs.existsSync(templatePath)) {
        // Fall back to default template set if the custom set lacks this file.
        const fallback = path.join(__dirname, 'templates', 'default', fileName);
        if (!fs.existsSync(fallback)) {
            throw new Error(
                `Template "${fileName}" not found in set "${templateSet}" or "default".`
            );
        }
        return fs.readFileSync(fallback, 'utf-8');
    }
    return fs.readFileSync(templatePath, 'utf-8');
}

// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const DOMAINS_ROOT = path.join(REPO_ROOT, 'core', 'src', 'domains');

function generate(opts: GeneratorOptions): void {
    const { name, owner, stability, template } = opts;
    const domainPath = path.join(DOMAINS_ROOT, name);

    // Guard: refuse to overwrite an existing domain.
    if (pathExists(domainPath)) {
        console.error(`❌  Domain "${name}" already exists at:\n    ${domainPath}`);
        console.error('    Delete it manually if you want to regenerate.');
        process.exit(1);
    }

    // Guard: validate template set exists.
    const templateDir = path.join(__dirname, 'templates', template);
    if (!fs.existsSync(templateDir)) {
        const available = fs
            .readdirSync(path.join(__dirname, 'templates'))
            .filter((f) => fs.statSync(path.join(__dirname, 'templates', f)).isDirectory());
        console.error(
            `❌  Template set "${template}" not found. Available: ${available.join(', ')}`
        );
        process.exit(1);
    }

    const vars: Record<string, string> = {
        id: name,
        Name: toPascalCase(name),
        owner,
        stability,
    };

    console.log(`\n🏗   Scaffolding domain: ${name}`);
    console.log(`    Template:   ${template}`);
    console.log(`    Owner:      ${owner}`);
    console.log(`    Stability:  ${stability}`);
    console.log(`    Path:       ${domainPath}\n`);

    // Create empty structural directories (held by .gitkeep).
    const dirs = ['application', 'domain', 'ports', '__tests__'];
    for (const dir of dirs) {
        const dirPath = path.join(domainPath, dir);
        ensureDir(dirPath);
        writeFile(path.join(dirPath, '.gitkeep'), '');
        console.log(`    ✓  ${dir}/.gitkeep`);
    }

    // Render and write the three mandatory root files.
    const files: Array<[string, string]> = [
        ['manifest.yaml', render(loadTemplate(template, 'manifest.yaml'), vars)],
        ['index.ts', render(loadTemplate(template, 'index.ts'), vars)],
        ['README.md', render(loadTemplate(template, 'README.md'), vars)],
    ];

    for (const [fileName, content] of files) {
        writeFile(path.join(domainPath, fileName), content);
        console.log(`    ✓  ${fileName}`);
    }

    console.log(`\n✅  Domain "${name}" scaffolded successfully.`);
    console.log('');
    console.log('    Next steps:');
    console.log(`    1.  Open core/src/domains/${name}/manifest.yaml`);
    console.log('        Update business_owner, criticality, and depends_on.');
    console.log(`    2.  Define your first port in core/src/domains/${name}/ports/`);
    console.log(`    3.  Export it from core/src/domains/${name}/index.ts`);
    console.log('    4.  Run: npm run verify:architecture');
    console.log('');
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

const opts = parseArgs(process.argv);
generate(opts);
