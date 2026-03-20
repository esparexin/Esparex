'use strict';
require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

const TABLETS_ID = new ObjectId('6986e6735198ef7741aed1f6');
const LAPTOPS_ID = new ObjectId('6986e01272e5a623e69f097e');
const MOBILES_ID = new ObjectId('698741b2820e62e091a7a7d4');

MongoClient.connect(process.env.ADMIN_MONGODB_URI).then(async client => {
    const db = client.db('esparex_admin');

    const all = await db.collection('models').find({ categoryId: null }).toArray();
    console.log('All null-categoryId models count:', all.length);
    all.forEach(m => console.log(' -', m.name, '| isDeleted:', m.isDeleted, '| status:', m.status));

    const tabletKeywords = ['ipad', 'tab', 'surface'];
    const laptopKeywords = ['macbook', 'laptop', 'notebook', 'dell', 'thinkpad', 'lenovo', 'asus', 'acer', 'hp ', 'hp pavilion'];

    for (const m of all) {
        const name = m.name.toLowerCase();
        let targetId = null;
        if (tabletKeywords.some(kw => name.includes(kw))) {
            targetId = TABLETS_ID;
        } else if (laptopKeywords.some(kw => name.includes(kw))) {
            targetId = LAPTOPS_ID;
        } else {
            targetId = MOBILES_ID;
        }
        await db.collection('models').updateOne(
            { _id: m._id },
            { $set: { categoryId: targetId } }
        );
        console.log('  Remapped:', m.name, '→', targetId.toString() === TABLETS_ID.toString() ? 'Tablets' : targetId.toString() === LAPTOPS_ID.toString() ? 'Laptops' : 'Mobiles');
    }

    const finalCount = await db.collection('models').countDocuments({ categoryId: null });
    console.log('\nNull-categoryId models remaining:', finalCount);

    await client.close();
}).catch(e => { console.error(e.message); process.exit(1); });
