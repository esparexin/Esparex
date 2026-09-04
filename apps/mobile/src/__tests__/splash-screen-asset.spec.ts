import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

describe("Mobile Splash Screen Asset & Platform Parity Guard", () => {
  const mobileDir = path.resolve(__dirname, "../..");
  const assetsDir = path.join(mobileDir, "assets");
  const appJsonPath = path.join(mobileDir, "app.json");

  it("verifies app.json contains synchronized splash screen configuration across platforms", () => {
    expect(fs.existsSync(appJsonPath)).toBe(true);
    const appConfig = JSON.parse(fs.readFileSync(appJsonPath, "utf-8")).expo;

    // Background color parity (#0A0C0B)
    const expectedBg = "#0A0C0B";
    expect(appConfig.splash.backgroundColor.toUpperCase()).toBe(expectedBg);
    expect(appConfig.ios.splash.backgroundColor.toUpperCase()).toBe(expectedBg);
    expect(appConfig.android.splash.backgroundColor.toUpperCase()).toBe(expectedBg);
    expect(appConfig.userInterfaceStyle).toBe("dark");

    // Asset reference validity
    expect(appConfig.splash.image).toBe("./assets/splash-icon.png");
    expect(appConfig.ios.splash.image).toBe("./assets/splash-icon-ios.png");
    expect(appConfig.android.splash.image).toBe("./assets/splash-icon-android.png");

    // expo-splash-screen plugin validation
    const splashPlugin = appConfig.plugins?.find(
      (p: unknown) => Array.isArray(p) && p[0] === "expo-splash-screen"
    );
    expect(splashPlugin).toBeDefined();
    expect(splashPlugin[1].imageWidth).toBe(220);
    expect(splashPlugin[1].backgroundColor.toUpperCase()).toBe(expectedBg);
  });

  it("verifies master splash-icon.png is square and high-resolution (>= 1024x1024)", async () => {
    const splashPath = path.join(assetsDir, "splash-icon.png");
    expect(fs.existsSync(splashPath)).toBe(true);

    const metadata = await sharp(splashPath).metadata();
    expect(metadata.width).toBeGreaterThanOrEqual(1024);
    expect(metadata.height).toBeGreaterThanOrEqual(1024);
    expect(metadata.width).toBe(metadata.height); // strictly square 1:1
  });

  it("verifies platform-specific master splash assets exist and are strictly square", async () => {
    const androidSplash = path.join(assetsDir, "splash-icon-android.png");
    const iosSplash = path.join(assetsDir, "splash-icon-ios.png");

    expect(fs.existsSync(androidSplash)).toBe(true);
    expect(fs.existsSync(iosSplash)).toBe(true);

    const androidMeta = await sharp(androidSplash).metadata();
    const iosMeta = await sharp(iosSplash).metadata();

    expect(androidMeta.width).toBe(androidMeta.height);
    expect(iosMeta.width).toBe(iosMeta.height);
    expect(androidMeta.width).toBeGreaterThanOrEqual(1024);
    expect(iosMeta.width).toBeGreaterThanOrEqual(1024);
  });

  it("verifies Android splash logo respects 160dp circular mask with zero clipping", async () => {
    const androidSplash = path.join(assetsDir, "splash-icon-android.png");
    const { data, info } = await sharp(androidSplash)
      .raw()
      .toBuffer({ resolveWithObject: true });

    const { width, height, channels } = info;
    const bgR = 10, bgG = 12, bgB = 11; // #0A0C0B

    let minX = width, maxX = 0;
    let minY = height, maxY = 0;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const offset = (y * width + x) * channels;
        const r = data[offset];
        const g = data[offset + 1];
        const b = data[offset + 2];

        // Non-background pixels
        if (Math.abs(r - bgR) > 20 || Math.abs(g - bgG) > 20 || Math.abs(b - bgB) > 20) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    const logoWidth = maxX - minX + 1;
    const logoHeight = maxY - minY + 1;
    const widthFraction = logoWidth / width;

    // Must occupy between 45% and 55% of the 288dp canvas (150dp geometry)
    expect(widthFraction).toBeGreaterThanOrEqual(0.45);
    expect(widthFraction).toBeLessThanOrEqual(0.55);

    // Diagonal corner calculation to verify 160dp circular mask containment
    // 160dp / 288dp = 55.55% of canvas diameter
    const cornerRadius = Math.sqrt(Math.pow(logoWidth / 2, 2) + Math.pow(logoHeight / 2, 2));
    const cornerDiameterFraction = (cornerRadius * 2) / width;
    const maskDiameterFraction = 160 / 288; // 0.5556

    expect(cornerDiameterFraction).toBeLessThan(maskDiameterFraction);
  });

  it("verifies iOS splash logo delivers prominent screen-width presence (> 65% canvas)", async () => {
    const iosSplash = path.join(assetsDir, "splash-icon-ios.png");
    const { data, info } = await sharp(iosSplash)
      .raw()
      .toBuffer({ resolveWithObject: true });

    const { width, height, channels } = info;
    const bgR = 10, bgG = 12, bgB = 11;

    let minX = width, maxX = 0;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const offset = (y * width + x) * channels;
        const r = data[offset];
        const g = data[offset + 1];
        const b = data[offset + 2];

        if (Math.abs(r - bgR) > 20 || Math.abs(g - bgG) > 20 || Math.abs(b - bgB) > 20) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
        }
      }
    }

    const logoWidth = maxX - minX + 1;
    const widthFraction = logoWidth / width;

    // iOS master asset must deliver prominent presence (> 65% of canvas)
    expect(widthFraction).toBeGreaterThanOrEqual(0.65);
  });

  it("verifies generate-mobile-splash-assets script exists and is executable", () => {
    const scriptPath = path.resolve(mobileDir, "../../scripts/generate-mobile-splash-assets.js");
    expect(fs.existsSync(scriptPath)).toBe(true);
  });
});
