// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: [
      "dist/*",
      "node_modules/*",
      ".expo/*",
      "web-build/*",
      "backend/dist/*",
      "backend/node_modules/*",
      "*.config.js",
      "metro.config.js"
    ],
    rules: {
      // Production-ready rules
      'no-console': 'warn',
      'no-debugger': 'error',
      'no-unused-vars': 'error',
      '@typescript-eslint/no-unused-vars': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      // React Native specific
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/rules-of-hooks': 'error',
      // Code quality
      'eqeqeq': 'error',
      'no-undef': 'error',
      'no-unreachable': 'error'
    }
  }
]);
