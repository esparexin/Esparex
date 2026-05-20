const http = require('http');

async function login() {
  return new Promise((resolve) => {
    const data = JSON.stringify({ email: 'admin@esparex.com', password: 'Admin@123' });
    const req = http.request({
      hostname: 'localhost',
      port: 5001,
      path: '/api/v1/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, res => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        resolve({
          cookies: res.headers['set-cookie'] || [],
          body: JSON.parse(body)
        });
      });
    });
    req.write(data);
    req.end();
  });
}

async function getListings(cookies) {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: 5001,
      path: '/api/v1/admin/listings?status=live',
      method: 'GET',
      headers: {
        'Cookie': cookies.join(';')
      }
    }, res => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        resolve(JSON.parse(body));
      });
    });
    req.end();
  });
}

async function main() {
  const auth = await login();
  console.log('Login body:', auth.body);
  const listings = await getListings(auth.cookies);
  console.log('Listings length:', listings.data?.items?.length, 'Total:', listings.data?.pagination?.total);
  console.log('First listing:', listings.data?.items?.[0] ? 'Exists' : 'None');
}
main();
