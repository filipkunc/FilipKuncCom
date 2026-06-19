// Minimal, standard style gate. Two rules, enforced on the agent's edit surface.
// verify runs this with --no-inline-config, so an agent cannot pass by adding an
// eslint-disable comment: the disable is ignored and the rule still fires.
export default [
  {
    files: ["src/**/*.js", "test/**/*.js"],
    languageOptions: { ecmaVersion: "latest", sourceType: "module" },
    rules: {
      semi: ["error", "always"],
      quotes: ["error", "double"],
    },
  },
];
