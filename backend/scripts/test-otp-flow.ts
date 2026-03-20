import axios from 'axios';

async function testAuth() {
    try {
        console.log("Fetching CSRF Token...");
        const csrfRes = await axios.get('http://127.0.0.1:5001/api/v1/csrf-token', {
            withCredentials: true
        });
        const csrfToken = csrfRes.data.csrfToken;
        const cookies = csrfRes.headers['set-cookie'];
        console.log("CSRF Token:", csrfToken);

        const api = axios.create({
            baseURL: 'http://127.0.0.1:5001/api/v1/auth',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': csrfToken,
                'Cookie': cookies ? cookies.join('; ') : ''
            },
            withCredentials: true
        });

        console.log("Sending OTP...");
        const sendRes = await api.post('/send-otp', {
            mobile: '9999999999'
        });
        console.log("Send OTP Res:", sendRes.data);

        console.log("Verifying OTP...");
        const verifyRes = await api.post('/verify-otp', {
            mobile: '9999999999',
            otp: '123456',
        });
        console.log("Verify OTP Res:", verifyRes.data);
    } catch (e: any) {
        if (e.response) {
            console.error("Error Response:", e.response.status, e.response.data);
        } else {
            console.error("Error:", e.message);
        }
    }
}

testAuth();
