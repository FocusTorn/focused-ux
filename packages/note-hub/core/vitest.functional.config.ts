import { defineConfig } from 'vitest/config'
import base from '../../../vitest.base'
import path from 'node:path'

export default defineConfig({
	...base,
	root: __dirname,
	test: {
		...base.test,
		setupFiles: ['./__tests__/_setup.ts'],
		// Exclude coverage-only tests from functional runs
		exclude: ['**/__tests__/coverage/**', 'node_modules/**'],
		include: ['__tests__/**/*.test.ts', '__tests__/**/*.spec.ts'],
		// Mock the shared module to prevent VSCode import issues
		mockReset: true,
		// Completely exclude shared library from test environment
		environment: 'node',
		// Ensure mocks are applied before any imports
		autoMock: true,
	},
	resolve: {
		alias: {
			'@fux/mockly': path.resolve(__dirname, '../../../libs/mockly/src/index.ts'),
		},
	},
	optimizeDeps: {
		exclude: ['vscode'],
		include: ['@fux/mockly'],
	},
	deps: {
		inline: ['@fux/mockly'],
	},
})
