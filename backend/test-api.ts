import * as dotenv from 'dotenv';
dotenv.config();
import fetch from 'node-fetch';

async function testApi() {
    const url = 'http://localhost:5001/api/v1/user/catalog/screen-sizes?categoryId=692fae5f264647e70b11bfdd';
    try {
        const res = await fetch(url);
        const json = await res.json();
        console.log('API Response:', JSON.stringify(json, null, 2));
    } catch (e) {
        console.error('API Error:', e);
    }
}
testApi();
