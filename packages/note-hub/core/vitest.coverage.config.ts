import { defineConfig } from 'vitest/config'
import base from '../../../vitest.base'
import path from 'node:path'

export default defineConfig({
	...base,
	root: __dirname,
	test: {
		...base.test,
		setupFiles: ['./__tests__/_setup.ts'],
		// Include coverage-only tests
		include: ['__tests__/coverage/**/*.test.ts', '__tests__/coverage/**/*.spec.ts'],
		// Mock the shared module to prevent VSCode import issues
		mockReset: true,
		// Completely exclude shared library from test environment
		environment: 'node',
		// Ensure mocks are applied before any imports
		autoMock: true,
		// Enable coverage collection
		coverage: {
			provider: 'v8',
			reporter: ['text', 'html', 'lcov'],
			exclude: [
				'node_modules/**',
				'**/*.d.ts',
				'**/*.js',
				'**/*.js.map',
				'**/coverage/**',
				'**/dist/**',
				'**/build/**',
			],
		},
	},
	resolve: {
		alias: {
			'@fux/mockly': path.resolve(__dirname, '../../../libs/mockly/src/index.ts'),
			'vscode': path.resolve(__dirname, '../../../libs/shared/vscode-test-adapter.ts'),
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
