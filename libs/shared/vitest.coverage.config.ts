import { defineConfig, mergeConfig } from 'vitest/config'
import functionalConfig from './vitest.functional.config'
import baseCoverageConfig from '../../vitest.coverage.base'

export default mergeConfig(
	mergeConfig(functionalConfig, baseCoverageConfig),
	defineConfig({
		// Any package-specific overrides for coverage can go here
	}),
)
