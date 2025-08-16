import type { Uri, FileStat } from 'vscode'
import * as path from 'node:path'

export interface MockFileSystemItem {
	content: Uint8Array
	type: 'file' | 'directory'
	ctime: number
	mtime: number
	size: number
}

export class MockFileSystem {

	private fileSystem = new Map<string, MockFileSystemItem>()
	private utils: any

	constructor(utils?: any) {
		this.utils = utils || console
	}

	// Enhanced file system operations with proper URI handling
	async stat(uri: Uri): Promise<FileStat> {
		const filePath = this.normalizePath(uri.fsPath)
		const item = this.fileSystem.get(filePath)

		if (!item) {
			throw new Error(`File not found: ${filePath}`)
		}

		return {
			type: item.type === 'file' ? 1 : 2, // 1 = File, 2 = Directory
			ctime: item.ctime,
			mtime: item.mtime,
			size: item.size,
			permissions: 420 as any, // 0o644 as number
		}
	}

	async readFile(uri: Uri): Promise<Uint8Array>
	async readFile(uri: Uri, encoding: 'utf8'): Promise<string>
	async readFile(uri: Uri, encoding?: 'utf8'): Promise<Uint8Array | string> {
		const filePath = this.normalizePath(uri.fsPath)
		const item = this.fileSystem.get(filePath)

		if (!item || item.type !== 'file') {
			throw new Error(`File not found: ${filePath}`)
		}

		// Return string if utf8 encoding is requested, otherwise return Uint8Array
		if (encoding === 'utf8') {
			return new TextDecoder().decode(item.content)
		}

		return item.content
	}

	async writeFile(uri: Uri, content: Uint8Array | string): Promise<void> {
		// Convert string content to Uint8Array if needed
		const contentArray = typeof content === 'string' ? new TextEncoder().encode(content) : content
		const filePath = this.normalizePath(uri.fsPath)
		const now = Date.now()

		// Ensure parent directory exists
		const parentDir = path.dirname(filePath)

		if (parentDir !== '.' && parentDir !== '/') {
			await this.ensureDirectoryExists(parentDir)
		}

		this.fileSystem.set(filePath, {
			content: contentArray,
			type: 'file',
			ctime: now,
			mtime: now,
			size: contentArray.length,
		})

		this.utils.debug(`File written: ${filePath} (${contentArray.length} bytes)`)
	}

	async createDirectory(uri: Uri): Promise<void> {
		const dirPath = this.normalizePath(uri.fsPath)
		const now = Date.now()

		// Ensure parent directory exists
		const parentDir = path.dirname(dirPath)

		if (parentDir !== '.' && parentDir !== '/') {
			await this.ensureDirectoryExists(parentDir)
		}

		this.fileSystem.set(dirPath, {
			content: new Uint8Array(),
			type: 'directory',
			ctime: now,
			mtime: now,
			size: 0,
		})

		this.utils.debug(`Directory created: ${dirPath}`)
	}

	async readDirectory(uri: Uri): Promise<[string, number][]> {
		const dirPath = this.normalizePath(uri.fsPath)
		const results: [string, number][] = []

		// Verify the directory exists
		const dirItem = this.fileSystem.get(dirPath)

		if (!dirItem || dirItem.type !== 'directory') {
			throw new Error(`Directory not found: ${dirPath}`)
		}

		// Find all items in this directory
		for (const [filePath, item] of this.fileSystem.entries()) {
			if (filePath.startsWith(dirPath) && filePath !== dirPath) {
				const relativePath = filePath.substring(dirPath.length + 1)
				const parts = relativePath.split(path.sep)

				// Only include direct children (not nested items)
				if (parts.length === 1) {
					const type = item.type === 'file' ? 1 : 2 // 1 = File, 2 = Directory

					results.push([parts[0], type])
				}
			}
		}

		return results
	}

	async delete(uri: Uri, options?: { recursive?: boolean, useTrash?: boolean }): Promise<void> {
		const filePath = this.normalizePath(uri.fsPath)
		const item = this.fileSystem.get(filePath)

		if (!item) {
			throw new Error(`File not found: ${filePath}`)
		}

		// If it's a directory and not recursive, check if it's empty
		if (item.type === 'directory' && !options?.recursive) {
			const children = await this.readDirectory(uri)

			if (children.length > 0) {
				throw new Error(`Directory not empty: ${filePath}`)
			}
		}

		// Remove the item and all its children
		const itemsToDelete = [filePath]

		for (const [path] of this.fileSystem.entries()) {
			if (path.startsWith(filePath) && path !== filePath) {
				itemsToDelete.push(path)
			}
		}

		itemsToDelete.forEach(path => this.fileSystem.delete(path))
		this.utils.debug(`Deleted: ${filePath}`)
	}

	async copy(source: Uri, target: Uri, options?: { overwrite?: boolean }): Promise<void> {
		const sourcePath = this.normalizePath(source.fsPath)
		const targetPath = this.normalizePath(target.fsPath)
		const sourceItem = this.fileSystem.get(sourcePath)

		if (!sourceItem) {
			throw new Error(`Source file not found: ${sourcePath}`)
		}

		// Check if target exists and overwrite is not allowed
		if (this.fileSystem.has(targetPath) && options?.overwrite === false) {
			throw new Error(`Target already exists: ${targetPath}`)
		}

		// Ensure target directory exists
		const targetDir = path.dirname(targetPath)

		if (targetDir !== '.' && targetDir !== '/') {
			await this.ensureDirectoryExists(targetDir)
		}

		// Copy the item
		this.fileSystem.set(targetPath, { ...sourceItem })
		this.utils.debug(`Copied: ${sourcePath} -> ${targetPath}`)
	}

	async rename(source: Uri, target: Uri, options?: { overwrite?: boolean }): Promise<void> {
		const sourcePath = this.normalizePath(source.fsPath)
		const targetPath = this.normalizePath(target.fsPath)
		const sourceItem = this.fileSystem.get(sourcePath)

		if (!sourceItem) {
			throw new Error(`Source file not found: ${sourcePath}`)
		}

		// Check if target exists and overwrite is not allowed
		if (this.fileSystem.has(targetPath) && options?.overwrite === false) {
			throw new Error(`Target already exists: ${targetPath}`)
		}

		// Ensure target directory exists
		const targetDir = path.dirname(targetPath)

		if (targetDir !== '.' && targetDir !== '/') {
			await this.ensureDirectoryExists(targetDir)
		}

		// Move the item
		this.fileSystem.delete(sourcePath)
		this.fileSystem.set(targetPath, sourceItem)
		this.utils.debug(`Renamed: ${sourcePath} -> ${targetPath}`)
	}

	// Utility methods for testing
	exists(filePath: string): boolean {
		return this.fileSystem.has(this.normalizePath(filePath))
	}

	getFileContent(filePath: string): string | null {
		const item = this.fileSystem.get(this.normalizePath(filePath))

		if (item && item.type === 'file') {
			return new TextDecoder().decode(item.content)
		}
		return null
	}

	setFileContent(filePath: string, content: string): void {
		const normalizedPath = this.normalizePath(filePath)
		const now = Date.now()
		
		this.fileSystem.set(normalizedPath, {
			content: new TextEncoder().encode(content),
			type: 'file',
			ctime: now,
			mtime: now,
			size: content.length,
		})
	}

	createFile(filePath: string, content: string = ''): void {
		this.setFileContent(filePath, content)
	}

	createDirectoryPath(dirPath: string): void {
		const normalizedPath = this.normalizePath(dirPath)
		const now = Date.now()
		
		this.fileSystem.set(normalizedPath, {
			content: new Uint8Array(),
			type: 'directory',
			ctime: now,
			mtime: now,
			size: 0,
		})
	}

	// Private helper methods
	private normalizePath(filePath: string): string {
		// Normalize path separators and resolve relative paths
		return path.normalize(filePath).replace(/\\/g, '/')
	}

	private async ensureDirectoryExists(dirPath: string): Promise<void> {
		const normalizedPath = this.normalizePath(dirPath)
		
		if (this.fileSystem.has(normalizedPath)) {
			return
		}

		// Create parent directories recursively
		const parentDir = path.dirname(normalizedPath)

		if (parentDir !== '.' && parentDir !== '/') {
			await this.ensureDirectoryExists(parentDir)
		}

		const now = Date.now()

		this.fileSystem.set(normalizedPath, {
			content: new Uint8Array(),
			type: 'directory',
			ctime: now,
			mtime: now,
			size: 0,
		})
	}

	// Debug methods for testing
	getFileSystemState(): Map<string, MockFileSystemItem> {
		return new Map(this.fileSystem)
	}

	clear(): void {
		this.fileSystem.clear()
	}

	printFileSystem(): void {
		console.log('Mock File System State:')
		for (const [path, item] of this.fileSystem.entries()) {
			console.log(`  ${path} (${item.type}) - ${item.size} bytes`)
		}
	}

}
