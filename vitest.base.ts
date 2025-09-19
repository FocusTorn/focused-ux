import { defineConfig } from 'vitest/config'
import { ConfigReporter } from './libs/tools/vitest-config-reporter'

// console.log('🔧 Loading vitest.base.ts configuration')

export default defineConfig({
	test: {
		globals: true,
		environment: 'node',
		coverage: {
			provider: 'v8',
			reporter: ['text'],
            
			exclude: [
				'node_modules/',
				'dist/',
				'**/*.d.ts',
				'**/*.config.*',
				'**/coverage/**',
				'**/_interfaces/**',
			],
		},
        
		// onConsoleLog(log, type) {
		// 	if (log.includes('🔧 Loading') || log.includes('📊 Loading') || log.includes('⚡ Loading') || log.includes('🎯 Loading') || log.includes('📈 Loading')) {
		// 		console.log(`[CONFIG] ${log}`)
		// 	}
		// },
        
		reporters: ['default', new ConfigReporter()],
	},
})
