import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';

async function run() {
  const jar = new CookieJar();
  const c = wrapper(axios.create({ baseURL: 'http://127.0.0.1:5001', jar, withCredentials: true }));
  try {
    const r1 = await c.get('/api/v1/csrf-token');
    const csrfToken = r1.data.csrfToken;

    const headers = { 'X-CSRF-Token': csrfToken };

    await c.post('/api/v1/auth/send-otp', { mobile: '9999999995' }, { headers });
    console.log("OTP Sent");

    const r3 = await c.post('/api/v1/auth/verify-otp', { mobile: '9999999995', otp: '123456', name: 'TestUser' }, { headers });
    console.log("Verify Result:", r3.data.success);
    console.log("Auth Cookie in Jar:", !!jar.getCookieStringSync('http://127.0.0.1:5001').includes('esparex_auth'));

    try {
      const r4 = await c.get('/api/v1/users/me', { headers });
      console.log("Users/Me Success:", r4.data);
    } catch (e: any) {
      console.log("Users/Me Error:", e.response?.status, e.response?.data);
    }
  } catch (e: any) {
    console.log("Error:", e.response?.status, e.response?.data);
  }
}
run();
