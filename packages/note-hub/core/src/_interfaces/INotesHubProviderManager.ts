// ESLint & Imports -->>

//= IMPLEMENTATION TYPES ======================================================================================
import type { INotesHubDataProvider } from './INotesHubDataProvider.js'
import type { INotesHubItem } from './INotesHubItem.js'
import type { NotesHubConfig } from './INotesHubConfigService.js'

//--------------------------------------------------------------------------------------------------------------<<

export interface INotesHubProviderManager { //>
	initializeProviders: (config: NotesHubConfig, commandPrefix: string, openNoteCommandId: string) => Promise<void>
	getProviderForNote: (item: INotesHubItem) => Promise<INotesHubDataProvider | undefined>
	getProviderInstance: (providerName: 'project' | 'global') => INotesHubDataProvider | undefined
	refreshProviders: (providersToRefresh?: 'project' | 'global' | 'all' | Array<'project' | 'global'>) => void
	revealNotesHubItem: (provider: INotesHubDataProvider, item: INotesHubItem, select?: boolean) => Promise<void>
	dispose: () => void
} //<
