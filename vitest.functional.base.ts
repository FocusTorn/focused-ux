import { defineConfig } from 'vitest/config'
import path from 'node:path'
import process from 'node:process'

export default defineConfig({
	test: {
		globals: true,
		environment: 'node',
		reporters: ['default'],
		include: ['__tests__/**/*.test.ts'],
		exclude: ['**/*.d.ts', '**/*.config.*', '**/__tests__/_reports/**'],
	},

	resolve: {
		alias: {
			'@fux/mockly': path.resolve(process.cwd(), 'libs/mockly/src'),
			'@fux/shared': path.resolve(process.cwd(), 'libs/shared/src'),
			'vscode': path.resolve(process.cwd(), 'libs/shared/vscode-test-adapter.ts'),
		},
	},

	optimizeDeps: {
		exclude: ['vscode'],
	},
})
