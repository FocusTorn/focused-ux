import { promises as fs } from 'fs'
import path from 'path'
import { createHash } from 'crypto'

export interface ChangeDetectionResult {
	hasChanges: boolean
	reason: string
	lastModified: number
	fileCount: number
	hash?: string
}

export interface FileChangeInfo {
	path: string
	mtime: number
	size: number
	hash: string
}

export class ChangeDetector {
	private cacheDir: string
	private cacheFile: string

	constructor(cacheDir: string = '.nx/cache') {
		this.cacheDir = cacheDir
		this.cacheFile = path.join(cacheDir, 'asset-changes.json')
	}

	/**
	 * Detect changes in a directory by comparing file hashes and timestamps
	 */
	async detectDirectoryChanges(
		directory: string,
		pattern: string = '**/*',
		excludePatterns: string[] = []
	): Promise<ChangeDetectionResult> {
		try {
			// Ensure cache directory exists
			await fs.mkdir(this.cacheDir, { recursive: true })

			// Get current file information
			const currentFiles = await this.getFileInfo(directory, pattern, excludePatterns)
			
			// Load previous file information
			const previousFiles = await this.loadPreviousFileInfo()
			
			// Compare files
			const comparison = this.compareFileSets(currentFiles, previousFiles)
			
			// Save current file information for next run
			await this.saveFileInfo(currentFiles)
			
			return {
				hasChanges: comparison.hasChanges,
				reason: comparison.reason,
				lastModified: comparison.lastModified,
				fileCount: currentFiles.length,
				hash: comparison.hash
			}
		} catch (error) {
			// If we can't detect changes, assume changes exist
			return {
				hasChanges: true,
				reason: `Change detection failed: ${error instanceof Error ? error.message : String(error)}`,
				lastModified: Date.now(),
				fileCount: 0
			}
		}
	}

	/**
	 * Detect changes in specific files by comparing content hashes
	 */
	async detectFileChanges(files: string[]): Promise<ChangeDetectionResult> {
		try {
			// Ensure cache directory exists
			await fs.mkdir(this.cacheDir, { recursive: true })

			const currentFiles: FileChangeInfo[] = []
			let lastModified = 0

			for (const file of files) {
				try {
					const stats = await fs.stat(file)
					const content = await fs.readFile(file)
					const hash = createHash('sha256').update(content).digest('hex')
					
					currentFiles.push({
						path: file,
						mtime: stats.mtime.getTime(),
						size: stats.size,
						hash
					})

					lastModified = Math.max(lastModified, stats.mtime.getTime())
				} catch {
					// File doesn't exist, consider it changed
					return {
						hasChanges: true,
						reason: `File ${file} does not exist`,
						lastModified: Date.now(),
						fileCount: files.length
					}
				}
			}

			// Load previous file information
			const previousFiles = await this.loadPreviousFileInfo()
			
			// Compare files
			const comparison = this.compareFileSets(currentFiles, previousFiles)
			
			// Save current file information for next run
			await this.saveFileInfo(currentFiles)
			
			return {
				hasChanges: comparison.hasChanges,
				reason: comparison.reason,
				lastModified,
				fileCount: currentFiles.length,
				hash: comparison.hash
			}
		} catch (error) {
			return {
				hasChanges: true,
				reason: `File change detection failed: ${error instanceof Error ? error.message : String(error)}`,
				lastModified: Date.now(),
				fileCount: files.length
			}
		}
	}

	/**
	 * Get file information for a directory
	 */
	private async getFileInfo(
		directory: string,
		pattern: string,
		excludePatterns: string[]
	): Promise<FileChangeInfo[]> {
		const files: FileChangeInfo[] = []
		
		try {
			await fs.access(directory)
		} catch {
			return files // Directory doesn't exist
		}

		const entries = await fs.readdir(directory, { withFileTypes: true })
		
		for (const entry of entries) {
			const fullPath = path.join(directory, entry.name)
			
			// Check exclude patterns
			if (excludePatterns.some(pattern => this.matchesPattern(fullPath, pattern))) {
				continue
			}

			if (entry.isDirectory()) {
				// Recursively process subdirectories
				const subFiles = await this.getFileInfo(fullPath, pattern, excludePatterns)
				files.push(...subFiles)
			} else if (entry.isFile()) {
				try {
					const stats = await fs.stat(fullPath)
					const content = await fs.readFile(fullPath)
					const hash = createHash('sha256').update(content).digest('hex')
					
					files.push({
						path: fullPath,
						mtime: stats.mtime.getTime(),
						size: stats.size,
						hash
					})
				} catch {
					// Skip files we can't read
					continue
				}
			}
		}

		return files
	}

	/**
	 * Load previous file information from cache
	 */
	private async loadPreviousFileInfo(): Promise<FileChangeInfo[]> {
		try {
			const content = await fs.readFile(this.cacheFile, 'utf-8')
			return JSON.parse(content)
		} catch {
			return [] // No previous cache
		}
	}

	/**
	 * Save current file information to cache
	 */
	private async saveFileInfo(files: FileChangeInfo[]): Promise<void> {
		try {
			await fs.writeFile(this.cacheFile, JSON.stringify(files, null, 2))
		} catch {
			// Ignore cache save failures
		}
	}

	/**
	 * Compare two sets of file information
	 */
	private compareFileSets(
		current: FileChangeInfo[],
		previous: FileChangeInfo[]
	): { hasChanges: boolean, reason: string, lastModified: number, hash: string } {
		// Create maps for easier comparison
		const currentMap = new Map(current.map(f => [f.path, f]))
		const previousMap = new Map(previous.map(f => [f.path, f]))

		// Check for added or modified files
		for (const [path, currentFile] of currentMap) {
			const previousFile = previousMap.get(path)
			
			if (!previousFile) {
				return {
					hasChanges: true,
					reason: `New file added: ${path}`,
					lastModified: currentFile.mtime,
					hash: this.calculateSetHash(current)
				}
			}

			if (currentFile.hash !== previousFile.hash) {
				return {
					hasChanges: true,
					reason: `File modified: ${path}`,
					lastModified: currentFile.mtime,
					hash: this.calculateSetHash(current)
				}
			}
		}

		// Check for removed files
		for (const [path] of previousMap) {
			if (!currentMap.has(path)) {
				return {
					hasChanges: true,
					reason: `File removed: ${path}`,
					lastModified: Date.now(),
					hash: this.calculateSetHash(current)
				}
			}
		}

		// No changes detected
		const lastModified = current.length > 0 ? Math.max(...current.map(f => f.mtime)) : 0
		return {
			hasChanges: false,
			reason: 'No changes detected',
			lastModified,
			hash: this.calculateSetHash(current)
		}
	}

	/**
	 * Calculate hash for entire file set
	 */
	private calculateSetHash(files: FileChangeInfo[]): string {
		const sortedFiles = files.sort((a, b) => a.path.localeCompare(b.path))
		const content = sortedFiles.map(f => `${f.path}:${f.hash}`).join('\n')
		return createHash('sha256').update(content).digest('hex')
	}

	/**
	 * Check if path matches pattern (simple glob-like matching)
	 */
	private matchesPattern(path: string, pattern: string): boolean {
		// Convert glob pattern to regex
		const regexPattern = pattern
			.replace(/\*\*/g, '.*')
			.replace(/\*/g, '[^/]*')
			.replace(/\?/g, '.')
		const regex = new RegExp(`^${regexPattern}$`)
		return regex.test(path)
	}

	/**
	 * Clear change detection cache
	 */
	async clearCache(): Promise<void> {
		try {
			await fs.unlink(this.cacheFile)
		} catch {
			// Cache file doesn't exist, that's fine
		}
	}

	/**
	 * Get cache file path for external inspection
	 */
	getCacheFilePath(): string {
		return this.cacheFile
	}
}
