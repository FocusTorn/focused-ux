import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['__tests__/**/*.test.{js,ts}'],
        exclude: ['node_modules', 'dist'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: [
                'node_modules/',
                'dist/',
                '__tests__/',
                '**/*.test.{js,ts}',
                '**/*.spec.{js,ts}',
            ],
        },
    },
})

