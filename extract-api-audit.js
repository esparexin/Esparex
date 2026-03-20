const fs = require('fs');
const path = require('path');

const ROOT_DIR = '/Users/admin/Desktop/EsparexAdmin';
const BACKEND_ROUTES_DIR = path.join(ROOT_DIR, 'backend/src/routes');
const BACKEND_CONTROLLERS_DIR = path.join(ROOT_DIR, 'backend/src/controllers');
const FRONTEND_QUERIES_DIR = path.join(ROOT_DIR, 'frontend/src/queries');
const ADMIN_FRONTEND_HOOKS_DIR = path.join(ROOT_DIR, 'admin-frontend/src/hooks');

function walk(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const stat = fs.statSync(path.join(dir, file));
    if (stat.isDirectory()) {
      walk(path.join(dir, file), fileList);
    } else {
      fileList.push(path.join(dir, file));
    }
  }
  return fileList;
}

const apiEndpoints = [];
const controllers = [];
const frontendHooks = [];
const adminHooks = [];

// 1. Extract Backend Routes
if (fs.existsSync(BACKEND_ROUTES_DIR)) {
  const routeFiles = walk(BACKEND_ROUTES_DIR).filter(f => f.endsWith('.ts') || f.endsWith('.js'));
  const routeRegex = /router\.(get|post|put|delete|patch)\((['"`])(.*?)['"`]/g;
  
  for (const file of routeFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const relativePath = path.relative(BACKEND_ROUTES_DIR, file);
    let match;
    while ((match = routeRegex.exec(content)) !== null) {
      const method = match[1].toUpperCase();
      const slug = match[3];
      // Extract params: anything starting with :
      const params = slug.match(/:[a-zA-Z0-9_]+/g) || [];
      apiEndpoints.push({
        file: relativePath,
        method,
        slug,
        params: params.join(', ')
      });
    }
  }
}

// 2. Extract Backend Controllers
if (fs.existsSync(BACKEND_CONTROLLERS_DIR)) {
  const controllerFiles = walk(BACKEND_CONTROLLERS_DIR).filter(f => f.endsWith('.ts') || f.endsWith('.js'));
  for (const file of controllerFiles) {
    const relativePath = path.relative(BACKEND_CONTROLLERS_DIR, file);
    
    // Extract exported functions
    const content = fs.readFileSync(file, 'utf8');
    const exportRegex = /export (?:const|async function|function) ([a-zA-Z0-9_]+)/g;
    let functions = [];
    let match;
    while ((match = exportRegex.exec(content)) !== null) {
      functions.push(match[1]);
    }

    controllers.push({
      file: relativePath,
      functions: functions.join(', ')
    });
  }
}

// 3. Extract Frontend Hooks/Queries
if (fs.existsSync(FRONTEND_QUERIES_DIR)) {
  const queryFiles = walk(FRONTEND_QUERIES_DIR).filter(f => f.endsWith('.ts') || f.endsWith('.js') || f.endsWith('.tsx'));
  for (const file of queryFiles) {
    const relativePath = path.relative(FRONTEND_QUERIES_DIR, file);
    const content = fs.readFileSync(file, 'utf8');
    const hookRegex = /export (?:const|function) (use[a-zA-Z0-9_]+)/g;
    let hooks = [];
    let match;
    while ((match = hookRegex.exec(content)) !== null) {
      hooks.push(match[1]);
    }
    frontendHooks.push({
      file: relativePath,
      hooks: hooks.length > 0 ? hooks.join(', ') : 'No explicit hooks exported'
    });
  }
}

// 4. Extract Admin Frontend Hooks
if (fs.existsSync(ADMIN_FRONTEND_HOOKS_DIR)) {
  const adminFiles = walk(ADMIN_FRONTEND_HOOKS_DIR).filter(f => f.endsWith('.ts') || f.endsWith('.js') || f.endsWith('.tsx'));
  for (const file of adminFiles) {
    const relativePath = path.relative(ADMIN_FRONTEND_HOOKS_DIR, file);
    const content = fs.readFileSync(file, 'utf8');
    const hookRegex = /export (?:const|function) (use[a-zA-Z0-9_]+)/g;
    let hooks = [];
    let match;
    while ((match = hookRegex.exec(content)) !== null) {
      hooks.push(match[1]);
    }
    adminHooks.push({
      file: relativePath,
      hooks: hooks.length > 0 ? hooks.join(', ') : 'No explicit hooks exported'
    });
  }
}

// Compile Report
let mdReport = `# API & Architecture Audit Report\n\n`;

mdReport += `## 1. Backend Route Structure (API Methods, Slugs, Params)\n`;
mdReport += `| File | Method | Slug/Endpoint | Params |\n`;
mdReport += `|------|--------|---------------|--------|\n`;
apiEndpoints.forEach(ep => {
  mdReport += `| \`${ep.file}\` | **${ep.method}** | \`${ep.slug}\` | \`${ep.params || 'None'}\` |\n`;
});

mdReport += `\n## 2. Backend Controllers\n`;
mdReport += `| Controller File | Exported Methods (Handlers) |\n`;
mdReport += `|-----------------|-----------------------------|\n`;
controllers.forEach(ctrl => {
  mdReport += `| \`${ctrl.file}\` | \`${ctrl.functions || 'None extracted'}\` |\n`;
});

mdReport += `\n## 3. Frontend Hooks (Queries)\n`;
mdReport += `| File | Exported Hooks |\n`;
mdReport += `|------|----------------|\n`;
frontendHooks.forEach(hook => {
  mdReport += `| \`${hook.file}\` | \`${hook.hooks}\` |\n`;
});

mdReport += `\n## 4. Admin Frontend Hooks\n`;
mdReport += `| File | Exported Hooks |\n`;
mdReport += `|------|----------------|\n`;
adminHooks.forEach(hook => {
  mdReport += `| \`${hook.file}\` | \`${hook.hooks}\` |\n`;
});

fs.writeFileSync('/Users/admin/.gemini/antigravity/brain/ea412f4c-89d1-4c98-83c5-7be16eb72b16/api_audit_report.md', mdReport);
console.log('Report generated at /Users/admin/.gemini/antigravity/brain/ea412f4c-89d1-4c98-83c5-7be16eb72b16/api_audit_report.md');
