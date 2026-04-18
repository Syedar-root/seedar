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
  {
    files: ['packages/ui-react/src/hooks/**/*.{ts,tsx,js,jsx,mjs,cjs}'],
    rules: {
      'no-restricted-imports': [
        'warn',
        {
          patterns: [
            {
              group: [
                '../components/**',
                '../../components/**',
                '../../../components/**',
                '../../../../components/**',
              ],
              message:
                'ui-react 约束：hooks 层不要依赖 components 层，请改为抽到 hooks/utils/types，或从公开入口注入依赖。',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['packages/ui-react/src/utils/**/*.{ts,tsx,js,jsx,mjs,cjs}'],
    rules: {
      'no-restricted-imports': [
        'warn',
        {
          patterns: [
            {
              group: [
                '../components/**',
                '../../components/**',
                '../../../components/**',
                '../../../../components/**',
              ],
              message:
                'ui-react 约束：utils 层不要依赖 components 层，请保持为纯函数或纯配置。',
            },
            {
              group: [
                '../hooks/**',
                '../../hooks/**',
                '../../../hooks/**',
                '../../../../hooks/**',
              ],
              message:
                'ui-react 约束：utils 层不要依赖 hooks 层，请把运行时逻辑留在 hooks，utils 只保留纯逻辑。',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['apps/web-client/**/*.{ts,tsx,js,jsx,mjs,cjs}'],
    rules: {
      'no-restricted-imports': [
        'warn',
        {
          patterns: [
            {
              group: [
                '#pkg/seedar/ui-react/src/**',
                '../../packages/ui-react/src/**',
                '../../../packages/ui-react/src/**',
                '../../../../packages/ui-react/src/**',
              ],
              message:
                'ui-react 约束：请只通过 #pkg/seedar/ui-react 的公开出口导入，不要直接依赖 src 下的私有实现。',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['packages/ui-react/src/components/**/*.{ts,tsx,js,jsx,mjs,cjs}'],
    ignores: [
      'packages/ui-react/src/components/**/hooks/**/*.{ts,tsx,js,jsx,mjs,cjs}',
      'packages/ui-react/src/components/**/utils/**/*.{ts,tsx,js,jsx,mjs,cjs}',
      'packages/ui-react/src/components/**/context/**/*.{ts,tsx,js,jsx,mjs,cjs}',
      'packages/ui-react/src/components/**/components/**/*.{ts,tsx,js,jsx,mjs,cjs}',
    ],
    rules: {
      'no-restricted-imports': [
        'warn',
        {
          patterns: [
            {
              group: [
                '../*/hooks/**',
                '../*/context/**',
                '../*/components/**',
                '../../*/hooks/**',
                '../../*/context/**',
                '../../*/components/**',
              ],
              message:
                "ui-react boundary warning: avoid importing another component's private hooks/utils/context/components directly; prefer its public index.ts export.",
            },
          ],
        },
      ],
    },
  },
);
