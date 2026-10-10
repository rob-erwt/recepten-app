import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['lib/**/*.test.ts'],
    setupFiles: ['./lib/test-setup.ts'],
  },
})
