import nextConfig from "eslint-config-next";

const eslintConfig = [
  ...nextConfig,
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      ".claude/worktrees/**",
      "sanity.types.ts",
      "sanity/extract.json",
    ],
  },
];

export default eslintConfig;
