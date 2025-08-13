import { defineConfig } from 'vitest/config'
import base from '../../../vitest.base'
import path from 'node:path'

export default defineConfig({
	...base,
	root: __dirname,
	test: {
		...base.test,
		include: ['{src,test}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
		setupFiles: ['./__tests__/setup.ts'],
		// Ensure watch is not disabled; UI depends on it
		// watch: true,
	},
	resolve: {
		alias: {
			'@fux/project-butler-core': path.resolve(__dirname, '../core/src'),
			'@fux/shared': path.resolve(__dirname, '../../../libs/shared/src'),
			'@fux/mockly': path.resolve(__dirname, '../../../libs/mockly/src'),
			'vscode': path.resolve(__dirname, '../../../vscode-test-adapter.ts'),
		},
	},
	optimizeDeps: { exclude: ['vscode'] },
})

// /// <reference types='vitest' />
// import { defineConfig } from 'vite'
// import path from 'node:path'
// import tsconfigPaths from 'vite-tsconfig-paths'

// export default defineConfig(() => ({
// 	root: __dirname,
// 	cacheDir: '../../../node_modules/.vite/packages/project-butler/ext',
// 	plugins: [
// 		tsconfigPaths(),
// 	],
// 	// Uncomment this if you are using workers.
// 	// worker: {
// 	//  plugins: [ nxViteTsPaths() ],
// 	// },
// 	test: {
// 		watch: false,
// 		globals: true,
// 		environment: 'node',
// 		include: ['{src,test}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
// 		reporters: ['default', 'html'],
// 		coverage: {
// 			reportsDirectory: './test-output/vitest/coverage',
// 			provider: 'v8' as const,
// 			all: true,
// 			include: [
// 				// Focus on core and shared libraries
// 				path.resolve(__dirname, '../core/src/**/*.ts'),
// 				path.resolve(__dirname, '../../../libs/shared/src/**/*.ts'),
// 				path.resolve(__dirname, '../../../libs/mockly/src/**/*.ts'),
// 				// Include extension source if needed
// 				path.resolve(__dirname, 'src/**/*.ts'),
// 			],
// 			exclude: [
// 				'node_modules/',
// 				'test/',
// 				'**/*.d.ts',
// 				'**/*.config.*',
// 				'**/dist/**',
// 				'**/coverage/**',
// 				'**/*.test.ts',
// 				'**/*.spec.ts',
// 			],
// 			thresholds: {
// 				global: {
// 					branches: 80,
// 					functions: 80,
// 					lines: 80,
// 					statements: 80,
// 				},
// 			},
// 			reporter: ['text', 'html', 'json'],
// 			// Ensure coverage is collected for all files
// 			clean: true,
// 			cleanOnRerun: true,
// 		},
// 		setupFiles: ['./test/setup.ts'],
// 	},
// 	resolve: {
// 		alias: {
// 			'@fux/project-butler-core': path.resolve(__dirname, '../core/src'),
// 			'@fux/shared': path.resolve(__dirname, '../../../libs/shared/src'),
// 			'@fux/mockly': path.resolve(__dirname, '../../../libs/mockly/src'),
// 		},
// 	},
// 	define: {
// 		__VITEST_COVERAGE__: true,
// 	},
// }))
