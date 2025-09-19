import { defineConfig, mergeConfig } from 'vitest/config'
import baseConfig from '../../../vitest.functional.base'

// console.log('🎯 Loading packages/project-butler/core/vitest.config.ts')

export default mergeConfig(
    baseConfig,
    defineConfig({
        test: {
            setupFiles: ['./__tests__/_setup.ts'],
            include: [
                './__tests__/functional-tests/**/*.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
            ],
            pool: 'threads',
            poolOptions: {
                threads: {
                    singleThread: false,
                    maxThreads: 4,
                    minThreads: 1,
                },
            },
            // Add timeout and memory limits
            testTimeout: 2000,
            hookTimeout: 2000,
        },
    }),
)
