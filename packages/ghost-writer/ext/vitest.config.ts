import { defineConfig, mergeConfig } from 'vitest/config'
import baseConfig from '../../../vitest.functional.base'

export default mergeConfig(
	baseConfig,
	defineConfig({
		test: {
			setupFiles: ['./__tests__/_setup.ts'],
			exclude: [
				'**/__tests__/integration-tests/**',
				'**/__tests__/_out-tsc/**',
			],
		},
	}),
)
