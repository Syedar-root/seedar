import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'ai/index': 'src/ai/index.ts',
    'common/index': 'src/common/index.ts',
    'dashboard/index': 'src/dashboard/index.ts',
    'dataset/index': 'src/dataset/index.ts',
    'datasource/index': 'src/datasource/index.ts',
    'query/index': 'src/query/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  outExtension({ format }) {
    return {
      js: format === 'cjs' ? '.cjs' : '.js',
    };
  },
});
