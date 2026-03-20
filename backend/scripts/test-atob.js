const b = "eyJpZCI6IjY5YTU0MmJmOTg1Y2FiMDQ4MzVkM2U2MiIsIm1vYmlsZSI6Iis5MTk5OTk5OTk5OTUiLCJyb2xlIjoidXNlciIsImlhdCI6MTc0MDkwMDg4OSwiZXhwIjoxNzQwOTA0NDg5LCJ0b2tlblZlcnNpb24iOjB9"; // 164 chars, divisible by 4
const b2 = "eyJpZCI6IjY5YTU0MmJmOTg1Y2FiMDQ4MzVkM2U2MiIsIm1vYmlsZSI6Iis5MTk5OTk5OTk5OTUiLCJyb2xlIjoidXNlciIsImlhdCI6MTc0MDkwMDg4OSwiZXhwIjoxNzQwOTA0NDg5LCJ0b2tlblZlcnNpb24iOjB9a"

try { console.log("1", !!atob(b)); } catch (e) { console.log("E1", e.message); }
try { console.log("2", !!atob(b2)); } catch (e) { console.log("E2", e.message); }
