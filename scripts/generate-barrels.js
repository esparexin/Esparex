const fs = require('fs');
const path = require('path');

const repoRoot = path.join(__dirname, '..');
const coreSrc = path.join(repoRoot, 'core/src');

function generateBarrel(folder, excludeList = []) {
    const folderPath = path.join(coreSrc, folder);
    if (!fs.existsSync(folderPath)) return;

    let exportsStr = `// Public API for ${folder}\n\n`;
    
    // In config, we explicitly export `env` as default also if it exists
    let hasEnv = false;

    fs.readdirSync(folderPath).forEach(file => {
        if (file.endsWith('.ts') && file !== 'index.ts' && !file.endsWith('.spec.ts')) {
            const baseName = file.replace('.ts', '');
            if (!excludeList.includes(baseName)) {
                exportsStr += `export * from './${baseName}';\n`;
                if (folder === 'config' && baseName === 'env') {
                    hasEnv = true;
                }
            }
        }
    });

    if (hasEnv) {
        exportsStr += `export { default as env } from './env';\n`;
    }

    fs.writeFileSync(path.join(folderPath, 'index.ts'), exportsStr);
    console.log(`Generated barrel for ${folder}`);
}

generateBarrel('models');

// For config, exclude what was moved to infrastructure (though they are already moved, so they won't be found!)
generateBarrel('config');

// For utils, exclude what was moved
generateBarrel('utils');
