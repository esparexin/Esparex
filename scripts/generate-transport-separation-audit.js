const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const coreControllersPath = path.join(repoRoot, 'core/src/controllers');
const coreMiddlewarePath = path.join(repoRoot, 'core/src/middleware');
const scanDirs = [
    path.join(repoRoot, 'backend/user/src'),
    path.join(repoRoot, 'core/src'),
    path.join(repoRoot, 'apps/web/src'),
    path.join(repoRoot, 'apps/admin/src')
];

// Helper to recursively find typescript files
function getTsFiles(dir) {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            results = results.concat(getTsFiles(fullPath));
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            results.push(fullPath);
        }
    });
    return results;
}

// Find all controllers and middlewares
const controllers = getTsFiles(coreControllersPath);
const middlewares = getTsFiles(coreMiddlewarePath);
const allTargetFiles = [...controllers, ...middlewares];

// Load all project files in memory to scan imports
const projectFiles = [];
scanDirs.forEach(dir => {
    projectFiles.push(...getTsFiles(dir));
});

const fileContentsMap = new Map();
projectFiles.forEach(file => {
    try {
        fileContentsMap.set(file, fs.readFileSync(file, 'utf8'));
    } catch (_e) {
            // intentionally ignored: file may be unreadable or missing
        }
});

// Process each file
const reports = [];

allTargetFiles.forEach(filePath => {
    const relativePath = path.relative(repoRoot, filePath).replace(/\\/g, '/');
    const content = fs.readFileSync(filePath, 'utf8');

    // Check Express dependencies
    const hasExpress = /from ['"]express['"]/i.test(content) || 
                      /\bRequest\b|\bResponse\b|\bNextFunction\b/.test(content);

    // Check Business Logic (references models, mongoose, query helpers or specific services)
    const hasBusinessLogic = hasExpress && (
        /import .* from ['"].*models\/.*['"]/i.test(content) || 
        /mongoose/i.test(content) || 
        /\.find\(|\.create\(|\.save\(|\.update\(|\.aggregate\(/.test(content) ||
        /Service\./i.test(content)
    );

    // Find consumers
    const fileBase = path.basename(filePath, '.ts');
    const importRegex = new RegExp(`['"].*${fileBase}['"]`, 'i');

    const consumers = [];
    for (const [projFile, projContent] of fileContentsMap.entries()) {
        // Skip scanning the file itself
        if (projFile === filePath) continue;

        if (importRegex.test(projContent)) {
            const relProjPath = path.relative(repoRoot, projFile).replace(/\\/g, '/');
            consumers.push(relProjPath);
        }
    }

    // Determine category and destination
    let category = 'Category 4 (Helper/Utility)';
    let destination = 'core/src/utils/';
    let decision = 'Relocate in Core';
    
    if (hasExpress) {
        if (hasBusinessLogic) {
            category = 'Category 1 (Mixed HTTP + Logic)';
            decision = 'Split & Move';
        } else {
            category = 'Category 1 (Pure HTTP Adapter)';
            decision = 'Move';
        }
        if (relativePath.includes('middleware/')) {
            destination = 'backend/user/src/middleware/';
        } else {
            destination = 'backend/user/src/controllers/';
        }
    }

    if (relativePath.endsWith('plan/shared.ts')) {
        category = 'Split (Hybrid)';
        decision = 'Split & Move';
        destination = 'Split to core/src/utils/ and backend/user/';
    }

    reports.push({
        file: relativePath,
        category,
        express: hasExpress ? 'Yes' : 'No',
        logic: hasBusinessLogic ? 'Yes' : 'No',
        consumers: consumers.length > 0 ? consumers.join(', ') : 'None (Orphan)',
        decision
    });
});

// Generate metrics
const totalAudited = reports.length;
const totalExpressDeps = reports.filter(r => r.express === 'Yes').length;
const expressControllers = reports.filter(r => r.express === 'Yes' && !r.file.includes('middleware/')).length;
const expressMiddlewares = reports.filter(r => r.express === 'Yes' && r.file.includes('middleware/')).length;
const coreUtilities = reports.filter(r => r.express === 'No').length;

const controllersWithLogic = reports.filter(r => r.logic === 'Yes').length;

// Generate Markdown report
let markdown = `# Transport Separation Audit Report\n\n`;
markdown += `*Generated automatically on: ${new Date().toISOString()}*\n\n`;
markdown += `## Architectural Metrics Summary\n\n`;
markdown += `| Metric Name | Value |\n`;
markdown += `| :--- | :---: |\n`;
markdown += `| Total Audited Files in core | ${totalAudited} |\n`;
markdown += `| Files with Express/HTTP Dependencies | ${totalExpressDeps} |\n`;
markdown += `| Express Controllers | ${expressControllers} |\n`;
markdown += `| Express Middlewares | ${expressMiddlewares} |\n`;
markdown += `| Pure Core Utilities (No HTTP) | ${coreUtilities} |\n`;
markdown += `| Controllers containing business logic | ${controllersWithLogic} |\n`;
markdown += `\n---\n\n`;
markdown += `This report lists the Express dependency, consumers, and migration decisions for each controller and middleware inside \`core/\`.\n\n`;
markdown += `| File Path | Uses Express? | Contains Business Logic? | Consumers | Migration Decision |\n`;
markdown += `| :--- | :---: | :---: | :--- | :---: |\n`;

reports.forEach(r => {
    markdown += `| \`${r.file}\` | ${r.express} | ${r.logic} | ${r.consumers} | ${r.decision} |\n`;
});

const reportPath = path.join(repoRoot, 'docs/cleanup/transport-separation-audit.md');
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, markdown, 'utf8');

console.log(`✅ Transport Separation Audit Report generated successfully at: ${reportPath}`);
