import { defineConfig, mergeConfig } from 'vitest/config'
import baseConfig from '../../../vitest.functional.base'

export default mergeConfig(
	baseConfig,
	defineConfig({
		test: {
			setupFiles: ['./__tests__/__mocks__/globals.ts'],
		},
	}),
)
