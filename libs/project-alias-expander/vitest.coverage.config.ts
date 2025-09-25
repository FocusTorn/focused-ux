import { defineConfig, mergeConfig } from 'vitest/config'
import functionalConfig from './vitest.config'
import baseCoverageConfig from '../../vitest.coverage.base'

export default mergeConfig(
    mergeConfig(functionalConfig, baseCoverageConfig),
    defineConfig({
        test: {
            include: [
                '__tests__/**/*.{test,test-cov}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
            ],
        },
    }),
)

// import { defineConfig, mergeConfig } from 'vitest/config'
// import baseConfig from '../../vitest.coverage.base'

// export default mergeConfig(
// 	baseConfig,
// 	defineConfig({
// 		test: {
// 			setupFiles: ['./__tests__/_setup.ts'],
// 			coverage: {
// 				reportsDirectory: './__tests__/coverage',
// 			},
// 		},
// 	}),
// )
