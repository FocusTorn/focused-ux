import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
	test: {
		globals: true,
		environment: 'node',
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			exclude: [
				'node_modules/',
				'test/',
				'**/*.d.ts',
				'**/*.config.*',
				'**/dist/**',
			],
		},
		setupFiles: ['./test/setup.ts'],
	},
	resolve: {
		alias: {
			'@fux/context-cherry-picker-core': path.resolve(__dirname, '../core/src/index.ts'),
			'@fux/shared': path.resolve(__dirname, '../../../libs/shared/src/index.ts'),
			'@fux/mockly': path.resolve(__dirname, '../../../libs/mockly/src/index.ts'),
		},
	},
	define: {
		'process.env.NODE_ENV': '"test"',
	},
	optimizeDeps: {
		exclude: ['vscode'],
	},
})
