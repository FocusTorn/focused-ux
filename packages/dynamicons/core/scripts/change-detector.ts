import type { AssetManifest, AssetMetadata } from './asset-manifest'

export interface AssetChange {
	type: 'added' | 'modified' | 'deleted' | 'unchanged'
	assetPath: string
	previousHash?: string
	currentHash?: string
	previousModifiedTime?: number
	currentModifiedTime?: number
	size?: number
	dependencies?: string[]
}

export interface ChangeAnalysis {
	changes: AssetChange[]
	summary: {
		total: number
		added: number
		modified: number
		deleted: number
		unchanged: number
	}
	affectedAssets: string[]
	processingRequired: boolean
}

export class AssetChangeDetector {

	private readonly assetsDir: string
	private readonly manifestPath: string

	constructor(assetsDir: string = 'assets', manifestPath: string = 'asset-manifest.json') {
		this.assetsDir = assetsDir
		this.manifestPath = manifestPath
	}

	/**
	 * Analyze changes between current assets and previous manifest
	 */
	async analyzeChanges(): Promise<ChangeAnalysis> {
		const previousManifest = await this.loadPreviousManifest()
		const currentAssets = await this.scanCurrentAssets()
    
		if (!previousManifest) {
			// First run - all assets are new
			const changes = currentAssets.map(asset =>
				({
					type: 'added' as const,
					assetPath: asset.path,
					currentHash: asset.hash,
					currentModifiedTime: asset.modifiedTime,
					size: asset.size,
				}))
      
			return this.createChangeAnalysis(changes)
		}

		const changes = this.detectChanges(previousManifest, currentAssets)

		return this.createChangeAnalysis(changes)
	}

	/**
	 * Detect specific changes between manifests
	 */
	private detectChanges(previous: AssetManifest, current: AssetMetadata[]): AssetChange[] {
		const changes: AssetChange[] = []
		const previousAssets = new Map(previous.assets.map(a =>
			[a.path, a]))
		const currentAssets = new Map(current.map(a =>
			[a.path, a]))

		// Check for added and modified assets
		for (const currentAsset of current) {
			const previousAsset = previousAssets.get(currentAsset.path)
      
			if (!previousAsset) {
				// New asset
				changes.push({
					type: 'added',
					assetPath: currentAsset.path,
					currentHash: currentAsset.hash,
					currentModifiedTime: currentAsset.modifiedTime,
					size: currentAsset.size,
				})
			} else if (this.hasAssetChanged(previousAsset, currentAsset)) {
				// Modified asset
				changes.push({
					type: 'modified',
					assetPath: currentAsset.path,
					previousHash: previousAsset.hash,
					currentHash: currentAsset.hash,
					previousModifiedTime: previousAsset.modifiedTime,
					currentModifiedTime: currentAsset.modifiedTime,
					size: currentAsset.size,
				})
			} else {
				// Unchanged asset
				changes.push({
					type: 'unchanged',
					assetPath: currentAsset.path,
					previousHash: previousAsset.hash,
					currentHash: currentAsset.hash,
					previousModifiedTime: previousAsset.modifiedTime,
					currentModifiedTime: currentAsset.modifiedTime,
					size: currentAsset.size,
				})
			}
		}

		// Check for deleted assets
		for (const previousAsset of previous.assets) {
			if (!currentAssets.has(previousAsset.path)) {
				changes.push({
					type: 'deleted',
					assetPath: previousAsset.path,
					previousHash: previousAsset.hash,
					previousModifiedTime: previousAsset.modifiedTime,
				})
			}
		}

		return changes
	}

	/**
	 * Check if an asset has changed
	 */
	private hasAssetChanged(previous: AssetMetadata, current: AssetMetadata): boolean {
		return (
			previous.hash !== current.hash
			|| previous.size !== current.size
			|| previous.modifiedTime !== current.modifiedTime
		)
	}

	/**
	 * Scan current assets directory
	 */
	private async scanCurrentAssets(): Promise<AssetMetadata[]> {
		const { AssetManifestGenerator } = await import('./asset-manifest')
		const generator = new AssetManifestGenerator(this.assetsDir)

		return generator.discoverAssets()
	}

	/**
	 * Load previous manifest if it exists
	 */
	private async loadPreviousManifest(): Promise<AssetManifest | null> {
		try {
			const fs = await import('fs/promises')
			const content = await fs.readFile(this.manifestPath, 'utf-8')

			return JSON.parse(content) as AssetManifest
		} catch (error) {
			return null
		}
	}

	/**
	 * Create change analysis with summary
	 */
	private createChangeAnalysis(changes: AssetChange[]): ChangeAnalysis {
		const summary = {
			total: changes.length,
			added: changes.filter(c =>
				c.type === 'added').length,
			modified: changes.filter(c =>
				c.type === 'modified').length,
			deleted: changes.filter(c =>
				c.type === 'deleted').length,
			unchanged: changes.filter(c =>
				c.type === 'unchanged').length,
		}

		const affectedAssets = changes
			.filter(c =>
				c.type !== 'unchanged')
			.map(c =>
				c.assetPath)

		const processingRequired = summary.added > 0 || summary.modified > 0 || summary.deleted > 0

		return {
			changes,
			summary,
			affectedAssets,
			processingRequired,
		}
	}

	/**
	 * Get assets that need processing (added or modified)
	 */
	getAssetsToProcess(changes: AssetChange[]): string[] {
		return changes
			.filter(c =>
				c.type === 'added' || c.type === 'modified')
			.map(c =>
				c.assetPath)
	}

	/**
	 * Get assets that can be skipped (unchanged)
	 */
	getAssetsToSkip(changes: AssetChange[]): string[] {
		return changes
			.filter(c =>
				c.type === 'unchanged')
			.map(c =>
				c.assetPath)
	}

	/**
	 * Check if a specific asset needs processing
	 */
	needsProcessing(assetPath: string, changes: AssetChange[]): boolean {
		const change = changes.find(c =>
			c.assetPath === assetPath)

		return change ? change.type === 'added' || change.type === 'modified' : true
	}

}

// CLI interface for standalone usage
if (process.argv[1] && process.argv[1].endsWith('change-detector.ts')) {
	const detector = new AssetChangeDetector()
  
	detector.analyzeChanges()
		.then((analysis) => {
			console.log('Asset Change Analysis:')
			console.log(`Total assets: ${analysis.summary.total}`)
			console.log(`Added: ${analysis.summary.added}`)
			console.log(`Modified: ${analysis.summary.modified}`)
			console.log(`Deleted: ${analysis.summary.deleted}`)
			console.log(`Unchanged: ${analysis.summary.unchanged}`)
			console.log(`Processing required: ${analysis.processingRequired}`)
      
			if (analysis.affectedAssets.length > 0) {
				console.log('\nAffected assets:')
				analysis.affectedAssets.forEach(asset =>
					console.log(`  - ${asset}`))
			}
		})
		.catch((error) => {
			console.error('Error during change detection:', error)
			process.exit(1)
		})
}

// Export a function for programmatic usage
export async function runChangeDetection(assetsDir?: string, manifestPath?: string): Promise<void> {
	const detector = new AssetChangeDetector(assetsDir, manifestPath)
  
	try {
		const analysis = await detector.analyzeChanges()
    
		console.log('Asset Change Analysis:')
		console.log(`Total assets: ${analysis.summary.total}`)
		console.log(`Added: ${analysis.summary.added}`)
		console.log(`Modified: ${analysis.summary.modified}`)
		console.log(`Deleted: ${analysis.summary.deleted}`)
		console.log(`Unchanged: ${analysis.summary.unchanged}`)
		console.log(`Processing required: ${analysis.processingRequired}`)
    
		if (analysis.affectedAssets.length > 0) {
			console.log('\nAffected assets:')
			analysis.affectedAssets.forEach(asset =>
				console.log(`  - ${asset}`))
		}
	} catch (error) {
		console.error('Error during change detection:', error)
		throw error
	}
}
