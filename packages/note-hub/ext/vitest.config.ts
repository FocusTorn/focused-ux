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
			'@fux/note-hub-core': path.resolve(__dirname, '../core/src/index.ts'),
			'@fux/shared': path.resolve(__dirname, '../../../libs/shared/src/index.ts'),
			'@fux/mockly': path.resolve(__dirname, '../../../libs/mockly/src/index.ts'),
			'vscode': path.resolve(__dirname, '../../../vscode-test-adapter.ts'),
		},
	},
	define: {
		'process.env.NODE_ENV': '"test"',
	},
	optimizeDeps: {
		exclude: ['vscode'],
	},
})

// import { defineConfig } from 'vitest/config'
// import path from 'node:path'

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
// 				'**/coverage/**',
// 				'**/*.test.ts',
// 				'**/setup.ts',
// 			],
// 		},
// 		setupFiles: ['./__tests__/setup.ts'],
// 	},
// 	resolve: {
// 		alias: {
// 			'@fux/note-hub-core': path.resolve(__dirname, '../core/src/index.ts'),
// 			'@fux/shared': path.resolve(__dirname, '../../../libs/shared/src/index.ts'),
// 			'@fux/mockly': path.resolve(__dirname, '../../../libs/mockly/src/index.ts'),
// 			'vscode': path.resolve(__dirname, '../../../vscode-test-adapter.ts'),
// 		},
// 	},
// 	define: {
// 		'process.env.NODE_ENV': '"test"',
// 	},
// 	optimizeDeps: {
// 		exclude: ['vscode'],
// 	},
// })

// // import { defineConfig } from 'vitest/config'
// // import path from 'node:path'

// // export default defineConfig({
// // 	test: {
// // 		globals: true,
// // 		environment: 'node',
// // 		coverage: {
// // 			provider: 'v8',
// // 			reporter: ['text', 'json', 'html'],
// // 			exclude: [
// // 				'node_modules/',
// // 				'dist/',
// // 				'**/*.d.ts',
// // 				'**/*.config.*',
// // 				'**/__tests__/**',
// // 				'**/coverage/**',
// // 			],
// // 		},
// // 		setupFiles: ['./__tests__/setup.ts'],
// // 	},
// // 	resolve: {
// // 		alias: {
// // 			'@fux/note-hub-core': path.resolve(__dirname, '../core/src/index.ts'),
// // 			'@fux/shared': path.resolve(__dirname, '../../../libs/shared/src/index.ts'),
// // 			'@fux/mockly': path.resolve(__dirname, '../../../libs/mockly/src/index.ts'),
// // 			'vscode': 'vscode-test-adapter',
// // 		},
// // 	},
// // 	define: {
// // 		'process.env.NODE_ENV': '"test"',
// // 	},
// // 	optimizeDeps: {
// // 		exclude: ['vscode'],
// // 	},
// // })
