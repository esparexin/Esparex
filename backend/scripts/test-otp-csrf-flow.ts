import axios from 'axios';

async function run() {
  const c = axios.create({ baseURL: 'http://127.0.0.1:5001' });
  const ipHeaders = { 'X-Forwarded-For': '123.123.123.45' } // spoof unique IP each time to avoid bucket lock
  let csrfToken = '';
  let cookieHeader: string[] = [];

  try {
     console.log("1. Get CSRF");
     const r1 = await c.get('/api/v1/csrf-token', { headers: ipHeaders });
     csrfToken = r1.data.csrfToken;
     cookieHeader = r1.headers['set-cookie'] || [];

     console.log("2. /send-otp");
     const r2 = await c.post('/api/v1/auth/send-otp', { mobile: '9999999991' }, {
        headers: { 'X-CSRF-Token': csrfToken, 'Cookie': cookieHeader.join(';'), ...ipHeaders }
     });
     console.log(r2.data);

     console.log("3. /verify-otp (Expired - wrong mobile)");
     try {
       await c.post('/api/v1/auth/verify-otp', { mobile: '9999999992', otp: '123456' }, {
         headers: { 'X-CSRF-Token': csrfToken, 'Cookie': cookieHeader.join(';'), ...ipHeaders }
       });
     } catch(e:any) { console.log(e.response.status, e.response.data); }

  } catch (e: any) {
     console.log(e.response?.status, e.response?.data);
  }
}
run();
