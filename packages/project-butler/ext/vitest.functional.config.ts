import { defineConfig, mergeConfig } from 'vitest/config'
import baseConfig from '../../../vitest.functional.base'
import path from 'node:path'

export default mergeConfig(
	baseConfig,
	defineConfig({
		test: {
			setupFiles: ['./__tests__/_setup.ts'],
		},
		optimizeDeps: { exclude: ['vscode'] },
	}),
)
