// ESLint & Imports -->>

//= IMPLEMENTATION TYPES ======================================================================================
import type { FileSystemEntry } from './ccp.types.js'

//--------------------------------------------------------------------------------------------------------------<<

export interface CollectionResult { //>
	treeEntries: Map<string, FileSystemEntry>
	contentFileUris: Set<string>
} //<

export interface IContextDataCollectorService { //>
	collectContextData: (
		mode: 'all' | 'selected' | 'none',
		initialCheckedUris: string[],
		projectRootUri: string,
		coreScanIgnoreGlobs: string[],
		coreScanDirHideAndContentsGlobs: string[],
		coreScanDirShowDirHideContentsGlobs: string[],
	) => Promise<CollectionResult>
} //<
