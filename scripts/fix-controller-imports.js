const fs = require('fs');
const path = require('path');

const dirPath = path.join(process.cwd(), 'backend/admin/src/controllers');

const walk = (dir) => {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walk(fullPath);
        } else if (fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let originalContent = content;

            // In backend/admin/src/controllers/ :
            // ../../services -> @esparex/core/services
            // ../../utils -> @esparex/core/utils
            // ../../types -> @esparex/core/types
            // ../../models -> @esparex/core/models
            // ../../constants -> @esparex/core/constants

            // In backend/admin/src/controllers/catalog/ :
            // ../../../services -> @esparex/core/services
            // ../../../utils -> @esparex/core/utils
            // etc

            content = content.replace(/from\s+['"]\.\.\/\.\.\/services\/(.*?)['"]/g, "from '@esparex/core/services/$1'");
            content = content.replace(/from\s+['"]\.\.\/\.\.\/utils\/(.*?)['"]/g, "from '@esparex/core/utils/$1'");
            content = content.replace(/from\s+['"]\.\.\/\.\.\/types\/(.*?)['"]/g, "from '@esparex/core/types/$1'");
            content = content.replace(/from\s+['"]\.\.\/\.\.\/models\/(.*?)['"]/g, "from '@esparex/core/models/$1'");
            content = content.replace(/from\s+['"]\.\.\/\.\.\/constants\/(.*?)['"]/g, "from '@esparex/core/constants/$1'");
            content = content.replace(/from\s+['"]\.\.\/\.\.\/validators\/(.*?)['"]/g, "from '@esparex/core/validators/$1'");

            content = content.replace(/from\s+['"]\.\.\/\.\.\/\.\.\/services\/(.*?)['"]/g, "from '@esparex/core/services/$1'");
            content = content.replace(/from\s+['"]\.\.\/\.\.\/\.\.\/utils\/(.*?)['"]/g, "from '@esparex/core/utils/$1'");
            content = content.replace(/from\s+['"]\.\.\/\.\.\/\.\.\/types\/(.*?)['"]/g, "from '@esparex/core/types/$1'");
            content = content.replace(/from\s+['"]\.\.\/\.\.\/\.\.\/models\/(.*?)['"]/g, "from '@esparex/core/models/$1'");
            content = content.replace(/from\s+['"]\.\.\/\.\.\/\.\.\/constants\/(.*?)['"]/g, "from '@esparex/core/constants/$1'");
            content = content.replace(/from\s+['"]\.\.\/\.\.\/\.\.\/validators\/(.*?)['"]/g, "from '@esparex/core/validators/$1'");

            if (content !== originalContent) {
                fs.writeFileSync(fullPath, content);
                console.log(`Updated imports in ${fullPath}`);
            }
        }
    }
};

walk(dirPath);
