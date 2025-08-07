import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      exclude: [
        'node_modules/',
        'dist/',
        'coverage/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/test/',
        '**/*.test.*',
        '**/*.spec.*'
      ]
    }
  },
  // Handle VSCode module resolution
  resolve: {
    alias: {
      'vscode': 'vscode-test-adapter'
    }
  }
}) 