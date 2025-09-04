#!/usr/bin/env node

import { processIcons } from './process-icons.js'
import { generateThemes } from './generate-themes.js'
import { validateAssets } from './validate-assets.js'
import { AssetSync } from './sync-to-ext.js'

/**
 * Main Asset Processing Workflow
 * Orchestrates all 4 core operations in sequence
 */
async function main(): Promise<void> {
	const args = process.argv.slice(2)
	const verbose = args.includes('--verbose') || args.includes('-v')
	const startTime = Date.now()
	
	try {
		if (verbose) {
			console.log('🚀 Starting Dynamicons Asset Processing Workflow')
			console.log('=' .repeat(60))
		}
		
		// Step 1: Process Icons
		if (verbose) {
			console.log('\n📥 STEP 1: Processing Icons')
			console.log('-' .repeat(40))
		}
		await processIcons(verbose)
		
		// Step 2: Generate Themes
		if (verbose) {
			console.log('\n🎨 STEP 2: Generating Themes')
			console.log('-' .repeat(40))
		}
		await generateThemes(verbose)
		
		// Step 3: Validate Assets
		if (verbose) {
			console.log('\n🔍 STEP 3: Validating Assets')
			console.log('-' .repeat(40))
		}
		await validateAssets(verbose)
		
		// Step 4: Assets ready for sync (no automatic syncing)
		if (verbose) {
			console.log('\n✅ STEP 4: Assets ready for sync')
			console.log('-' .repeat(40))
			console.log('Assets processed and ready in dist/assets/')
			console.log('Sync will be executed by consuming packages during their build process')
		}
		
		const totalTime = Date.now() - startTime
		
		if (verbose) {
			console.log('\n' + '=' .repeat(60))
			console.log(`✅ Asset Processing Workflow completed in ${(totalTime / 1000).toFixed(2)}s`)
			console.log('=' .repeat(60))
		} else {
			console.log(`✅ Assets processed in ${(totalTime / 1000).toFixed(2)}s`)
		}
		
	} catch (error) {
		console.error('\n❌ Asset Processing Workflow failed:', error)
		process.exit(1)
	}
}

// CLI interface
if (process.argv[1] && process.argv[1].endsWith('main.ts')) {
	main().catch((error) => {
		console.error('Fatal error:', error)
		process.exit(1)
	})
}

export { main }
