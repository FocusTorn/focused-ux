// ESLint & Imports -->>

//= IMPLEMENTATION TYPES ======================================================================================
import type { FileContentResult, IFileContentProviderService } from '../_interfaces/IFileContentProviderService.js'
import type { FileSystemEntry } from '../_interfaces/ccp.types.js'
import type { IWindow } from '../_interfaces/IWindow.js'
import type { IFileSystem } from '../_interfaces/IFileSystem.js'
import type { ITokenizerService } from '../_interfaces/ITokenizerService.js'
import { constants } from '../_config/constants.js'

//--------------------------------------------------------------------------------------------------------------<<

const LOG_PREFIX = `[${constants.extension.nickName} - FileContentProvider]:`

export class FileContentProviderService implements IFileContentProviderService {

	constructor(
		private readonly fileSystem: IFileSystem,
		private readonly window: IWindow,
		private readonly tokenizerService: ITokenizerService,
	) {}

	private async _localEstimateTokens(text: string): Promise<number> {
		return await this.tokenizerService.calculateTokens(text)
	}

	public async getFileContents(
		contentFileUrisSet: Set<string>,
		collectedFileSystemEntries: Map<string, FileSystemEntry>,
		maxTokens: number,
		currentTotalTokens: number,
	): Promise<FileContentResult> {
		let tempFilesContentString = ''
		let processedTokensThisCall = 0
		let limitReachedInThisCall = false

		const sortedContentUris = Array.from(contentFileUrisSet).sort((a, b) => {
			const entryA = collectedFileSystemEntries.get(a)
			const entryB = collectedFileSystemEntries.get(b)
			const pathA = entryA ? entryA.relativePath : a
			const pathB = entryB ? entryB.relativePath : b

			return pathA.localeCompare(pathB)
		})

		if (sortedContentUris.length > 0) {
			console.log(`${LOG_PREFIX} Starting to process file contents for ${sortedContentUris.length} items.`)
			for (const uri of sortedContentUris) {
				const entry = collectedFileSystemEntries.get(uri)

				if (!entry || !entry.isFile) {
					console.warn(`${LOG_PREFIX} URI ${uri} for content but not a valid file entry. Skipping.`)
					continue
				}

				try {
					const fileContent = await this.fileSystem.readFile(uri)
					const fileEntryString = `<file name="${entry.name}" path="/${entry.relativePath}">\n${fileContent}\n</file>\n`
					const tokensForThisFile = await this._localEstimateTokens(fileEntryString)

					if (currentTotalTokens + processedTokensThisCall + tokensForThisFile > maxTokens) {
						this.window.showWarningMessage(`Context limit reached. File '${entry.name}' and subsequent files were not added.`, false)
						console.log(`${LOG_PREFIX} Token limit reached processing ${entry.name}.`)
						limitReachedInThisCall = true
						break
					}
					tempFilesContentString += fileEntryString
					processedTokensThisCall += tokensForThisFile
				}
				catch (error: any) {
					this.window.showErrorMessage(`Error reading file ${uri} for content: ${error.message}`)
					console.error(`${LOG_PREFIX} Error reading file ${uri}: ${error.message}`)
				}
			}
		}
		else {
			console.log(`${LOG_PREFIX} No file items were identified for content processing.`)
		}

		return {
			contentString: tempFilesContentString,
			processedTokens: processedTokensThisCall,
			limitReached: limitReachedInThisCall,
		}
	}

}
