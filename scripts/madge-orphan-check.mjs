#!/usr/bin/env node

/**
 * Madge-based orphan file detection for repository-* packages.
 * 
 * Supplements the existing string-based orphan-sweep (orphan-sweep.cjs)
 * by scanning packages the string-based approach misses (packages/repository-*)
 * and using AST-level dependency graph analysis for accuracy.
 * 
 * Filters out package entry points defined in package.json (main, types, bin)
 * to avoid false positives on intentional public API surfaces.
 */

import madge from 'madge';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const TARGET_DIRS = [
    'packages/repository-scanner',
    'packages/repository-brain',
    'packages/repository-skills',
    'packages/repository-governance',
    'packages/repository-intelligence',
    'packages/repository-plugin-sdk',
    'packages/repository-plugin-security',
    'packages/repository-plugin-nextjs',
    'packages/repository-runtime',
];

function getPackageEntryPoints(dir) {
    const pkgPath = path.resolve(root, dir, 'package.json');
    if (!fs.existsSync(pkgPath)) return [];

    try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        const entries = [];

        // Map dist-based main/types back to src equivalents.
        // madge baseDir is src/, so paths are relative to src/
        // e.g. main: "dist/src/index.js" -> src/index.ts -> index.ts
        //      main: "dist/index.js" -> index.ts
        if (pkg.main) {
            const srcRel = pkg.main
                .replace(/^dist\//, '')
                .replace(/^src\//, '')
                .replace(/\.js$/, '.ts');
            entries.push(srcRel.replace(/\\/g, '/'));
        }
        if (pkg.types) {
            const srcRel = pkg.types
                .replace(/^dist\//, '')
                .replace(/^src\//, '')
                .replace(/\.d\.ts$/, '.ts');
            entries.push(srcRel.replace(/\\/g, '/'));
        }
        if (pkg.bin && typeof pkg.bin === 'object') {
            for (const binPath of Object.values(pkg.bin)) {
                const srcRel = binPath
                    .replace(/^dist\//, '')
                    .replace(/^src\//, '')
                    .replace(/\.js$/, '.ts');
                entries.push(srcRel.replace(/\\/g, '/'));
            }
        }

        return [...new Set(entries)];
    } catch {
        return [];
    }
}

async function checkOrphans(dir) {
    const absPath = path.resolve(root, dir);
    if (!fs.existsSync(absPath)) {
        console.log(`[SKIP] ${dir} — not found`);
        return [];
    }

    const srcPath = path.join(absPath, 'src');
    if (!fs.existsSync(srcPath)) {
        console.log(`[SKIP] ${dir}/src — no source directory`);
        return [];
    }

    const entryPoints = getPackageEntryPoints(dir);

    try {
        const res = await madge(srcPath, {
            baseDir: srcPath,
            includeNpm: false,
            fileExtensions: ['ts', 'js', 'tsx', 'jsx'],
        });

        const orphans = res.orphans()
            .filter(f => !f.startsWith('tests/'))
            .filter(f => !entryPoints.includes(f));

        if (orphans.length > 0) {
            console.log(`\n[ORPHANS] ${dir} — ${orphans.length} file(s):`);
            orphans.forEach(f => console.log(`  [DELETE] ${dir}/src/${f}`));
        } else {
            console.log(`[OK] ${dir} — no orphans in src/`);
        }
        return orphans.map(f => path.posix.join(dir, 'src', f));
    } catch (err) {
        if (err.message.includes('No module') || err.message.includes('ENOENT')) {
            console.log(`[OK] ${dir} — no modules detected`);
            return [];
        }
        console.error(`[ERROR] ${dir}: ${err.message}`);
        return [];
    }
}

async function main() {
    console.log('── Madge Orphan Check ────────────────────────────────────');
    console.log(`Scanning ${TARGET_DIRS.length} repository-* packages...\n`);

    let totalOrphans = 0;
    let allOrphans = [];

    for (const dir of TARGET_DIRS) {
        const orphans = await checkOrphans(dir);
        totalOrphans += orphans.length;
        allOrphans.push(...orphans);
    }

    console.log('\n─────────────────────────────────────────────────────────');
    if (totalOrphans > 0) {
        console.log(`\n⚠️  ${totalOrphans} orphan file(s) detected across repository-* packages.`);
        console.log('Verify these files are not used dynamically before deletion.');
        process.exit(1);
    } else {
        console.log('\n✅ No orphans detected in repository-* packages.');
        process.exit(0);
    }
}

main().catch(err => {
    console.error('Madge orphan check failed:', err);
    process.exit(2);
});
