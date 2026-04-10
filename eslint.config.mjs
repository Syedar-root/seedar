// @ts-check
import { createRequire } from 'node:module';

const require = createRequire(new URL('./apps/server/package.json', import.meta.url));
const js = require('@eslint/js');
const globals = require('globals');
const tseslint = require('typescript-eslint');

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.turbo/**',
      '**/.cache/**',
      '**/.claude/**',
      'apps/server/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: [
      'apps/web-client/**/*.{ts,tsx,js,jsx,mjs,cjs}',
      'packages/ui-react/**/*.{ts,tsx,js,jsx,mjs,cjs}',
      'packages/ui-core/**/*.{ts,tsx,js,jsx,mjs,cjs}',
      'packages/types/**/*.{ts,tsx,js,jsx,mjs,cjs}',
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      'no-unsafe-optional-chaining': 'off',
    },
  },
);
