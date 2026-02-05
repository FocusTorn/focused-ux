// ESLint & Imports -->>

//--------------------------------------------------------------------------------------------------------------<<

export interface NotesHubConfig { //>
	projectNotesPath: string
	globalNotesPath: string
	isProjectNotesEnabled: boolean
	isGlobalNotesEnabled: boolean
} //<

export interface INotesHubConfigService { //>
	getNotesHubConfig: (configPrefix: string) => NotesHubConfig
	createDirectoryIfNeeded: (dirPath: string) => Promise<void>
} //<
