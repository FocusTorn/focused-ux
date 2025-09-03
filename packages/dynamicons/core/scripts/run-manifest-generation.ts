#!/usr/bin/env node

import { AssetManifestGenerator } from './asset-manifest'

// Simple wrapper to run manifest generation
async function main() {
	try {
		const generator = new AssetManifestGenerator()
		const manifest = await generator.generateManifest()

		await generator.saveManifest(manifest)
    
		console.log(`Asset manifest generated with ${manifest.assets.length} assets`)
		console.log(`Categories: ${Object.keys(manifest.categories).join(', ')}`)
		console.log(`Manifest saved to: ${generator.manifestPath}`)
	} catch (error) {
		console.error('Manifest generation failed:', error)
		process.exit(1)
	}
}

main()
