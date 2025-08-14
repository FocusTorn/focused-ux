import { defineConfig } from 'vitest/config'
import base from '../../../vitest.base'
import path from 'node:path'

export default defineConfig({
	...base,
	root: __dirname,
	test: {
		...base.test,
		setupFiles: ['./__tests__/_setup.ts'],
		coverage: {
			...base.test?.coverage,
			enabled: true,
			reporter: ['text', 'html'],
		},
		include: ['__tests__/**/*.test.ts', '__tests__/**/*.spec.ts', '__tests__/coverage/**/*.test.ts'],
		exclude: ['node_modules/**'],
	},
	resolve: {
		alias: {
			'@fux/shared': path.resolve(__dirname, '../../../libs/shared/src/index.ts'),
			'@fux/mockly': path.resolve(__dirname, '../../../libs/mockly/src/index.ts'),
			'vscode': path.resolve(__dirname, '../../../vscode-test-adapter.ts'),
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
