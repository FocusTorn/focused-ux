import { resolve } from 'path'

/**
 * Utility for resolving asset paths from the @fux/dynamicons-assets package
 * This replaces the sync-to-target approach with direct package imports
 */
export class AssetPathResolver {

	private static assetsPackagePath: string | null = null

	/**
	 * Get the resolved path to the assets package directory
	 */
	private static getAssetsPackagePath(): string {
		if (!this.assetsPackagePath) {
			try {
				// Resolve the assets package from node_modules
				this.assetsPackagePath = require.resolve('@fux/dynamicons-assets/package.json')
					.replace('/package.json', '')
			} catch (error) {
				// Critical failure - assets package is required
				throw new Error(`CRITICAL: Cannot resolve @fux/dynamicons-assets package. Extension cannot function without assets. Error: ${error}`)
			}
		}
		return this.assetsPackagePath
	}

	/**
	 * Get the path to a theme file in the assets package
	 */
	static getThemePath(filename: string): string {
		const assetsPath = this.getAssetsPackagePath()

		return resolve(assetsPath, 'dist/assets/themes', filename)
	}

	/**
	 * Get the path to an icon file in the assets package
	 */
	static getIconPath(type: 'file' | 'folder', filename: string): string {
		const assetsPath = this.getAssetsPackagePath()
		const iconType = type === 'file' ? 'file_icons' : 'folder_icons'

		return resolve(assetsPath, 'dist/assets/icons', iconType, filename)
	}

	/**
	 * Get the path to a preview image in the assets package
	 */
	static getPreviewImagePath(filename: string): string {
		const assetsPath = this.getAssetsPackagePath()

		return resolve(assetsPath, 'dist/assets/images/preview-images', filename)
	}

	/**
	 * Get the base path to the assets directory
	 */
	static getAssetsBasePath(): string {
		const assetsPath = this.getAssetsPackagePath()

		return resolve(assetsPath, 'dist/assets')
	}

	/**
	 * Get the themes directory path
	 */
	static getThemesPath(): string {
		const assetsPath = this.getAssetsPackagePath()

		return resolve(assetsPath, 'dist/assets/themes')
	}

	/**
	 * Get the icons directory path
	 */
	static getIconsPath(): string {
		const assetsPath = this.getAssetsPackagePath()

		return resolve(assetsPath, 'dist/assets/icons')
	}

}
