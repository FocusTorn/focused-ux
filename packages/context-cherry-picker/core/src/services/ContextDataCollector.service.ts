// ESLint & Imports -->>

//= MISC ======================================================================================================
import * as micromatch from 'micromatch'

//= IMPLEMENTATION TYPES ======================================================================================
import type { IContextDataCollectorService, CollectionResult } from '../_interfaces/IContextDataCollectorService.js'
import type { FileSystemEntry } from '../_interfaces/ccp.types.js'
import type { IWorkspace } from '../_interfaces/IWorkspace.js'
import type { IPath } from '../_interfaces/IPath.js'
import type { IFileSystem, DirectoryEntry } from '../_interfaces/IFileSystem.js'
import { constants } from '../_config/constants.js'

//--------------------------------------------------------------------------------------------------------------<<

const LOG_PREFIX = `[${constants.extension.nickName} - ContextDataCollector]:`

export class ContextDataCollectorService implements IContextDataCollectorService { //>

	private projectRootUri!: string

	constructor(
		private readonly workspace: IWorkspace,
		private readonly fileSystem: IFileSystem,
		private readonly path: IPath,
	) {}

	public async collectContextData(
		mode: 'all' | 'selected' | 'none',
		initialCheckedUris: string[],
		projectRootUri: string,
		coreScanIgnoreGlobs: string[],
		coreScanDirHideAndContentsGlobs: string[],
		coreScanDirShowDirHideContentsGlobs: string[],
	): Promise<CollectionResult> {
		this.projectRootUri = projectRootUri

		const collectedFileSystemEntries = new Map<string, FileSystemEntry>()
		const urisForContentFsPaths = new Set<string>()
		const initialSelectionSet = new Set(initialCheckedUris)

		console.log(`${LOG_PREFIX} Collecting file URIs for content based on initial selections.`)
		await this._recursivelyCollectFileUrisForContent(
			initialCheckedUris,
			urisForContentFsPaths,
			coreScanIgnoreGlobs,
			coreScanDirHideAndContentsGlobs,
			coreScanDirShowDirHideContentsGlobs,
			initialSelectionSet,
		)
		console.log(`${LOG_PREFIX} Found ${urisForContentFsPaths.size} actual file URIs for content.`)

		console.log(`${LOG_PREFIX} Collecting file system entries (mode: ${mode}).`)
		if (mode === 'all') {
			await this._recursivelyCollectTreeEntries(
				this.projectRootUri,
				collectedFileSystemEntries,
				coreScanIgnoreGlobs,
				coreScanDirHideAndContentsGlobs,
				coreScanDirShowDirHideContentsGlobs,
			)
		}
		else if (mode === 'selected') {
			for (const uri of initialCheckedUris) {
				await this._recursivelyCollectTreeEntries(
					uri,
					collectedFileSystemEntries,
					coreScanIgnoreGlobs,
					coreScanDirHideAndContentsGlobs,
					coreScanDirShowDirHideContentsGlobs,
				)
			}
		}

		for (const contentUri of urisForContentFsPaths) {
			if (!collectedFileSystemEntries.has(contentUri)) {
				try {
					const stat = await this.fileSystem.stat(contentUri)
					const relativePath = this._getRelativePath(contentUri)
					const name = this.path.basename(contentUri) || relativePath.split('/').pop() || relativePath

					collectedFileSystemEntries.set(contentUri, {
						uri: contentUri,
						isFile: true,
						size: stat.size,
						name,
						relativePath,
					})
				}
				catch (e: any) {
					console.warn(`${LOG_PREFIX} Error stating content file ${contentUri} for metadata: ${e.message}`)
				}
			}
		}

		console.log(`${LOG_PREFIX} Collected ${collectedFileSystemEntries.size} entries for FileSystemEntry map.`)
		return { treeEntries: collectedFileSystemEntries, contentFileUris: urisForContentFsPaths }
	}

	private _getRelativePath(uri: string): string {
		if (!this.projectRootUri) {
			console.warn(`${LOG_PREFIX} projectRootUri is not set when calling _getRelativePath for ${uri}`)
			return this.workspace.asRelativePath(uri, false).replace(/\\/g, '/')
		}

		const rootFsPath = this.projectRootUri
		const currentFsPath = uri
		const relative = this.path.relative(rootFsPath, currentFsPath)

		return relative.replace(/\\/g, '/')
	}

	private async _recursivelyCollectFileUrisForContent(
		urisToScan: string[],
		targetSet: Set<string>,
		baseIgnores: string[],
		hideDirAndContents: string[],
		showDirHideContents: string[],
		initialSelectionSet: Set<string>,
	): Promise<void> {
		const mm = micromatch

		for (const uri of urisToScan) {
			if (!uri.startsWith(this.projectRootUri)) {
				continue
			}

			const relativePath = this._getRelativePath(uri)

			if (mm.isMatch(relativePath, baseIgnores) || mm.isMatch(relativePath, hideDirAndContents)) {
				continue
			}

			try {
				const stat = await this.fileSystem.stat(uri)

				if (stat.type === 'file') {
					targetSet.add(uri)
				}
				else if (stat.type === 'directory') {
					if (mm.isMatch(relativePath, showDirHideContents)) {
						continue
					}

					const entries = await this.fileSystem.readDirectory(uri)
					const childrenUris = entries.map((entry: DirectoryEntry) => this.path.join(uri, entry.name))

					await this._recursivelyCollectFileUrisForContent(
						childrenUris,
						targetSet,
						baseIgnores,
						hideDirAndContents,
						showDirHideContents,
						initialSelectionSet,
					)
				}
			}
			catch (error: any) {
				console.error(`${LOG_PREFIX} [ContentScan] Error processing ${uri}: ${error.message}`)
			}
		}
	}

	private async _recursivelyCollectTreeEntries(
		uri: string,
		targetMap: Map<string, FileSystemEntry>,
		baseIgnores: string[],
		hideDirAndContents: string[],
		showDirHideContents: string[],
	): Promise<void> {
		const mm = micromatch

		if (!uri.startsWith(this.projectRootUri)) {
			return
		}

		const relativePath = this._getRelativePath(uri)

		if (mm.isMatch(relativePath, baseIgnores) || mm.isMatch(relativePath, hideDirAndContents)) {
			return
		}

		try {
			const stat = await this.fileSystem.stat(uri)
			const name = this.path.basename(uri) || (relativePath === '' ? this.path.basename(this.projectRootUri) : relativePath.split('/').pop() || relativePath)

			if (!targetMap.has(uri)) {
				targetMap.set(uri, {
					uri,
					isFile: stat.type === 'file',
					size: stat.size,
					name,
					relativePath,
				})
			}

			if (stat.type === 'directory') {
				if (mm.isMatch(relativePath, showDirHideContents)) {
					return
				}

				const entries = await this.fileSystem.readDirectory(uri)

				for (const childEntry of entries) {
					const childUri = this.path.join(uri, childEntry.name)

					await this._recursivelyCollectTreeEntries(
						childUri,
						targetMap,
						baseIgnores,
						hideDirAndContents,
						showDirHideContents,
					)
				}
			}
		}
		catch (error: any) {
			console.error(`${LOG_PREFIX} [TreeScan] Error processing ${uri}: ${error.message}`)
		}
	}

}
