import { defineConfig } from 'vitest/config'
import path from 'node:path'
import process from 'node:process'

export default defineConfig({
	test: {
		
		reporters: ['default'],
		include: [
			'__tests__/**/*.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
		],
		exclude: [
			'**/*.d.ts',
			'**/*.config.*',
			'**/__tests__/_reports/**',
			'**/__tests__/integration-tests/**',
		],
        
		globals: true,
		environment: 'node',
        
		// VS Code extension specific settings
		deps: { optimizer: { ssr: { include: ['vscode'] } } },
	},
    
})