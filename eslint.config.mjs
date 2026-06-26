import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Payload's loosely-typed documents make `any` pervasive and idiomatic
      // across this codebase; keep these visible as warnings rather than
      // failing CI on style. Real correctness rules (e.g. rules-of-hooks)
      // stay as errors.
      "@typescript-eslint/no-explicit-any": "warn",
      "react/no-unescaped-entities": "warn",
      "@typescript-eslint/ban-ts-comment": "warn",
      // React Compiler advisories that fire on intentional patterns here
      // (Math.random for the particle field; matchMedia/interval effects).
      // Kept as warnings; rules-of-hooks stays an error.
      "react-hooks/purity": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/immutability": "warn",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
