import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: [
      'packages/**/*.test.ts',
      'scripts/**/*.test.ts',
      'apps/web/src/**/*.test.ts'
    ],
    exclude: ['**/node_modules/**', '**/.svelte-kit/**']
  }
});
