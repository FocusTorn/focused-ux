import { defineConfig, mergeConfig } from 'vitest/config'
import functionalConfig from './vitest.config'
import baseCoverageConfig from '../../../vitest.coverage.base'

// console.log('📈 Loading packages/project-butler/core/vitest.coverage.config.ts')

export default mergeConfig(
	mergeConfig(functionalConfig, baseCoverageConfig),
	defineConfig({
		// Any package-specific overrides for coverage can go here
		test: {
			include: [
				'__tests__/**/*.{test,test-cov}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
			],
		},
	}),
)
