import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
	test: {
		globals: true,
		environment: 'node',
		setupFiles: ['./__tests__/_setup.ts'],
		include: ['__tests__/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
		exclude: ['**/*.d.ts', '**/*.config.*', '**/__tests__/_reports/**'],
	},
	resolve: {
		alias: {
			'vscode': path.resolve(__dirname, '../shared/vscode-test-adapter.ts'),
		},
	},
})
