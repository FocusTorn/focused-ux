import { defineConfig, mergeConfig } from 'vitest/config'
import baseConfig from '../../../vitest.functional.base'

export default mergeConfig(
	baseConfig,
	defineConfig({
		test: {
			setupFiles: ['./__tests__/_setup.ts'],
		},
		
        
        
        // optimizeDeps: {
		// 	include: ['@fux/mockly'],
		// },
		// deps: {
		// 	inline: ['@fux/mockly'],
		// },
        
        
	}),
)
