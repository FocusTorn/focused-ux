import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
	test: {
		globals: true,
		environment: 'node',
		setupFiles: ['./__tests__/_setup.ts'],
		include: [
			'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
			'__tests__/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
		],
		exclude: [
			'**/coverage/**',
			'**/node_modules/**',
			'**/dist/**',
		],
	},
	resolve: {
		alias: {
			'@fux/mockly': path.resolve(__dirname, '../../../libs/mockly/src/index.ts'),
		},
	},
	optimizeDeps: {
		exclude: ['vscode'],
		include: ['@fux/mockly'],
	},
	deps: {
		inline: ['@fux/mockly'],
	},
})
