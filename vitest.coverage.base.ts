import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		// Include all tests for coverage runs
		include: ['__tests__/**/*.test.ts', '__tests__/**/*.test-cov.ts'],
		coverage: {
			enabled: true,
			provider: 'v8',
			reporter: ['text', 'html', 'json-summary', 'json'],
			include: ['src/**/*.{ts,js}'],
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