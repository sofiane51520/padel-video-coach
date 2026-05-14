const expoConfig = require("eslint-config-expo/flat");

module.exports = [
  {
    ignores: ["dist/*", "node_modules/*", ".expo/*", "**/.expo/*"]
  },
  ...expoConfig,
  {
    rules: {
      "import/no-unresolved": "off"
    }
  }
];
