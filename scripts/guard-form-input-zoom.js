#!/usr/bin/env node
/**
 * Automated Mobile Form Input Zoom Guard (WCAG 2.2 AA SC 1.4.4)
 *
 * Enforces that all editable form controls (<input>, <Input>, <textarea>,
 * <Textarea>, <select>, <SelectTrigger>, etc.) in user-facing applications
 * have a computed font-size of at least 16px (1rem / text-base / text-body-lg)
 * on mobile viewports (< md:).
 *
 * Prevents iOS Safari / WebKit auto-viewport zoom regressions that permanently
 * break and crop mobile layouts on focus.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');

const TARGET_DIRECTORIES = [
    path.join(repoRoot, 'apps', 'web', 'src'),
    path.join(repoRoot, 'apps', 'mobile', 'src'),
    path.join(repoRoot, 'packages', 'ui', 'src'),
    path.join(repoRoot, 'packages', 'mobile-ui', 'src'),
];

const EXCLUDED_DIRS = ['node_modules', '.next', 'dist', 'coverage', 'build', '__tests__'];

// Editable input control component and tag names
const CONTROL_NAMES = [
    'input',
    'Input',
    'textarea',
    'Textarea',
    'select',
    'SelectTrigger',
    'ControlledInput',
    'ControlledTextarea',
    'ControlledSelect',
];

// Sub-16px tokens that trigger iOS zoom if applied without an `md:` desktop prefix
const SUB_16PX_REGEX = /\b(?<![a-z0-9_-]:)(?:text-xs|text-caption|text-small|text-tiny|text-sm|text-body)(?!-[a-z0-9])\b/;

const SUPPRESSION_PATTERN = /input-zoom-ignore(?::\s*(.+))?/;

let violations = [];

function extractJsxOpeningTags(fileContent, controlNames) {
    const tags = [];
    const tagRegex = new RegExp(`<(?:${controlNames.join('|')})\\b`, 'g');
    let match;
    while ((match = tagRegex.exec(fileContent)) !== null) {
        const startIdx = match.index;
        let i = startIdx + match[0].length;
        let braceDepth = 0;
        let inQuote = null;
        let tagEnd = -1;

        while (i < fileContent.length) {
            const ch = fileContent[i];
            const prev = fileContent[i - 1];

            if (inQuote) {
                if (ch === inQuote && prev !== '\\') {
                    inQuote = null;
                }
            } else if (ch === '"' || ch === "'" || ch === '`') {
                inQuote = ch;
            } else if (ch === '{') {
                braceDepth++;
            } else if (ch === '}') {
                braceDepth--;
            } else if (ch === '>' && braceDepth === 0) {
                tagEnd = i + 1;
                break;
            }
            i++;
        }

        if (tagEnd !== -1) {
            tags.push({
                start: startIdx,
                end: tagEnd,
                snippet: fileContent.slice(startIdx, tagEnd),
                attributes: fileContent.slice(startIdx + match[0].length, tagEnd - (fileContent[tagEnd - 2] === '/' ? 2 : 1))
            });
        }
    }
    return tags;
}

function checkFile(filePath) {
    const relPath = path.relative(repoRoot, filePath);
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    const tags = extractJsxOpeningTags(content, CONTROL_NAMES);

    for (const tag of tags) {
        const classMatch = tag.attributes.match(/className=(?:\{cn\(|["`]|`)([^"`}]+)/);
        if (classMatch) {
            const classContent = classMatch[1];
            if (SUB_16PX_REGEX.test(classContent)) {
                const upToMatch = content.substring(0, tag.start);
                const lineNo = upToMatch.split('\n').length;
                const lineContent = lines[lineNo - 1] || '';
                const prevLineContent = lineNo > 1 ? lines[lineNo - 2] : '';

                const isSuppressed = SUPPRESSION_PATTERN.test(lineContent) || SUPPRESSION_PATTERN.test(prevLineContent);

                if (!isSuppressed) {
                    violations.push({
                        file: relPath,
                        line: lineNo,
                        classStr: classContent.trim(),
                        snippet: tag.snippet.replace(/\s+/g, ' ').substring(0, 100),
                    });
                }
            }
        }
    }
}

function walk(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (EXCLUDED_DIRS.includes(entry.name)) continue;
            walk(fullPath);
        } else if (entry.isFile() && (fullPath.endsWith('.tsx') || fullPath.endsWith('.jsx'))) {
            checkFile(fullPath);
        }
    }
}

for (const dir of TARGET_DIRECTORIES) {
    walk(dir);
}

if (violations.length > 0) {
    console.error('\n❌ Mobile Form Input Zoom Guard: Sub-16px input font detected!');
    console.error('All editable form controls (<input>, <Input>, <textarea>, <Textarea>, <select>, <SelectTrigger>)');
    console.error('must render with font-size >= 16px on mobile viewports (< md:) to prevent iOS Safari auto-zoom.');
    console.error('Remedy: Use responsive tokens `text-body-lg md:text-body` or `text-base md:text-sm`.\n');

    for (const v of violations) {
        console.error(`  ✗ ${v.file}:${v.line}`);
        console.error(`    Classes: ${v.classStr}`);
        console.error(`    Snippet: ${v.snippet}\n`);
    }
    process.exit(1);
} else {
    console.log('✅ Mobile Form Input Zoom Guard Passed — 0 sub-16px input controls found across user apps.');
    process.exit(0);
}
