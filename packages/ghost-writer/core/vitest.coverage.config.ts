import { defineConfig } from 'vitest/config'
import base from '../../../vitest.base'
import path from 'node:path'

export default defineConfig({
    ...base,
    root: __dirname,
    test: {
        ...base.test,
        include: [
            '__tests__/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
            '__tests__/coverage/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
        ],
        setupFiles: ['./__tests__/_setup.ts'],
        // Coverage tests include both functional and coverage-only tests
        coverage: {
            enabled: true,
            reporter: ['text', 'lcov', 'html'],
            reportsDirectory: './coverage',
            exclude: [
                'node_modules/',
                'coverage/',
                '**/*.d.ts',
                '**/*.config.*',
                '**/setup.*',
                '**/helpers.*',
                '**/index.ts', // Exclude main entry points from coverage
                '**/injection.ts', // Exclude DI configuration from coverage
            ],
            // Coverage thresholds - adjust based on your project needs
            thresholds: {
                global: {
                    statements: 80,
                    branches: 80,
                    functions: 80,
                    lines: 80,
                },
            },
        },
        // Environment setup for VSCode extension testing
        environment: 'node',
        globals: true,
    },
    resolve: {
        alias: {
            '@fux/mockly': path.resolve(__dirname, '../../../libs/mockly/src'),
            '@fux/shared': path.resolve(__dirname, '../../../libs/shared/src'),
            // Add other workspace aliases as needed for your package
        },
    },
    // Ensure proper module resolution for VSCode extension testing
    define: {
        'process.env.NODE_ENV': '"test"',
    },
})
