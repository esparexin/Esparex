const fs = require('fs');
const path = require('path');

const mappings = {
    'core/src/config/db.ts': 'core/src/infrastructure/db/index.ts',
    'core/src/config/mongoosePlugins.ts': 'core/src/infrastructure/db/mongoosePlugins.ts',
    'core/src/config/mongooseSerializationPlugin.ts': 'core/src/infrastructure/db/mongooseSerializationPlugin.ts',
    'core/src/utils/mongoUtils.ts': 'core/src/infrastructure/db/mongoUtils.ts',
    'core/src/utils/mongoGeoUtils.ts': 'core/src/infrastructure/db/mongoGeoUtils.ts',
    'core/src/config/redis.ts': 'core/src/infrastructure/redis/index.ts',
    'core/src/config/redisConfig.ts': 'core/src/infrastructure/redis/redisConfig.ts',
    'core/src/config/redisFactory.ts': 'core/src/infrastructure/redis/redisFactory.ts',
    'core/src/config/redisRuntime.ts': 'core/src/infrastructure/redis/redisRuntime.ts',
    'core/src/utils/distributedJobLock.ts': 'core/src/infrastructure/redis/distributedJobLock.ts',
    'core/src/utils/redisCache.ts': 'core/src/infrastructure/cache/redisCache.ts',
    'core/src/utils/cacheWarmer.ts': 'core/src/infrastructure/cache/cacheWarmer.ts',
    'core/src/utils/queueWrapper.ts': 'core/src/infrastructure/bullmq/queueWrapper.ts',
    'core/src/utils/jobRunner.ts': 'core/src/infrastructure/bullmq/jobRunner.ts',
    'core/src/utils/workerStatus.ts': 'core/src/infrastructure/bullmq/workerStatus.ts',
    'core/src/config/socket.ts': 'core/src/infrastructure/socket/index.ts',
    'core/src/config/razorpay.ts': 'core/src/infrastructure/payment/razorpay.ts',
    'core/src/config/sentry.ts': 'core/src/infrastructure/telemetry/sentry.ts',
    'core/src/utils/metrics.ts': 'core/src/infrastructure/telemetry/metrics.ts',
    'core/src/utils/systemMonitor.ts': 'core/src/infrastructure/telemetry/systemMonitor.ts',
    'core/src/utils/systemMetricsSummary.ts': 'core/src/infrastructure/telemetry/systemMetricsSummary.ts',
    'core/src/utils/reliabilityAlerts.ts': 'core/src/infrastructure/telemetry/reliabilityAlerts.ts',
    'core/src/utils/reliabilityContext.ts': 'core/src/infrastructure/telemetry/reliabilityContext.ts',
    'core/src/utils/sloMonitor.ts': 'core/src/infrastructure/telemetry/sloMonitor.ts',
    'core/src/utils/securityMonitoring.ts': 'core/src/infrastructure/telemetry/securityMonitoring.ts',
    'core/src/utils/s3.ts': 'core/src/infrastructure/storage/s3.ts',
    'core/src/utils/uploadFactory.ts': 'core/src/infrastructure/storage/uploadFactory.ts',
    'core/src/config/firebaseAdmin.ts': 'core/src/infrastructure/push/firebaseAdmin.ts',
    'core/src/utils/shutdownHandler.ts': 'core/src/infrastructure/process/shutdownHandler.ts',
    'core/src/utils/startupValidator.ts': 'core/src/infrastructure/process/startupValidator.ts'
};

const repoRoot = path.join(__dirname, '..');

// 1. Move files and update internal relative imports
console.log('Moving files and updating internal relative imports...');
for (const [oldPath, newPath] of Object.entries(mappings)) {
    const fullOldPath = path.join(repoRoot, oldPath);
    const fullNewPath = path.join(repoRoot, newPath);
    
    if (fs.existsSync(fullOldPath)) {
        let content = fs.readFileSync(fullOldPath, 'utf8');
        
        // Update relative imports inside the moved file
        const oldDir = path.dirname(fullOldPath);
        const newDir = path.dirname(fullNewPath);
        
        const importRegex = /from\s+['"](\.[^'"]+)['"]/g;
        const replacements = [];
        let match;
        while ((match = importRegex.exec(content)) !== null) {
            const relImport = match[1];
            // Resolve old import path
            const resolvedPath = path.resolve(oldDir, relImport);
            // Calculate new relative path
            let newRel = path.relative(newDir, resolvedPath).replace(/\\/g, '/');
            if (!newRel.startsWith('.')) newRel = './' + newRel;
            replacements.push({ old: match[0], new: `from '${newRel}'` });
        }
        for (const rep of replacements) {
            content = content.replace(rep.old, rep.new);
        }
        
        fs.mkdirSync(path.dirname(fullNewPath), { recursive: true });
        fs.writeFileSync(fullNewPath, content);
        fs.unlinkSync(fullOldPath);
        console.log(`Moved and updated ${oldPath} -> ${newPath}`);
    } else {
        console.warn(`File not found: ${oldPath}`);
    }
}

// 2. Generate core/src/infrastructure/index.ts
console.log('Generating infrastructure barrel...');
let indexContent = '// Public API for Infrastructure\n\n';
for (const newPath of Object.values(mappings)) {
    let relPath = newPath.replace('core/src/infrastructure/', './').replace('.ts', '');
    if (relPath.endsWith('/index')) {
        relPath = relPath.replace('/index', '');
    }
    indexContent += `export * from '${relPath}';\n`;
}
fs.writeFileSync(path.join(repoRoot, 'core/src/infrastructure/index.ts'), indexContent);

// 3. Rewrite internal references in `core`
console.log('Rewriting internal imports in core...');
const coreSrcDir = path.join(repoRoot, 'core/src');
function walkSync(dir, filelist = []) {
    fs.readdirSync(dir).forEach(file => {
        const filepath = path.join(dir, file);
        if (fs.statSync(filepath).isDirectory()) {
            filelist = walkSync(filepath, filelist);
        } else if (filepath.endsWith('.ts')) {
            filelist.push(filepath);
        }
    });
    return filelist;
}

const coreFiles = walkSync(coreSrcDir);

const oldToNewMap = {};
for (const [oldPath, newPath] of Object.entries(mappings)) {
    oldToNewMap[oldPath.replace('core/src/', '').replace('.ts', '')] = newPath.replace('core/src/infrastructure/', 'infrastructure/').replace('.ts', '');
}

coreFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    const fileDir = path.dirname(file);
    
    for (const [oldRel, newRel] of Object.entries(oldToNewMap)) {
        
        // 1. Replace aliases
        const aliasRegex = new RegExp(`@esparex/core/${oldRel}(?!\\w)`, 'g');
        if (aliasRegex.test(content)) {
            let n = newRel;
            if (n.endsWith('/index')) n = n.replace('/index', '');
            content = content.replace(aliasRegex, `@esparex/core/${n}`);
            changed = true;
        }

        // 2. Replace relative paths
        const importRegex = /from\s+['"]([^'"]+)['"]/g;
        let match;
        const replacements = [];
        while ((match = importRegex.exec(content)) !== null) {
            const importPath = match[1];
            if (importPath.startsWith('.')) {
                const resolved = path.resolve(fileDir, importPath);
                const oldFull = path.join(coreSrcDir, oldRel);
                if (resolved === oldFull || resolved === oldFull + '.ts' || resolved + '/index.ts' === oldFull + '.ts') {
                    const newFull = path.join(coreSrcDir, newRel.replace('infrastructure/', 'infrastructure/'));
                    let newImport = path.relative(fileDir, newFull).replace(/\\/g, '/');
                    if (!newImport.startsWith('.')) newImport = './' + newImport;
                    if (newImport.endsWith('/index')) newImport = newImport.replace('/index', '');
                    replacements.push({ old: match[0], new: `from '${newImport}'` });
                }
            }
        }
        
        for (const rep of replacements) {
            content = content.replace(rep.old, rep.new);
            changed = true;
        }
    }

    if (changed) {
        fs.writeFileSync(file, content);
    }
});

console.log('Done!');
