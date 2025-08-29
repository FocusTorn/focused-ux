import { defineConfig, mergeConfig } from 'vitest/config'
import baseConfig from '../../vitest.coverage.base'

export default mergeConfig(
    baseConfig,
    defineConfig({
        test: {
            setupFiles: ['./__tests__/_setup.ts'],
            coverage: {
                reportsDirectory: './__tests__/coverage',
            },
        },
    })
)
