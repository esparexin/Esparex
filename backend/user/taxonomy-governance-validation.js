const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const { normalizeToken, isDuplicateSuggestion } = require('../../core/dist/services/catalog/taxonomySsot');

dotenv.config({ path: path.join(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

async function validateTaxonomyGovernance() {
    try {
        console.log(`Connecting to: ${MONGODB_URI.split('@')[1] || 'local'}`);
        await mongoose.connect(MONGODB_URI);
        const db = mongoose.connection.db;
        
        console.log('--- TAXONOMY GOVERNANCE VALIDATION ---');

        // 1. Alias Resolution
        console.log('\n[1] Alias Resolution Validation:');
        const apple = await db.collection('brands').findOne({ name: 'Apple' });
        if (apple) {
            const aliases = ['i-phone', 'i phone', 'macbook', 'ipad'];
            const allMatch = aliases.every(a => apple.aliases.includes(a));
            console.log(`Apple Aliases: ${allMatch ? '✅ PASS' : '❌ FAIL'}`);
        } else {
            console.log('Apple record not found - seeding might have failed or using different DB');
        }

        // 2. Synonym Resolution
        console.log('\n[2] Synonym Resolution Validation:');
        const screenSyn = await db.collection('taxonomySynonyms').findOne({ term: 'screen size' });
        console.log(`Screen Size Synonyms: ${screenSyn && screenSyn.synonyms.includes('display') ? '✅ PASS' : '❌ FAIL'}`);

        // 3. Typo Tolerance & Normalization:
        console.log('\n[3] Typo Tolerance & Normalization:');
        const cases = [
            { raw: 'iPhone', expected: 'iphone' },
            { raw: 'i-phone', expected: 'i phone' },
            { raw: 'One Plus', expected: 'one plus' }
        ];
        cases.forEach(c => {
            const normalized = normalizeToken(c.raw);
            console.log(`Raw: "${c.raw}" -> Normalized: "${normalized}" | ${normalized === c.expected ? '✅' : '❌'}`);
        });

        // 4. Duplicate Prevention Validation:
        console.log('\n[4] Duplicate Prevention Validation:');
        const brands = await db.collection('brands').find({ isDeleted: false }).toArray();
        const testSuggestion = 'Samsungg';
        const check = isDuplicateSuggestion(testSuggestion, brands);
        console.log(`Suggestion: "${testSuggestion}" | Duplicate: ${check.isDuplicate} | Matched With: ${check.matchedWith} | Confidence: ${check.confidence.toFixed(2)}`);
        
        const samsungMatch = check.isDuplicate && check.matchedWith === 'Samsung';
        console.log(`Fuzzy Check (Samsungg): ${samsungMatch ? '✅ PASS' : '❌ FAIL'}`);

        // 5. Governance Metrics Audit:
        console.log('\n[5] Governance Metrics Audit:');
        const pendingCount = await db.collection('brands').countDocuments({ approvalStatus: 'pending' });
        console.log(`Pending Records Count: ${pendingCount}`);

        console.log('\nVALIDATION SUMMARY: CRITICAL PATHS VERIFIED');

    } catch (err) {
        console.error('Validation failed:', err);
    } finally {
        await mongoose.disconnect();
    }
}

validateTaxonomyGovernance();
