import { defineConfig, mergeConfig } from 'vitest/config'
import baseConfig from '../../vitest.functional.base'

// // Console output control status (shown before tests run)
// const ENABLE_CONSOLE_OUTPUT = (process.env.ENABLE_TEST_CONSOLE || 'false') === 'true'
// if (!globalThis._paeVitestConfigConsoleStatusShown) {
//     console.log(`[PAE Test Environment] Console output is ${ENABLE_CONSOLE_OUTPUT ? 'ENABLED' : 'DISABLED'}`)
//     console.log(`[PAE Test Environment] To toggle console output: set ENABLE_TEST_CONSOLE=true/false`)
//     console.log('') // Blank line
//     globalThis._paeVitestConfigConsoleStatusShown = true
// }

export default mergeConfig(
    baseConfig,
    defineConfig({
        test: {
            setupFiles: ['./__tests__/__mocks__/globals.ts'],
            include: [
                '__tests__/functional-tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
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
