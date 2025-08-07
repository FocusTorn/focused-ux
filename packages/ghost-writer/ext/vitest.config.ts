import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'

export default defineConfig({
	test: {
		globals: true,
		environment: 'node',
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			exclude: [
				'node_modules/',
				'dist/',
				'**/*.d.ts',
				'**/*.config.*',
				'**/test/**',
				'**/tests/**',
				'**/__tests__/**',
				'**/coverage/**',
			],
			thresholds: {
				global: {
					branches: 100,
					functions: 100,
					lines: 100,
					statements: 100,
				},
			},
		},
		setupFiles: ['./test/setup.ts'],
	},
	resolve: {
		alias: {
			'@': resolve(__dirname, './src'),
		},
	},
})
