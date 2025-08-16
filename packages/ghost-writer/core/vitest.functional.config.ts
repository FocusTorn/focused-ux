import { defineConfig } from 'vitest/config'
import base from '../../../vitest.base'
import path from 'node:path'

export default defineConfig({
    ...base,
    root: __dirname,
    test: {
        ...base.test,
        include: ['__tests__/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
        exclude: [
            '__tests__/coverage/**/*',
            '**/*.d.ts',
            '**/*.config.*',
            '**/setup.*',
            '**/helpers.*',
        ],
        setupFiles: ['./__tests__/_setup.ts'],
        // Functional tests focus on behavior, not coverage
        coverage: {
            enabled: false,
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
