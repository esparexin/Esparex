import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, "../src");
const TARGET_TYPES = ["UserProfile", "UserData"]; // Removed "User" to be safer/less noisy

function walk(dir) {
    if (!fs.existsSync(dir)) return;
    const items = fs.readdirSync(dir);

    for (const file of items) {
        const full = path.join(dir, file);
        if (fs.statSync(full).isDirectory()) {
            walk(full);
        } else if (file.endsWith(".ts") || file.endsWith(".tsx")) {
            migrate(full);
        }
    }
}

function migrate(file) {
    // skip types file itself and schema
    if (file.includes("UserSession.ts") || file.includes("userSession.schema.ts")) return;

    let content = fs.readFileSync(file, "utf8");
    let changed = false;

    TARGET_TYPES.forEach(type => {
        // Only replace independent occurrences to avoid breaking other things
        // \b word boundary is good
        if (new RegExp(`\\b${type}\\b`).test(content)) {
            content = content.replace(
                new RegExp(`\\b${type}\\b`, "g"),
                "UserSession"
            );
            changed = true;
        }
    });

    if (changed) {
        // Add import if missing
        if (!content.includes('"@/types/UserSession"')) {
            // Naive import injection at the top
            content = `import { UserSession } from "@/types/UserSession";\n` + content;
        }

        // Remove old imports (very naive, might leave empty lines or partials)
        // For now, simpler is safer: let unused imports be cleaned by linters

        fs.writeFileSync(file, content);
        console.log("Migrated:", file);
    }
}

console.log("Starting migration in:", ROOT);
walk(ROOT);
console.log("Migration complete.");
