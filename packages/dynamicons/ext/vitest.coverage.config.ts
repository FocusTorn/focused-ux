import { defineConfig, mergeConfig } from 'vitest/config'
import baseConfig from '../../../vitest.coverage.base'

export default mergeConfig(
    baseConfig,
    defineConfig({
        test: {
            setupFiles: ['./__tests__/_setup.ts'],
            coverage: {
                provider: 'v8',
                reporter: ['text', 'json', 'html'],
                reportsDirectory: './coverage',
                exclude: [
                    'node_modules/',
                    'dist/',
                    '**/*.d.ts',
                    '**/*.test.ts',
                    '**/*.spec.ts',
                    '**/_setup.ts',
                ],
            },
        },
    })
) 