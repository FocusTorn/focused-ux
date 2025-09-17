// Project Butler Configuration Constants

export const CONFIG_FILE_NAME = '.FocusedUX'
export const CONFIG_SECTION = 'ProjectButler'

// Package.json formatting constants
export const DEFAULT_PACKAGE_JSON_ORDER = [
	'name',
	'version',
	'description',
	'main',
	'types',
	'scripts',
	'dependencies',
	'devDependencies',
	'peerDependencies',
	'optionalDependencies',
	'engines',
	'repository',
	'keywords',
	'author',
	'license'
]

// Terminal management constants
export const TERMINAL_COMMAND_PREFIX = 'cd'
export const TERMINAL_PATH_QUOTE_CHAR = '"'

// Backup management constants
export const BACKUP_SUFFIX = '-backup'
export const BACKUP_TIMESTAMP_FORMAT = 'YYYY-MM-DD_HH-mm-ss'

// Poetry shell constants
export const POETRY_SHELL_COMMAND = 'poetry shell'
export const POETRY_CONFIG_FILE = 'pyproject.toml'

// File system constants
export const SUPPORTED_CONFIG_FORMATS = ['yaml', 'yml', 'json']
export const SUPPORTED_PACKAGE_FORMATS = ['json']

// Error messages
export const ERROR_MESSAGES = {
	CONFIG_FILE_NOT_FOUND: 'Could not read \'.FocusedUX\' file',
	CONFIG_PARSE_ERROR: 'Could not parse \'.FocusedUX\' file',
	PACKAGE_JSON_NOT_FOUND: 'Could not read \'package.json\' file',
	PACKAGE_JSON_PARSE_ERROR: 'Could not parse \'package.json\' file',
	BACKUP_CREATION_FAILED: 'Failed to create backup',
	TERMINAL_PATH_UPDATE_FAILED: 'Failed to update terminal path',
	POETRY_SHELL_FAILED: 'Failed to enter Poetry shell'
} as const

// Success messages
export const SUCCESS_MESSAGES = {
	PACKAGE_JSON_FORMATTED: 'Package.json formatted successfully',
	BACKUP_CREATED: 'Backup created successfully',
	TERMINAL_PATH_UPDATED: 'Terminal path updated successfully',
	POETRY_SHELL_ENTERED: 'Poetry shell entered successfully'
} as const

// File paths
export const FILE_PATHS = {
	CONFIG_FILE: '.FocusedUX',
	PACKAGE_JSON: 'package.json',
	POETRY_CONFIG: 'pyproject.toml',
	BACKUP_DIRECTORY: 'backups'
} as const
