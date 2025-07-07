// ESLint & Imports -->>

//= IMPLEMENTATION TYPES ======================================================================================
import type { FileSystemEntry } from './ccp.types.js'

//--------------------------------------------------------------------------------------------------------------<<

export interface FileContentResult { //>
	contentString: string
	processedTokens: number
	limitReached: boolean
} //<

export interface IFileContentProviderService { //>
	getFileContents: (
		contentFileUris: Set<string>,
		collectedFileSystemEntries: Map<string, FileSystemEntry>,
		maxTokens: number,
		currentTotalTokens: number,
	) => Promise<FileContentResult>
} //<
