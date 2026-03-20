const http = require('http');

async function testFetch() {
    const getCsrfOptions = {
        hostname: 'localhost',
        port: 5001,
        path: '/api/v1/admin/csrf-token',
        method: 'GET'
    };

    const csrfRes = await new Promise((resolve) => {
        http.request(getCsrfOptions, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ data: JSON.parse(data), cookie: res.headers['set-cookie'] }));
        }).end();
    });

    const csrfToken = csrfRes.data.csrfToken;
    const sessionCookie = csrfRes.cookie;

    const loginBody = JSON.stringify({ email: 'admin@esparex.com', password: 'password123' });
    const loginOptions = {
        hostname: 'localhost',
        port: 5001,
        path: '/api/v1/admin/auth/login',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(loginBody),
            'x-csrf-token': csrfToken,
            'Cookie': sessionCookie
        }
    };

    const loginRes = await new Promise((resolve) => {
        const req = http.request(loginOptions, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ data, cookie: res.headers['set-cookie'] }));
        });
        req.write(loginBody);
        req.end();
    });

    const tokens = loginRes.cookie;
    if (!tokens) { console.error('Login failed:', loginRes.data); return; }

    const reqBody = '';
    const businessesOptions = {
        hostname: 'localhost',
        port: 5001,
        path: '/api/v1/admin/businesses/requests?status=pending',
        method: 'GET',
        headers: {
            'Cookie': sessionCookie.concat(tokens).join(';')
        }
    };

    const businessesRes = await new Promise((resolve) => {
        http.request(businessesOptions, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).end();
    });

    console.log('Businesses:', JSON.stringify(JSON.parse(businessesRes), null, 2));
}

testFetch().catch(console.error);
