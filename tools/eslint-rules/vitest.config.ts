import { defineConfig, mergeConfig } from 'vitest/config'
import baseConfig from '../../vitest.functional.base'

export default mergeConfig(
    baseConfig,
    defineConfig({
        test: {
            setupFiles: ['./__tests__/__mocks__/globals.ts'],
            include: [
                './__tests__/functional-tests/**/*.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
                './__tests__/rule-tester/**/*.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
            ],
            testTimeout: 10000, // Increase timeout to 10 seconds
        },
    }),
)
