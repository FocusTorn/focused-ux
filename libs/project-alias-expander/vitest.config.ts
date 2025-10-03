import { defineConfig, mergeConfig } from 'vitest/config'
import baseConfig from '../../vitest.functional.base'

export default mergeConfig(
    baseConfig,
    defineConfig({
        test: {
            setupFiles: ['./__tests__/__mocks__/globals.ts'],
            include: [
                '__tests__/functional-tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
                '__tests__/integration-tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
                '__tests__/performance-tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
            ],
        },
    }),
)

// import { defineConfig, mergeConfig } from 'vitest/config'
// import baseConfig from '../../vitest.functional.base'

// export default mergeConfig(
// 	baseConfig,
// 	defineConfig({
// 		test: {
// 			setupFiles: ['./__tests__/_setup.ts'],
// 		},
// 	}),
// )
