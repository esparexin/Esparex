#!/usr/bin/env node

/**
 * generate-mobile-splash-assets.js
 *
 * Single Source of Truth generator for Esparex Mobile splash screen assets.
 * Mathematically scales and centers the canonical brand logo (assets/logo.png)
 * across all Android density drawables and iOS Retina imagesets, enforcing:
 *
 * 1. Android 12+ circular safe-zone bounds (150dp width in 288dp canvas -> 100% inside 160dp mask).
 * 2. iOS Retina scaling (220pt width -> 1x: 220x50, 2x: 440x100, 3x: 660x150).
 * 3. Master 1024x1024 splash-icon.png for Expo prebuild parity.
 * 4. Obsidian dark background (#0A0C0B) color synchronization.
 */

const fs = require("node:fs");
const path = require("node:path");
const sharp = require("sharp");

const repoRoot = path.resolve(__dirname, "..");
const mobileDir = path.join(repoRoot, "apps", "mobile");
const logoPath = path.join(mobileDir, "assets", "logo.png");

const BG_COLOR = { r: 10, g: 12, b: 11, alpha: 1 }; // #0A0C0B

if (!fs.existsSync(logoPath)) {
  console.error(`Error: Logo not found at ${logoPath}`);
  process.exit(1);
}

async function run() {
  console.log("▶ Generating Esparex mobile splash screen assets...");

  const logoMetadata = await sharp(logoPath).metadata();
  const logoAspect = logoMetadata.width / logoMetadata.height; // 495 / 112 = 4.4196
  console.log(`  Source Logo: ${logoMetadata.width}x${logoMetadata.height} (Aspect: ${logoAspect.toFixed(4)})`);

  // 1. Generate master splash-icon-android.png & splash-icon.png (1024x1024, logo width = 533px, height = 121px)
  // 533px in 1024px canvas = 52.1%, exactly 150dp in Android 288dp canvas (100% inside 160dp circular mask)
  const masterWidth = 1024;
  const androidLogoWidth = Math.round(masterWidth * (150 / 288)); // 533px
  const androidLogoHeight = Math.round(androidLogoWidth / logoAspect); // 121px

  const androidLogoBuffer = await sharp(logoPath)
    .resize(androidLogoWidth, androidLogoHeight, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .toBuffer();

  const masterSplashAndroidPath = path.join(mobileDir, "assets", "splash-icon-android.png");
  const masterSplashPath = path.join(mobileDir, "assets", "splash-icon.png");

  const androidMasterBuffer = await sharp({
    create: {
      width: masterWidth,
      height: masterWidth,
      channels: 4,
      background: BG_COLOR,
    },
  })
    .composite([
      {
        input: androidLogoBuffer,
        top: Math.round((masterWidth - androidLogoHeight) / 2),
        left: Math.round((masterWidth - androidLogoWidth) / 2),
      },
    ])
    .png({ compressionLevel: 9 })
    .toBuffer();

  fs.writeFileSync(masterSplashAndroidPath, androidMasterBuffer);
  fs.writeFileSync(masterSplashPath, androidMasterBuffer);
  console.log(`  ✓ Master Android Splash: ${masterSplashAndroidPath} (${masterWidth}x${masterWidth}, logo: ${androidLogoWidth}x${androidLogoHeight})`);
  console.log(`  ✓ Master Universal Splash: ${masterSplashPath} (${masterWidth}x${masterWidth}, logo: ${androidLogoWidth}x${androidLogoHeight})`);

  // 2. Generate master splash-icon-ios.png (1024x1024, logo width = 780px, height = 176px)
  // 780px in 1024px canvas = 76.2%, delivers 220pt logo on iPhone screens with zero dead space
  const iosLogoWidth = 780;
  const iosLogoHeight = Math.round(iosLogoWidth / logoAspect); // 176px

  const iosLogoBuffer = await sharp(logoPath)
    .resize(iosLogoWidth, iosLogoHeight, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .toBuffer();

  const masterSplashIosPath = path.join(mobileDir, "assets", "splash-icon-ios.png");
  await sharp({
    create: {
      width: masterWidth,
      height: masterWidth,
      channels: 4,
      background: BG_COLOR,
    },
  })
    .composite([
      {
        input: iosLogoBuffer,
        top: Math.round((masterWidth - iosLogoHeight) / 2),
        left: Math.round((masterWidth - iosLogoWidth) / 2),
      },
    ])
    .png({ compressionLevel: 9 })
    .toFile(masterSplashIosPath);

  console.log(`  ✓ Master iOS Splash: ${masterSplashIosPath} (${masterWidth}x${masterWidth}, logo: ${iosLogoWidth}x${iosLogoHeight})`);

  // 2. Generate Android density drawables (288dp canvas, 150dp logo)
  const androidDensities = [
    { name: "drawable-mdpi", canvas: 288, multiplier: 1 },
    { name: "drawable-hdpi", canvas: 432, multiplier: 1.5 },
    { name: "drawable-xhdpi", canvas: 576, multiplier: 2 },
    { name: "drawable-xxhdpi", canvas: 864, multiplier: 3 },
    { name: "drawable-xxxhdpi", canvas: 1152, multiplier: 4 },
  ];

  for (const { name, canvas, multiplier } of androidDensities) {
    const lWidth = Math.round(150 * multiplier);
    const lHeight = Math.round(lWidth / logoAspect);
    const densityDir = path.join(mobileDir, "android", "app", "src", "main", "res", name);
    fs.mkdirSync(densityDir, { recursive: true });

    const lBuffer = await sharp(logoPath)
      .resize(lWidth, lHeight, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .toBuffer();

    const outputPath = path.join(densityDir, "splashscreen_logo.png");
    await sharp({
      create: {
        width: canvas,
        height: canvas,
        channels: 4,
        background: BG_COLOR,
      },
    })
      .composite([
        {
          input: lBuffer,
          top: Math.round((canvas - lHeight) / 2),
          left: Math.round((canvas - lWidth) / 2),
        },
      ])
      .png({ compressionLevel: 9 })
      .toFile(outputPath);

    console.log(`  ✓ Android ${name}: ${outputPath} (${canvas}x${canvas}, logo: ${lWidth}x${lHeight})`);
  }

  // 3. Generate iOS Retina imageset (transparent background, exact 1x: 220x50, 2x: 440x100, 3x: 660x150)
  const iosScales = [
    { filename: "image.png", width: 220, height: 50, scale: "1x" },
    { filename: "image@2x.png", width: 440, height: 100, scale: "2x" },
    { filename: "image@3x.png", width: 660, height: 150, scale: "3x" },
  ];

  const iosImageSetDir = path.join(
    mobileDir,
    "ios",
    "Esparex",
    "Images.xcassets",
    "SplashScreenLogo.imageset"
  );
  fs.mkdirSync(iosImageSetDir, { recursive: true });

  for (const { filename, width, height, scale } of iosScales) {
    const outputPath = path.join(iosImageSetDir, filename);
    await sharp(logoPath)
      .resize(width, height, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png({ compressionLevel: 9 })
      .toFile(outputPath);

    console.log(`  ✓ iOS Retina (${scale}): ${outputPath} (${width}x${height})`);
  }

  // Ensure iOS Contents.json is present and valid
  const contentsJsonPath = path.join(iosImageSetDir, "Contents.json");
  const contentsJson = {
    images: [
      { idiom: "universal", filename: "image.png", scale: "1x" },
      { idiom: "universal", filename: "image@2x.png", scale: "2x" },
      { idiom: "universal", filename: "image@3x.png", scale: "3x" },
    ],
    info: {
      version: 1,
      author: "expo",
    },
  };
  fs.writeFileSync(contentsJsonPath, JSON.stringify(contentsJson, null, 2) + "\n");
  console.log(`  ✓ iOS Contents.json: ${contentsJsonPath}`);

  console.log("✅ All splash screen assets generated successfully!");
}

run().catch((err) => {
  console.error("Failed to generate splash assets:", err);
  process.exit(1);
});
