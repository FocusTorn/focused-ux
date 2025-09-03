import { createHash } from 'crypto'
import { readFileSync, statSync, readdirSync } from 'fs'
import { join, extname } from 'path'

export interface AssetMetadata {
	path: string
	size: number
	modifiedTime: number
	hash: string
	type: 'icon' | 'theme' | 'image' | 'other'
	dependencies: string[]
	category?: string
}

export interface AssetManifest {
	version: string
	generatedAt: number
	assets: AssetMetadata[]
	categories: {
		[key: string]: string[]
	}
	dependencies: {
		[assetPath: string]: string[]
	}
}

export class AssetManifestGenerator {

	private readonly assetsDir: string
	public readonly manifestPath: string

	constructor(assetsDir: string = 'assets', manifestPath: string = 'asset-manifest.json') {
		this.assetsDir = assetsDir
		this.manifestPath = manifestPath
	}

	/**
	 * Generate a complete asset manifest
	 */
	async generateManifest(): Promise<AssetManifest> {
		const assets = await this.discoverAssets()
		const categories = this.categorizeAssets(assets)
		const dependencies = this.analyzeDependencies(assets)

		const manifest: AssetManifest = {
			version: '1.0.0',
			generatedAt: Date.now(),
			assets,
			categories,
			dependencies,
		}

		return manifest
	}

	/**
	 * Discover all assets in the assets directory
	 */
	public async discoverAssets(): Promise<AssetMetadata[]> {
		const assets: AssetMetadata[] = []
    
		const processDirectory = (dirPath: string, relativePath: string = ''): void => {
			const items = readdirSync(dirPath, { withFileTypes: true })
      
			for (const item of items) {
				const fullPath = join(dirPath, item.name)
				const assetRelativePath = join(relativePath, item.name)
        
				if (item.isDirectory()) {
					processDirectory(fullPath, assetRelativePath)
				} else if (item.isFile()) {
					const asset = this.createAssetMetadata(fullPath, assetRelativePath)

					if (asset) {
						assets.push(asset)
					}
				}
			}
		}

		processDirectory(this.assetsDir)
		return assets
	}

	/**
	 * Create metadata for a single asset
	 */
	private createAssetMetadata(fullPath: string, relativePath: string): AssetMetadata | null {
		try {
			const stats = statSync(fullPath)
			const content = readFileSync(fullPath)
			const hash = createHash('sha256').update(content).digest('hex')
			const ext = extname(relativePath).toLowerCase()
      
			const type = this.determineAssetType(relativePath, ext)
			const category = this.determineCategory(relativePath)
      
			return {
				path: relativePath,
				size: stats.size,
				modifiedTime: stats.mtime.getTime(),
				hash,
				type,
				dependencies: [],
				category,
			}
		} catch (error) {
			console.warn(`Failed to process asset ${relativePath}:`, error)
			return null
		}
	}

	/**
	 * Determine asset type based on path and extension
	 */
	private determineAssetType(relativePath: string, ext: string): AssetMetadata['type'] {
		if (relativePath.includes('/icons/') || relativePath.includes('\\icons\\')) {
			return 'icon'
		}
		if (relativePath.includes('/themes/') || relativePath.includes('\\themes\\')) {
			return 'theme'
		}
		if (relativePath.includes('/images/') || relativePath.includes('\\images\\')) {
			return 'image'
		}
		if (['.png', '.jpg', '.jpeg', '.gif', '.svg'].includes(ext)) {
			return 'image'
		}
		if (['.json', '.theme.json'].includes(ext)) {
			return 'theme'
		}
		return 'other'
	}

	/**
	 * Determine asset category for better organization
	 */
	private determineCategory(relativePath: string): string | undefined {
		if (relativePath.includes('/file_icons/'))
			return 'file-icons'
		if (relativePath.includes('/folder_icons/'))
			return 'folder-icons'
		if (relativePath.includes('/themes/'))
			return 'themes'
		if (relativePath.includes('/images/'))
			return 'preview-images'
		if (relativePath.includes('/logo'))
			return 'branding'
		return undefined
	}

	/**
	 * Categorize assets for easier access
	 */
	private categorizeAssets(assets: AssetMetadata[]): AssetManifest['categories'] {
		const categories: AssetManifest['categories'] = {}
    
		for (const asset of assets) {
			if (asset.category) {
				if (!categories[asset.category]) {
					categories[asset.category] = []
				}
				categories[asset.category].push(asset.path)
			}
		}
    
		return categories
	}

	/**
	 * Analyze dependencies between assets
	 */
	private analyzeDependencies(assets: AssetMetadata[]): AssetManifest['dependencies'] {
		const dependencies: AssetManifest['dependencies'] = {}
    
		// Theme files depend on icon files
		const themeAssets = assets.filter(a =>
			a.type === 'theme')
		const iconAssets = assets.filter(a =>
			a.type === 'icon')
    
		for (const theme of themeAssets) {
			const themeDeps: string[] = []
      
			// Check if theme references specific icons
			try {
				const themePath = join(this.assetsDir, theme.path)
				const themeContent = readFileSync(themePath, 'utf-8')
        
				// Look for icon references in theme content
				for (const icon of iconAssets) {
					const iconName = icon.path.split('/').pop()?.replace(extname(icon.path), '')

					if (iconName && themeContent.includes(iconName)) {
						themeDeps.push(icon.path)
					}
				}
			} catch (error) {
				console.warn(`Failed to analyze theme dependencies for ${theme.path}:`, error)
			}
      
			dependencies[theme.path] = themeDeps
		}
    
		// Initialize dependencies for all assets
		for (const asset of assets) {
			if (!dependencies[asset.path]) {
				dependencies[asset.path] = []
			}
		}
    
		return dependencies
	}

	/**
	 * Save manifest to file
	 */
	async saveManifest(manifest: AssetManifest): Promise<void> {
		const fs = await import('fs/promises')

		await fs.writeFile(this.manifestPath, JSON.stringify(manifest, null, 2))
	}

	/**
	 * Load existing manifest
	 */
	async loadManifest(): Promise<AssetManifest | null> {
		try {
			const fs = await import('fs/promises')
			const content = await fs.readFile(this.manifestPath, 'utf-8')

			return JSON.parse(content) as AssetManifest
		} catch (error) {
			return null
		}
	}

}

// CLI interface for standalone usage
if (process.argv[1] && process.argv[1].endsWith('asset-manifest.ts')) {
	const generator = new AssetManifestGenerator()
  
	generator.generateManifest()
		.then(async (manifest) => {
			await generator.saveManifest(manifest)
			console.log(`Asset manifest generated with ${manifest.assets.length} assets`)
			console.log(`Categories: ${Object.keys(manifest.categories).join(', ')}`)
			console.log(`Manifest saved to: ${generator.manifestPath}`)
		})
		.catch((error) => {
			console.error('Error during manifest generation:', error)
			process.exit(1)
		})
}
