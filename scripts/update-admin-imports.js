const fs = require('fs');
const path = require('path');

const walk = (dir) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf-8');
      
      const controllersPath = path.join(process.cwd(), 'backend/admin/src/controllers');
      const relToControllers = path.relative(path.dirname(fullPath), controllersPath);
      
      const newContent = content.replace(/@esparex\/core\/controllers\/admin/g, relToControllers.startsWith('.') ? relToControllers : './' + relToControllers);
      if (content !== newContent) {
        fs.writeFileSync(fullPath, newContent);
        console.log(`Updated ${fullPath}`);
      }
    }
  }
};

walk(path.join(process.cwd(), 'backend/admin/src/routes'));
