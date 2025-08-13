import { defineConfig } from 'vitest/config'
import base from '../../../vitest.base'
import path from 'node:path'

export default defineConfig({
	...base,
	root: __dirname,
	test: {
		...base.test,
		setupFiles: ['./__tests__/setup.ts'],
	},
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
			'@fux/shared': path.resolve(__dirname, '../../../libs/shared/src/index.ts'),
			'@fux/mockly': path.resolve(__dirname, '../../../libs/mockly/src/index.ts'),
			'vscode': path.resolve(__dirname, '../../../vscode-test-adapter.ts'),
		},
	},
	optimizeDeps: { exclude: ['vscode'] },
})

// import { defineConfig } from 'vitest/config'
// import { resolve } from 'node:path'

// export default defineConfig({
// 	test: {
// 		globals: true,
// 		environment: 'node',
// 		coverage: {
// 			provider: 'v8',
// 			reporter: ['text', 'json', 'html'],
// 			exclude: [
// 				'node_modules/',
// 				'dist/',
// 				'**/*.d.ts',
// 				'**/*.config.*',
// 				'**/test/**',
// 				'**/tests/**',
// 				'**/__tests__/**',
// 				'**/coverage/**',
// 			],
// 			thresholds: {
// 				global: {
// 					branches: 100,
// 					functions: 100,
// 					lines: 100,
// 					statements: 100,
// 				},
// 			},
// 		},
// 		setupFiles: ['./test/setup.ts'],
// 	},
// 	resolve: {
// 		alias: {
// 			'@': resolve(__dirname, './src'),
// 		},
// 	},
// })
