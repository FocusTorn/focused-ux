export const notesHubConstants = {
	// These are relative keys. The full key is built by the service using a prefix.
	configKeys: {
		ENABLE_PROJECT_NOTES: `enableProjectNotes`,
		ENABLE_REMOTE_NOTES: `enableRemoteNotes`,
		ENABLE_GLOBAL_NOTES: `enableGlobalNotes`,
		PROJECT_PATH: `projectNotesPath`,
		REMOTE_PATH: `remoteNotesPath`,
		GLOBAL_PATH: `globalNotesPath`,
	},
	// These are context/storage keys that need a prefix.
	contextKeys: {
		CAN_PASTE: `canPaste`,
	},
	storageKeys: {
		OPERATION: `operation`,
	},
	// These are command suffixes. The prefix is added by the ext module.
	commands: {
		openNote: 'openNote',
	},
	errorMessages: {
		MISSING_REQUIRED_PARAMETER: 'Missing required parameter',
		INVALID_INPUT: 'Invalid input provided',
		INVALID_NOTE_ITEM: 'Invalid note item provided',
		INVALID_PROVIDER_NAME: 'Invalid provider name provided',
		WORKFLOW_EXECUTION_FAILED: 'Workflow execution failed',
		ORCHESTRATION_FAILED: 'Complex orchestration failed',
		NOTE_OPERATION_FAILED: 'Note operation failed',
		PROVIDER_INITIALIZATION_FAILED: 'Provider initialization failed',
		NO_NOTE_ITEM: 'No note item provided',
		NO_PROVIDER_SELECTED: 'No provider selected',
		CONFIGURATION_UPDATE_FAILED: 'Configuration update failed',
	},
} as const
