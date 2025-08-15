import { defineConfig } from 'vitest/config'
import base from '../../vitest.base'
import path from 'node:path'

export default defineConfig({
	...base,
	root: __dirname,
	test: {
		...base.test,
		setupFiles: ['./__tests__/_setup.ts'],
		// Include everything (functional + coverage-only tests)
		coverage: {
			...base.test?.coverage,
			enabled: true,
			reporter: ['text', 'html'],
		},
	},
	resolve: {
		alias: {
			'@fux/mockly': path.resolve(__dirname, '../mockly/src/index.ts'),
			'vscode': path.resolve(__dirname, './vscode-test-adapter.ts'),
		},
	},
	optimizeDeps: { exclude: ['vscode'] },
})
