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
