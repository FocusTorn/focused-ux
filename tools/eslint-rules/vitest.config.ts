import { defineConfig, mergeConfig } from 'vitest/config'
import baseConfig from '../../vitest.functional.base'

export default mergeConfig(
    baseConfig,
    defineConfig({
        test: {
            globals: true,
            environment: 'node',
            include: ['**/*.test.{js,ts}'],
            exclude: ['node_modules/**', 'dist/**', '**/_out-tsc/**'],
            setupFiles: ['./__tests__/__mocks__/globals.ts'],
        },
    })
)
