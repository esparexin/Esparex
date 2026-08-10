import fs from "fs";
import path from "path";

describe("Logo Asset Integrity Guard", () => {
  it("verifies public/icons/logo.png exists and has cropped landscape dimensions", () => {
    const relativeToApp = path.resolve(process.cwd(), "public/icons/logo.png");
    const relativeToMonorepo = path.resolve(process.cwd(), "apps/web/public/icons/logo.png");
    
    const logoPath = fs.existsSync(relativeToApp) ? relativeToApp : relativeToMonorepo;
    expect(fs.existsSync(logoPath)).toBe(true);

    const buffer = fs.readFileSync(logoPath);
    expect(buffer.length).toBeGreaterThan(0);

    // PNG header check (8 bytes: 137 80 78 71 13 10 26 10)
    expect(buffer[0]).toBe(0x89);
    expect(buffer[1]).toBe(0x50); // P
    expect(buffer[2]).toBe(0x4e); // N
    expect(buffer[3]).toBe(0x47); // G

    // Read width and height from IHDR chunk (offset 16-24)
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);

    // Assert cropped dimensions (no 500x500 square padding)
    expect(width).toBeGreaterThan(300);
    expect(height).toBeLessThanOrEqual(150);

    // Assert landscape aspect ratio (> 3.5:1)
    const aspectRatio = width / height;
    expect(aspectRatio).toBeGreaterThan(3.5);
  });
});
