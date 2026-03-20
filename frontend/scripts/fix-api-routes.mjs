/**
 * Script to identify API routes that need error handling fixes
 * This is a helper script - actual fixes are done manually
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const apiDir = join(__dirname, '../src/app/api');

function findRouteFiles(dir, fileList = []) {
    const files = readdirSync(dir);
    
    files.forEach(file => {
        const filePath = join(dir, file);
        const stat = statSync(filePath);
        
        if (stat.isDirectory()) {
            findRouteFiles(filePath, fileList);
        } else if (file === 'route.ts') {
            fileList.push(filePath);
        }
    });
    
    return fileList;
}

function checkRouteFile(filePath) {
    const content = readFileSync(filePath, 'utf-8');
    const issues = [];
    
    // Check for direct request.json() without try-catch
    if (content.includes('await request.json()') && !content.includes('try {') || 
        (content.includes('await request.json()') && !content.match(/try\s*\{[\s\S]*?await request\.json\(\)/))) {
        // More precise check
        const lines = content.split('\n');
        let inTryBlock = false;
        
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('try {')) inTryBlock = true;
            if (lines[i].includes('await request.json()')) {
                if (!inTryBlock) {
                    issues.push(`Line ${i + 1}: request.json() without try-catch`);
                }
            }
            if (lines[i].includes('} catch')) inTryBlock = false;
        }
    }
    
    // Check for direct dbConnect() without try-catch
    if (content.includes('await dbConnect()') && !content.includes('try {') || 
        (content.includes('await dbConnect()') && !content.match(/try\s*\{[\s\S]*?await dbConnect\(\)/))) {
        issues.push('dbConnect() may not be wrapped in try-catch');
    }
    
    // Check for missing Content-Type headers
    if (content.includes('NextResponse.json') && !content.includes("'Content-Type': 'application/json'") && 
        !content.includes('"Content-Type": "application/json"')) {
        issues.push('Missing Content-Type header');
    }
    
    return issues;
}

const routeFiles = findRouteFiles(apiDir);
const routesNeedingFixes = [];

routeFiles.forEach(file => {
    const issues = checkRouteFile(file);
    if (issues.length > 0) {
        routesNeedingFixes.push({
            file: file.replace(join(__dirname, '../'), ''),
            issues
        });
    }
});

console.log(`Found ${routesNeedingFixes.length} routes that may need fixes:`);
routesNeedingFixes.forEach(({ file, issues }) => {
    console.log(`\n${file}:`);
    issues.forEach(issue => console.log(`  - ${issue}`));
});
