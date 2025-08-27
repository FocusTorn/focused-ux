import { defineConfig, mergeConfig } from 'vitest/config'
import baseConfig from '../../../vitest.coverage.base'

export default mergeConfig(
	baseConfig,
	defineConfig({
		// Any package-specific overrides for coverage can go here
	}),
)
