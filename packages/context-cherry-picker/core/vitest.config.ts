import { defineConfig, mergeConfig } from 'vitest/config'
import baseConfig from '../../../vitest.functional.base'

export default mergeConfig(
    baseConfig,
    defineConfig({
        test: {
            setupFiles: ['./__tests__/__mocks__/globals.ts'],
            exclude: [
                '**/__tests__/integration/**', 
                '**/__tests__/_out-tsc/**',
                '**/node_modules/gpt-tokenizer/**'
            ],
        },
    })
)
