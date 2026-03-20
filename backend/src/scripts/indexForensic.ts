import mongoose from 'mongoose';
import { getUserConnection } from '../config/db';
import logger from '../utils/logger';

export async function deepForensicInventory() {
    logger.info('--- Esparex Deep Forensic Ad Index Inventory ---');
    
    const db = getUserConnection();
    const Ad = db.collection('ads');
    
    try {
        const indexes = await Ad.indexes();
        
        console.log('\n--- 📂 Ad Index List ---');
        indexes.forEach(idx => {
            console.log(`Name: ${idx.name}`);
            console.log(`Key:  ${JSON.stringify(idx.key)}`);
            if (idx.partialFilterExpression) {
                console.log(`Filter: ${JSON.stringify(idx.partialFilterExpression)}`);
            }
            if (idx.unique) console.log(`Unique: true`);
            console.log('---');
        });

        // Detect redundant indexes (same logical key but different names/filters)
        const keyMap = new Map();
        indexes.forEach(idx => {
            const keyStr = JSON.stringify(idx.key);
            if (!keyMap.has(keyStr)) keyMap.set(keyStr, []);
            keyMap.get(keyStr).push(idx);
        });

        console.log('\n--- ⚠️ Redundancy Analysis ---');
        for (const [key, idxs] of keyMap.entries()) {
            if (idxs.length > 1) {
                console.warn(`Key ${key} is covered by ${idxs.length} indexes:`);
                idxs.forEach((i: any) => console.log(`  - ${i.name} ${i.partialFilterExpression ? '(Partial)' : '(Full)'}`));
            }
        }

    } catch (error) {
        logger.error('Inventory failed', { error });
        throw error;
    }
}

if (require.main === module) {
    const { connectDB } = require('../config/db');
    connectDB().then(() => {
        deepForensicInventory().then(() => {
            logger.info('Inventory script finished.');
            process.exit(0);
        }).catch(err => {
            logger.error('Inventory failed', err);
            process.exit(1);
        });
    });
}
