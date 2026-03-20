function isJwtLikelyValid(token) {
    if (!token) return false;
    const parts = token.split(".");
    if (parts.length !== 3) return false;

    try {
        const payloadPart = parts[1];
        if (!payloadPart) return false;

        const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
        const payload = JSON.parse(atob(base64 || ""));
        const exp = typeof payload?.exp === "number" ? payload.exp : null;
        if (!exp) return true;
        return exp * 1000 > Date.now();
    } catch (e) {
        console.log("Error inside isJwtLikelyValid:", e.message);
        return false;
    }
}

// simulate a real token from earlier, parts[1] is base64url without padding
const dummyTokenPayload = "eyJpZCI6IjY5YTU0MmJmOTg1Y2FiMDQ4MzVkM2U2MiIsIm1vYmlsZSI6Iis5MTk5OTk5OTk5OTUiLCJyb2xlIjoidXNlciIsImlhdCI6MTc0MDkwMDg4OSwiZXhwIjoxNzQwOTA0NDg5LCJ0b2tlblZlcnNpb24iOjB9"; // 164 chars, length%4 == 0 (wait, this works)

// What if length is not div by 4?
const token2 = "x.eyJpZCIsImEiOjF9.z"; // length 18 -> 18%4 == 2. unpadded.
console.log("Valid 2?", isJwtLikelyValid(token2));

const token3 = "x.eyJmaXJzdE5hbWUiOiJIZWxsbyIsImxhc3ROYW1lIjoiV29ybGQifQ.z";
console.log("Valid 3?", isJwtLikelyValid(token3));

