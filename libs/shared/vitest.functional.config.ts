import { defineConfig, mergeConfig } from 'vitest/config'
import baseConfig from '../../vitest.functional.base'
import path from 'node:path'

export default mergeConfig(
	baseConfig,
	defineConfig({
		test: {
            setupFiles: ['./__tests__/_setup.ts'], 
            
            poolOptions: {
                threads: { //>
                    minThreads: 1,
                    maxThreads: 4, // Increase this value to allow more concurrent runners
            
                    // Causes equal or worse execution times.
                    // useAtomics: true,
                }, //<
            },    
            
            
        },
        
        
        
        
        
	}),
)
