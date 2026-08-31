# Esparex Mobile App UX Standards (Expo React Native)

The Mobile App (`apps/mobile`) serves iOS & Android users via Expo React Native.

---

## 1. Native Interaction Guidelines

- **Touch Targets**: All touchable elements (`TouchableOpacity`, `Pressable`) MUST meet the 44×44dp minimum target size.
- **Safe Area Insets**: Wrap screens using `useSafeAreaInsets()` to prevent UI overlap with iPhone notch, dynamic island, or Android navigation bars.
- **Bottom Sheets & Drawers**: Prefer native bottom sheets (`@gorhom/bottom-sheet` or `packages/mobile-ui` `BottomSheet`) over full-screen modal overlays for quick filter/category selections.

---

## 2. Shared Token Consumption

- Mobile surfaces MUST consume `@esparex/design-tokens` or `@esparex/mobile-ui`.
- Do not introduce custom mobile-only color palettes or arbitrary pixel radius overrides.
