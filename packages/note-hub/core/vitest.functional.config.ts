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
	},
	resolve: {
		alias: {
			'@fux/shared': path.resolve(__dirname, '../../../libs/shared/src/index.ts'),
			'@fux/mockly': path.resolve(__dirname, '../../../libs/mockly/src/index.ts'),
		},
	},
	optimizeDeps: {
		exclude: ['vscode'],
		include: ['@fux/shared', '@fux/mockly'],
	},
	deps: {
		inline: ['@fux/shared', '@fux/mockly'],
	},
})
