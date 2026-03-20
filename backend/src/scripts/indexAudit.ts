import * as fs from 'fs';
import * as path from 'path';

function staticAudit() {
    console.log('--- 🔍 Esparex Global Index Static Audit ---');
    
    const modelsPath = path.join(__dirname, '../models');
    const files = fs.readdirSync(modelsPath).filter(f => f.endsWith('.ts'));

    let totalRedundancies = 0;

    for (const file of files) {
        const filePath = path.join(modelsPath, file);
        const content = fs.readFileSync(filePath, 'utf8');

        // Regex to find property declarations with index/unique flags
        // Matches things like:  mobile: { type: String, unique: true }
        // We look for index: true, unique: true, sparse: true
        const propertyFlagRegex = /[a-zA-Z0-9_]+\s*:\s*\{[^}]*(index|unique|sparse)\s*:\s*(true|1|-1|['"]text['"])[^}]*\}/g;
        
        const matches = content.match(propertyFlagRegex);

        // Filter out isDeleted as it might be standardized via plugin (though we should check)
        const filteredMatches = (matches || []).filter(m => !m.includes('isDeleted'));

        if (filteredMatches.length > 0) {
            console.log(`\n📄 Model: ${file}`);
            filteredMatches.forEach(m => {
                console.log(`  🚩 Found property-level flag: ${m.trim().replace(/\s+/g, ' ')}`);
                totalRedundancies++;
            });
        }
    }

    console.log(`\n--- Audit Complete. Found ${totalRedundancies} property-level index flags. ---`);
    if (totalRedundancies > 0) process.exit(1);
    process.exit(0);
}

staticAudit();
