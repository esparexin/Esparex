#!/usr/bin/env node

/**
 * Cross-Platform Port Killer
 * Safely kills processes running on a specific port on Windows, macOS, and Linux.
 */

const { execSync } = require('child_process');

const port = process.argv[2] || '5001';

console.log(`🔍 Checking port ${port}...`);

if (process.platform === 'win32') {
    try {
        const output = execSync(`netstat -ano -p tcp`, { encoding: 'utf8' });
        const lines = output.split('\n');
        const searchPattern = new RegExp(`:${port}\\s+.*\\s+LISTENING\\s+(\\d+)`, 'i');
        
        let pidToKill = null;
        for (const line of lines) {
            const match = line.match(searchPattern);
            if (match && match[1]) {
                pidToKill = match[1].trim();
                break;
            }
        }
        
        if (pidToKill) {
            console.log(`💥 Found process PID ${pidToKill} on port ${port}. Killing...`);
            execSync(`taskkill /F /PID ${pidToKill}`);
            console.log(`✅ Port ${port} successfully cleared.`);
        } else {
            console.log(`ℹ️ No active process detected on port ${port}.`);
        }
    } catch (e) {
        console.log(`ℹ️ Port ${port} is clear or query failed: ${e.message}`);
    }
} else {
    // Unix platforms
    try {
        const pids = execSync(`lsof -t -i:${port}`, { encoding: 'utf8' }).trim();
        if (pids) {
            console.log(`💥 Found processes [${pids.split('\n').join(', ')}] on port ${port}. Killing...`);
            execSync(`kill -9 ${pids.split('\n').join(' ')}`);
            console.log(`✅ Port ${port} successfully cleared.`);
        } else {
            console.log(`ℹ️ No active process detected on port ${port}.`);
        }
    } catch (e) {
        console.log(`ℹ️ Port ${port} is clear or query failed: ${e.message}`);
    }
}
