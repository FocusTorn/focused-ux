import { defineConfig } from 'vitest/config'
import base from '../../vitest.base'
import path from 'node:path'

export default defineConfig({
	...base,
	root: __dirname,
	
	test: {
		...base.test,
		include: [
			// Tests will have .test. and coverage tests will have .cov.
			'__tests__/**/*.{test,cov}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
		],
		setupFiles: ['./__tests__/_setup.ts'],
		
		// Coverage tests include both functional and coverage-only tests
		coverage: {
			enabled: true,
			reporter: ['text'],
			reportsDirectory: './coverage',
			exclude: [
				'node_modules/',
				'coverage/',
				'**/*.d.ts',
				'**/*.config.*',
				'**/setup.*',
				'**/helpers.*',
				'**/index.ts', // Exclude main entry points from coverage
				'**/injection.ts', // Exclude DI configuration from coverage
			],
		
			// Coverage thresholds - adjust based on your project needs
			thresholds: {
				global: {
					statements: 99.99,
					branches: 99.99,
					functions: 99.99,
					lines: 99.99,
				},
			},
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
