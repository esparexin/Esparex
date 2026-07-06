const fs = require('fs');
const path = require('path');

const infraMappings = {
    '@esparex/core/config/db': '@esparex/core/infrastructure',
    '@esparex/core/utils/mongoUtils': '@esparex/core/infrastructure',
    '@esparex/core/utils/mongoGeoUtils': '@esparex/core/infrastructure',
    '@esparex/core/config/redis': '@esparex/core/infrastructure',
    '@esparex/core/config/redisConfig': '@esparex/core/infrastructure',
    '@esparex/core/config/redisFactory': '@esparex/core/infrastructure',
    '@esparex/core/config/redisRuntime': '@esparex/core/infrastructure',
    '@esparex/core/utils/distributedJobLock': '@esparex/core/infrastructure',
    '@esparex/core/utils/redisCache': '@esparex/core/infrastructure',
    '@esparex/core/utils/cacheWarmer': '@esparex/core/infrastructure',
    '@esparex/core/utils/queueWrapper': '@esparex/core/infrastructure',
    '@esparex/core/utils/jobRunner': '@esparex/core/infrastructure',
    '@esparex/core/utils/workerStatus': '@esparex/core/infrastructure',
    '@esparex/core/config/socket': '@esparex/core/infrastructure',
    '@esparex/core/config/razorpay': '@esparex/core/infrastructure',
    '@esparex/core/config/sentry': '@esparex/core/infrastructure',
    '@esparex/core/utils/metrics': '@esparex/core/infrastructure',
    '@esparex/core/utils/systemMonitor': '@esparex/core/infrastructure',
    '@esparex/core/utils/systemMetricsSummary': '@esparex/core/infrastructure',
    '@esparex/core/utils/reliabilityAlerts': '@esparex/core/infrastructure',
    '@esparex/core/utils/reliabilityContext': '@esparex/core/infrastructure',
    '@esparex/core/utils/sloMonitor': '@esparex/core/infrastructure',
    '@esparex/core/utils/securityMonitoring': '@esparex/core/infrastructure',
    '@esparex/core/utils/s3': '@esparex/core/infrastructure',
    '@esparex/core/utils/uploadFactory': '@esparex/core/infrastructure',
    '@esparex/core/config/firebaseAdmin': '@esparex/core/infrastructure',
    '@esparex/core/utils/shutdownHandler': '@esparex/core/infrastructure',
    '@esparex/core/utils/startupValidator': '@esparex/core/infrastructure'
};

const backendSrcDir = path.join(__dirname, '../backend/user/src');

function walkSync(dir, filelist = []) {
    if (!fs.existsSync(dir)) return filelist;
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

const files = walkSync(backendSrcDir);
let modifiedCount = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    // Use regex to replace exact module paths inside imports
    // E.g., import { db } from '@esparex/core/config/db' -> '@esparex/core/infrastructure'
    
    // We also have to handle the dynamic import: await import('@esparex/core/config/redis')
    
    for (const [oldPath, newPath] of Object.entries(infraMappings)) {
        // Regex matches quotes around the exact path
        // Using word boundary or exact match to avoid partial matches
        const regex = new RegExp(`(['"\`])${oldPath}(['"\`])`, 'g');
        if (regex.test(content)) {
            content = content.replace(regex, `$1${newPath}$2`);
            changed = true;
        }
    }

    // Now, there is a risk that we created duplicate imports in the same file.
    // E.g.
    // import { x } from '@esparex/core/infrastructure';
    // import { y } from '@esparex/core/infrastructure';
    // This is valid TS, but let's just let ESLint --fix merge them later or leave them as is for now, it compiles fine.
    
    if (changed) {
        fs.writeFileSync(file, content);
        modifiedCount++;
        console.log(`Rewrote imports in ${path.relative(backendSrcDir, file)}`);
    }
});

console.log(`\nCompleted. Modified ${modifiedCount} files in backend/user/src.`);
