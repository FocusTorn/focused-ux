import { defineConfig } from 'vitest/config'
import base from '../../vitest.base'
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
			'@fux/shared': path.resolve(__dirname, './src/index.ts'),
			'@fux/mockly': path.resolve(__dirname, '../mockly/src/index.ts'),
			'vscode': path.resolve(__dirname, '../../vscode-test-adapter.ts'),
		},
	},
	optimizeDeps: { exclude: ['vscode'] },
})

// import { defineConfig } from 'vitest/config'
// import path from 'node:path'

// export default defineConfig({
// 	root: __dirname,
// 	test: {
// 		globals: true,
// 		environment: 'node',
// 		include: ['src/__tests__/**/*.test.ts'],
// 		coverage: {
// 			provider: 'v8',
// 			reporter: ['text', 'json', 'html'],
// 			exclude: [
// 				'node_modules/',
// 				'dist/',
// 				'**/*.d.ts',
// 				'**/*.config.*',
// 				'**/coverage/**',
// 				'**/*.test.ts',
// 				'**/setup.ts',
// 				'**/_interfaces/**',
// 			],
// 		},
// 		setupFiles: ['./src/__tests__/setup.ts'],
// 		reporters: [
// 			['default', { summary: false }],
// 		],
// 	},
// 	resolve: {
// 		alias: {
// 			'@fux/shared': path.resolve(__dirname, './src/index.ts'),
// 			'vscode': path.resolve(__dirname, '../../vscode-test-adapter.ts'),
// 			'@fux/mockly': path.resolve(__dirname, '../mockly/src/index.ts'),
// 		},
// 	},
// 	define: {
// 		'process.env.NODE_ENV': '"test"',
// 	},
// 	optimizeDeps: {
// 		exclude: ['vscode'],
// 	},
// })
