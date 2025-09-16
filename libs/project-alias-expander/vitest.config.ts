import { defineConfig, mergeConfig } from 'vitest/config'
import baseConfig from '../../vitest.functional.base'

export default mergeConfig(
	baseConfig,
	defineConfig({
		test: {
			setupFiles: ['./__tests__/_setup.ts'],
			include: [
				'__tests__/functional/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
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
