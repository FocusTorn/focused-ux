export const ghostWriterConstants = {
	storageKeys: {
		CLIPBOARD: 'fux-ghost-writer.clipboard',
	},
} as const

export const ERROR_MESSAGES = {
	INVALID_INPUT: 'Invalid input provided',
	FRAGMENT_NOT_FOUND: 'No stored fragment found',
	IMPORT_GENERATION_FAILED: 'Failed to generate import statement',
	CONSOLE_LOG_GENERATION_FAILED: 'Failed to generate console log statement',
	STORAGE_OPERATION_FAILED: 'Storage operation failed',
	INVALID_FILE_PATH: 'Invalid file path provided',
	MISSING_REQUIRED_PARAMETER: 'Required parameter is missing',
} as const

export const SUCCESS_MESSAGES = {
	FRAGMENT_STORED: 'Fragment stored successfully',
	FRAGMENT_RETRIEVED: 'Fragment retrieved successfully',
	FRAGMENT_CLEARED: 'Fragment cleared successfully',
	IMPORT_GENERATED: 'Import statement generated successfully',
	CONSOLE_LOG_GENERATED: 'Console log statement generated successfully',
} as const