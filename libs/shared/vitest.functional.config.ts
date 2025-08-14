import { defineConfig } from 'vitest/config'
import base from '../../vitest.base'
import path from 'node:path'

export default defineConfig({
	...base,
	root: __dirname,
	test: {
		...base.test,
		setupFiles: ['./__tests__/_setup.ts'],
		// Exclude coverage-only tests from functional runs
		exclude: ['**/__tests__/coverage/**'],
	},
	resolve: {
		alias: {
			'@fux/shared': path.resolve(__dirname, './src/index.ts'),
			'@fux/mockly': path.resolve(__dirname, '../mockly/src/index.ts'),
			'vscode': path.resolve(__dirname, '../../vscode-test-adapter.ts'),
		},
	},
	optimizeDeps: { exclude: ['vscode'] },
})
