import { defineConfig, mergeConfig } from 'vitest/config'
import baseConfig from '../../../vitest.functional.base'

export default mergeConfig(
    baseConfig,
    defineConfig({
        test: {
            setupFiles: ['./__tests__/__mocks__/globals.ts'],
            include: [
                './__tests__/functional-tests/**/*.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
            ],
            exclude: [
                '**/__tests__/integration-tests/**',
                '**/__tests__/_out-tsc/**',
            ],
        },
    }),
)
