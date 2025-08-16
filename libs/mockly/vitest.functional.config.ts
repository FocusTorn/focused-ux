import { defineConfig } from 'vitest/config'
import base from '../../vitest.base'
import path from 'node:path'

export default defineConfig({
	...base,
	root: __dirname,
	test: {
		...base.test,
		// Tests will have .test. and coverage tests will have .cov.
		include: ['__tests__/**/*.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
		exclude: [
			'**/*.d.ts',
			'**/*.config.*',
			'**/setup.*',
			'**/helpers.*',
		],
		setupFiles: ['./__tests__/_setup.ts'],

		// Functional tests focus on behavior, not coverage
		coverage: {
			enabled: false,
		},
		
		// Environment setup for VSCode extension testing
		environment: 'node',
		globals: true,
	},
    
	resolve: {
		alias: {
			vscode: path.resolve(__dirname, '../shared/vscode-test-adapter.ts'),
		},
	},
    
	// Ensure proper module resolution for VSCode extension testing
	define: {
		'process.env.NODE_ENV': '"test"',
	},

	optimizeDeps: { exclude: ['vscode'] },

})
