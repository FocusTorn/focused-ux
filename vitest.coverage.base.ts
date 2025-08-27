import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		coverage: {
			enabled: true,
			provider: 'v8',
			reporter: ['text', 'html', 'json-summary', 'json'],
			include: ['__tests__/**/*.{test,test-cov}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}' ],
			exclude: [
				'**/_interfaces/**',
				'**/__tests__/**',
				'**/*.test.*',
				'**/*.test-cov.*',
				'**/*.config.*',
				'**/*.d.ts',
				'dist/**',
				'coverage/**',
			],
			// This path is relative to the package root, so it works universally
			reportsDirectory: './__tests__/_reports/coverage',
		},
	},
})
