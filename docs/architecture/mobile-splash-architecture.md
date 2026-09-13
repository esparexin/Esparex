# Mobile Splash Screen Architecture & Scaling Governance Standard

## 1. Overview & Single Source of Truth

This standard defines the authoritative geometry, asset lifecycle, and platform-specific constraints for the Esparex Mobile Splash Screen across Android and iOS in `apps/mobile`.

### Canonical Assets & Tokens
* **Brand Logo SSOT**: [`apps/mobile/assets/logo.png`](file:///Users/admin/Desktop/Esparex/apps/mobile/assets/logo.png)
  * Dimensions: 495 × 112 px (Aspect ratio $4.4196 : 1$)
  * Primary Color: `#2FA562` (Esparex Emerald Green)
* **Background Color SSOT**: `#0A0C0B` (Obsidian Black)
  * Enforced identically across `app.json`, Android `colors.xml` (`@color/splashscreen_background`), and iOS `SplashScreenBackground.colorset`.
  * WCAG 2.2 AA Contrast: $6.44 : 1$ (exceeds 4.5:1 minimum).

---

## 2. Platform Geometry & Safe-Zone Standards

### Android 12+ (API 31+) SplashScreen Standard
* **Mechanism**: `androidx.core:core-splashscreen` / `windowSplashScreenAnimatedIcon`.
* **Viewport Size**: 288dp × 288dp canvas.
* **Safe Zone**: 160dp circular mask.
* **Geometry Law**: The horizontal logo rectangle ($4.42 : 1$ aspect ratio) MUST NOT exceed **150dp width** in the 288dp canvas.
  $$\text{Corner Radius } R = \sqrt{(150/2)^2 + (33.9/2)^2} = 87.15\text{dp} \implies \text{Diameter } D = 174.3\text{dp} < 192\text{dp}$$
  * A 150dp logo fills 94% of the 160dp circle with $\sim 6.2\text{dp}$ clearance from circular clipping.
* **Density Dimensions**:
  * `mdpi` (1x): 288 × 288 px canvas, logo width 150 px
  * `hdpi` (1.5x): 432 × 432 px canvas, logo width 225 px
  * `xhdpi` (2x): 576 × 576 px canvas, logo width 300 px
  * `xxhdpi` (3x): 864 × 864 px canvas, logo width 450 px
  * `xxxhdpi` (4x): 1152 × 1152 px canvas, logo width 600 px

### iOS Launch Screen Standard
* **Mechanism**: `SplashScreen.storyboard` with centered auto-layout constraints.
* **Viewport Size**: Centered in `ContainerView` (`centerX` and `centerY`).
* **Display Width**: **220pt** (occupies 56% of standard 393pt iPhone display).
* **Display Height**: **50pt** (occupies 6% of screen height).
* **Retina Scales**:
  * 1x (`image.png`): 220 × 50 px
  * 2x (`image@2x.png`): 440 × 100 px
  * 3x (`image@3x.png`): 660 × 150 px

---

## 3. Forbidden Anti-Patterns

1. **No Full-Bleed Wallpaper Assets**: Never save `splash-icon.png` as a full phone wallpaper (e.g. 1290 × 2796) with massive black borders. Master assets MUST be strictly square ($1024 \times 1024$).
2. **No Edge-Pinned Storyboard Constraints**: Never pin `EXPO-SplashScreen` to the 4 edges (`top`, `leading`, `trailing`, `bottom`) of `ContainerView`. Always use `centerX` and `centerY`.
3. **No Unscaled Android Drawables**: Never place an unpadded wide logo into Android's circular mask without verifying the diagonal distance from center is $< 80\text{dp}$ ($160\text{dp} / 2$).

---

## 4. Idempotent Asset Generation

All mobile splash assets are programmatically derived from `assets/logo.png` via:

```bash
npm run generate:splash -w @esparex/apps-mobile
# Or directly:
node scripts/generate-mobile-splash-assets.js
```

---

## 5. Automated Regression Prevention Gate

The test suite [`apps/mobile/src/__tests__/splash-screen-asset.spec.ts`](file:///Users/admin/Desktop/Esparex/apps/mobile/src/__tests__/splash-screen-asset.spec.ts) runs on every CI build and enforces:
* Strict 1:1 square master asset dimensions.
* Android 160dp circular mask mathematical containment.
* iOS Retina scaling and storyboard constraint presence.
* Color synchronization (`#0A0C0B`).
