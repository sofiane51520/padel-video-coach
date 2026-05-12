const expoConfig = require("eslint-config-expo/flat");

module.exports = [
  {
    ignores: ["dist/*", "node_modules/*", ".expo/*", "backend/.venv/*", "backend/.data/*"]
  },
  ...expoConfig
];
