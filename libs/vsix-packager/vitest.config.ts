import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        include: ['src/__tests__/functional-tests/**/*.test.ts'],
        testTimeout: 120000,
        hookTimeout: 120000,
        reporters: ['default'],
    },
})






