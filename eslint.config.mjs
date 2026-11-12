import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import tseslint from "typescript-eslint";

export default defineConfig([
  globalIgnores([
    "node_modules/**",
    ".next/**",
    "out/**",
    "build/**",
    "dist/**",
    "next-env.d.ts",
    "src-tauri/**",
    "scripts/**",
    "supabase/**",
  ]),

  // Next.js core-web-vitals + TypeScript presets (flat config).
  nextVitals,
  nextTs,

  // TypeScript ESLint recommended ruleset (non type-checked) — no type-aware
  // pass, so the lint run stays fast.
  ...tseslint.configs.recommended,

  {
    files: ["**/*.{js,jsx,mjs,ts,tsx,mts,cts}"],
    rules: {
      // The codebase intentionally uses `any` for Supabase JSON columns.
      "@typescript-eslint/no-explicit-any": "off",

      // Unused vars are common in WIP/admin scaffolding; keep them visible but
      // non-fatal. Underscore-prefixed names are always allowed.
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrors: "none",
        },
      ],

      // The project deliberately renders plain <img> for remote Supabase Storage
      // / Google thumbnail URLs (no `images.remotePatterns` in next.config.ts).
      "@next/next/no-img-element": "off",

      // Exhaustive-deps is advisory only — the codebase has intentional effect
      // patterns (never an error).
      "react-hooks/exhaustive-deps": "warn",

      // React Compiler rule: flags `setState` called synchronously inside an
      // effect. Every hit in this codebase is a deliberate pattern (resetting a
      // dialog form on open, clearing the search box on route change, marking
      // a fetch as loading) rather than a bug, and fixing them properly means
      // restructuring components. Report them instead of failing the lint run.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]);
