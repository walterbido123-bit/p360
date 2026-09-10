import js from "@eslint/js";
export default [js.configs.recommended, { files: ["src/**/*.ts"], languageOptions: { parserOptions: { ecmaVersion: "latest", sourceType: "module" } } }];
