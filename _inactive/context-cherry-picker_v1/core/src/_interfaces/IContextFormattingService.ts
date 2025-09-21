// ESLint & Imports -->>

//= IMPLEMENTATION TYPES ======================================================================================
import type { FileSystemEntry } from './ccp.types.js'

//--------------------------------------------------------------------------------------------------------------<<

export interface IContextFormattingService { //>
	generateProjectTreeString: (
		treeEntriesMap: Map<string, FileSystemEntry>,
		projectRootUri: string,
		projectRootName: string,
		outputFilterAlwaysShow: string[],
		outputFilterAlwaysHide: string[],
		outputFilterShowIfSelected: string[],
		initialCheckedUris: string[],
	) => Promise<string>
} //<
