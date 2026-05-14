/**
 * 📊 Esparex Technical Debt Insights
 * 
 * This script analyzes the eslint-baseline.json and generates a prioritized
 * remediation report. It helps the team understand where the technical debt
 * is concentrated and how to burn it down effectively.
 */

const fs = require('fs');
const path = require('path');

const BASELINE_PATH = path.join(__dirname, '../eslint-baseline.json');
const REPORT_PATH = path.join(__dirname, '../tech-debt-insights.md');

if (!fs.existsSync(BASELINE_PATH)) {
    console.error('❌ Error: eslint-baseline.json not found. Run generate-eslint-baseline.js first.');
    process.exit(1);
}

const baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8'));

const stats = {
    totalFiles: baseline.length,
    totalViolations: 0,
    byRule: {},
    byWorkspace: {},
    hotspots: []
};

baseline.forEach(file => {
    const relPath = path.relative(process.cwd(), file.filePath);
    const workspace = relPath.split(path.sep)[0] || 'root';
    
    stats.totalViolations += file.messages.length;
    
    // Group by workspace
    stats.byWorkspace[workspace] = (stats.byWorkspace[workspace] || 0) + file.messages.length;
    
    // Group by rule
    file.messages.forEach(msg => {
        stats.byRule[msg.ruleId] = (stats.byRule[msg.ruleId] || 0) + 1;
    });
    
    // Hotspots (Top violating files)
    if (file.messages.length > 5) {
        stats.hotspots.push({
            file: relPath,
            count: file.messages.length
        });
    }
});

// Sort data
const sortedRules = Object.entries(stats.byRule).sort((a, b) => b[1] - a[1]);
const sortedWorkspaces = Object.entries(stats.byWorkspace).sort((a, b) => b[1] - a[1]);
const sortedHotspots = stats.hotspots.sort((a, b) => b.count - a.count).slice(0, 15);

// Generate Markdown
let report = `# 📊 Esparex Technical Debt Insights\n\n`;
report += `**Generated on:** ${new Date().toLocaleString()}\n`;
report += `**Total Violations Locked:** ${stats.totalViolations}\n`;
report += `**Affected Files:** ${stats.totalFiles}\n\n`;

report += `## 🏢 Debt by Workspace\n`;
report += `| Workspace | Violations | % of Total |\n`;
report += `| :--- | :--- | :--- |\n`;
sortedWorkspaces.forEach(([ws, count]) => {
    const pct = ((count / stats.totalViolations) * 100).toFixed(1);
    report += `| ${ws} | ${count} | ${pct}% |\n`;
});

report += `\n## 🚨 Top Violating Rules (The "Burn-down" List)\n`;
report += `| Rule ID | Count | Impact |\n`;
report += `| :--- | :--- | :--- |\n`;
sortedRules.slice(0, 15).forEach(([rule, count]) => {
    let impact = 'Maintenance';
    if (rule.includes('react-hooks')) impact = 'Runtime Stability';
    if (rule.includes('typescript-eslint')) impact = 'Type Safety';
    if (rule.includes('esparex')) impact = 'CRITICAL GOVERNANCE';
    report += `| \`${rule}\` | ${count} | ${impact} |\n`;
});

report += `\n## 🔥 Hotspots (Fix these first to clear 20% of debt)\n`;
report += `| File Path | Violations | Complexity |\n`;
report += `| :--- | :--- | :--- |\n`;
sortedHotspots.forEach(h => {
    report += `| \`${h.file}\` | ${h.count} | High |\n`;
});

report += `\n## 🚀 Recommended Remediation Plan\n`;
report += `1. **Cleanup the Hotspots:** Addressing the top 15 files will remove ~${sortedHotspots.reduce((a, b) => a + b.count, 0)} violations.\n`;
report += `2. **Type Safety Drive:** Fix the \`@typescript-eslint/no-explicit-any\` issues to restore type integrity.\n`;
report += `3. **Governance Zero:** There should be 0 \`esparex/\` rules in this list. Fix those immediately.\n`;

fs.writeFileSync(REPORT_PATH, report);
console.log(`🎉 Insights report generated at: ${REPORT_PATH}`);
