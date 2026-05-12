const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/esparex_user';

async function seedAliasesAndSynonyms() {
    try {
        await mongoose.connect(MONGODB_URI);
        const db = mongoose.connection.db;
        
        console.log('--- SEEDING ALIASES AND SYNONYMS ---');

        const brandAliases = [
            { name: 'Apple', aliases: ['i-phone', 'i phone', 'macbook', 'ipad', 'airpods'] },
            { name: 'Samsung', aliases: ['galaxy', 's-series', 'note', 'fold', 'flip'] },
            { name: 'Google', aliases: ['pixel', 'pixel phone'] },
            { name: 'OnePlus', aliases: ['1plus', 'one plus'] },
            { name: 'Xiaomi', aliases: ['mi', 'redmi', 'poco'] },
            { name: 'Motorola', aliases: ['moto'] },
            { name: 'Nothing', aliases: ['cmf'] }
        ];

        for (const item of brandAliases) {
            await db.collection('brands').updateOne(
                { name: item.name, isDeleted: false },
                { $addToSet: { aliases: { $each: item.aliases } } }
            );
            console.log(`Updated aliases for ${item.name}`);
        }

        const synonyms = [
            { term: 'screen size', synonyms: ['display', 'panel', 'inches'] },
            { term: 'brand', synonyms: ['manufacturer', 'maker', 'company'] },
            { term: 'model', synonyms: ['device', 'version', 'variant'] }
        ];

        for (const item of synonyms) {
            await db.collection('taxonomySynonyms').updateOne(
                { term: item.term },
                { $set: { synonyms: item.synonyms, updatedAt: new Date() } },
                { upsert: true }
            );
            console.log(`Updated synonyms for ${item.term}`);
        }

        console.log('Seed complete.');

    } catch (err) {
        console.error('Seed failed:', err);
    } finally {
        await mongoose.disconnect();
    }
}

seedAliasesAndSynonyms();
