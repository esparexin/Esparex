module.exports = {
  root: true,
  extends: ["expo"],
  plugins: ["react-native"],
  rules: {
    "no-restricted-imports": ["error", {
      "paths": [{
        "name": "react-native",
        "importNames": ["Text", "TextInput", "Button"],
        "message": "Please use AppText, AppInput, and AppButton from @esparex/mobile-ui instead to comply with UI_GOVERNANCE.md"
      }]
    }],
    "react-native/no-inline-styles": "error",
    "react-native/no-color-literals": "error"
  }
};
