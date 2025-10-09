import { defineConfig, mergeConfig } from 'vitest/config'
import baseConfig from '../../../vitest.functional.base'
import { resolve } from 'path'

export default mergeConfig(
    baseConfig,
    defineConfig({
                resolve: {
                    alias: {
                        '@ms-gen': resolve(__dirname, '../../../libs/mock-strategy/src/gen/index.ts'),
                        '@ms-lib': resolve(__dirname, '../../../libs/mock-strategy/src/lib/index.ts'),
                        '@ms-ext': resolve(__dirname, '../../../libs/mock-strategy/src/ext/index.ts'),
                        '@ms-core': resolve(__dirname, '../../../libs/mock-strategy/src/core/index.ts'),
                        '@ms-tool': resolve(__dirname, '../../../libs/mock-strategy/src/tool/index.ts'),
                        '@ms-plugin': resolve(__dirname, '../../../libs/mock-strategy/src/plugin/index.ts'),
                        '@ms-main': resolve(__dirname, '../../../libs/mock-strategy/src/index.ts')
                    }
                },
        test: {
            setupFiles: ['./__tests__/__mocks__/globals.ts'],
            include: [
                './__tests__/functional-tests/**/*.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
            ]
        },
    }),
)
