import { promises as fs } from 'fs'
import path from 'path'
import { assetConstants } from '../_config/asset.constants.js'

export class SyncProcessor {

	/**
	 * Sync processed assets to extension package
	 */
	async process(verbose: boolean = false): Promise<boolean> {
		try {
			if (verbose) {
				console.log('\n🔄 [ASSET SYNC WORKFLOW]')
				console.log('═══════════════════════════════════════════════════════════════')
				console.log('📋 Syncing processed assets to extension package...')
				console.log('═══════════════════════════════════════════════════════════════\n')
			}

			// Define sync targets
			const syncTargets = [
				{
					name: 'icons',
					source: assetConstants.paths.distIconsDir,
					target: path.resolve(process.cwd(), '../ext/assets-staging/icons'),
					description: 'Icon files',
				},
				{
					name: 'themes',
					source: assetConstants.paths.distThemesDir,
					target: path.resolve(process.cwd(), '../ext/assets-staging/themes'),
					description: 'Theme files',
				},
				{
					name: 'images',
					source: assetConstants.paths.distImagesDir,
					target: path.resolve(process.cwd(), '../ext/assets-staging/images'),
					description: 'Preview images',
				},
			]

			let totalSynced = 0
			let totalErrors = 0

			for (const target of syncTargets) {
				try {
					const result = await this.syncDirectory(target.source, target.target, target.description, verbose)

					totalSynced += result.syncedCount
					if (result.errors > 0) {
						totalErrors += result.errors
					}
				} catch (error) {
					console.error(`❌ Failed to sync ${target.description}: ${error}`)
					totalErrors++
				}
			}

			if (totalErrors === 0) {
				if (verbose) {
					console.log('═══════════════════════════════════════════════════════════════')
					console.log('✅ ASSET SYNC COMPLETED SUCCESSFULLY')
					console.log('═══════════════════════════════════════════════════════════════\n')
				} else {
					console.log(`✅ Assets synced: ${totalSynced} files`)
				}
				return true
			} else {
				console.log(`❌ Asset sync completed with ${totalErrors} errors`)
				return false
			}
		} catch (error) {
			console.error('❌ Asset sync failed:', error)
			return false
		}
	}

	/**
	 * Sync a directory from source to target
	 */
	private async syncDirectory(
		sourceDir: string,
		targetDir: string,
		description: string,
		verbose: boolean,
	): Promise<{ syncedCount: number, errors: number }> {
		try {
			// Check if source directory exists
			await fs.access(sourceDir)
			
			// Ensure target directory exists
			await fs.mkdir(targetDir, { recursive: true })
			
			// Read source files
			const sourceFiles = await fs.readdir(sourceDir, { withFileTypes: true })
			let syncedCount = 0
			let errors = 0
			
			for (const file of sourceFiles) {
				if (file.isFile()) {
					const sourcePath = path.join(sourceDir, file.name)
					const targetPath = path.join(targetDir, file.name)
					
					try {
						// Copy file to target
						await fs.copyFile(sourcePath, targetPath)
						syncedCount++
						
						if (verbose) {
							console.log(`  📄 ${file.name}`)
						}
					} catch (error) {
						console.error(`  ❌ Failed to sync ${file.name}: ${error}`)
						errors++
					}
				} else if (file.isDirectory()) {
					// Recursively sync subdirectories
					const subSourceDir = path.join(sourceDir, file.name)
					const subTargetDir = path.join(targetDir, file.name)
					const subResult = await this.syncDirectory(subSourceDir, subTargetDir, `${description}/${file.name}`, verbose)

					syncedCount += subResult.syncedCount
					errors += subResult.errors
				}
			}
			
			return { syncedCount, errors }
		} catch (_error) {
			if (verbose) {
				console.log(`  ⚠️  Source directory not found: ${description}`)
			}
			return { syncedCount: 0, errors: 0 }
		}
	}

}
