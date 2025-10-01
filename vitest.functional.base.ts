import { defineConfig } from 'vitest/config'

// console.log('⚡ Loading vitest.functional.base.ts configuration')

export default defineConfig({
    test: {
		
        reporters: ['default'],
		
        globals: true,
        environment: 'node',
        
        // VS Code extension specific settings
        deps: { optimizer: { ssr: { include: ['vscode'] } } },
        
        exclude: [
            '**/*.d.ts',
            '**/*.config.*',
            '**/__tests__/_reports/**',
            '**/__tests__/integration-tests/**',
        ],
        
        // Use forks pool to avoid ES module race conditions
        pool: 'forks',
        poolOptions: {
            forks: {
                singleFork: true
            }
        },
        
        // Add timeout and memory limits
        testTimeout: 2000,
        hookTimeout: 2000,
		
    },
    
})