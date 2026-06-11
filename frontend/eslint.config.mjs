import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Soon features: keep out of lint gate until active development resumes.
    "src/app/(dashboard)/motion-graphics/**",
    "src/components/motion/**",
    "src/app/(dashboard)/video-clips/**",
  ]),
]);

export default eslintConfig;
