const CONFIG_FILE_NAME = ".FocusedUX"
const CONFIG_SECTION = "ProjectButler"
const DEFAULT_PACKAGE_JSON_ORDER = [
    "name",
    "version",
    "description",
    "main",
    "types",
    "scripts",
    "dependencies",
    "devDependencies",
    "peerDependencies",
    "optionalDependencies",
    "engines",
    "repository",
    "keywords",
    "author",
    "license"
]
const TERMINAL_COMMAND_PREFIX = "cd"
const TERMINAL_PATH_QUOTE_CHAR = '"'
const BACKUP_SUFFIX = ".bak"
const BACKUP_TIMESTAMP_FORMAT = "YYYY-MM-DD_HH-mm-ss"
const POETRY_SHELL_COMMAND = "poetry shell"
const POETRY_CONFIG_FILE = "pyproject.toml"
const SUPPORTED_CONFIG_FORMATS = ["yaml", "yml", "json"]
const SUPPORTED_PACKAGE_FORMATS = ["json"]
const ERROR_MESSAGES = {
    CONFIG_FILE_NOT_FOUND: "Could not read '.FocusedUX' file",
    CONFIG_PARSE_ERROR: "Could not parse '.FocusedUX' file",
    PACKAGE_JSON_NOT_FOUND: "Could not read 'package.json' file",
    PACKAGE_JSON_PARSE_ERROR: "Could not parse 'package.json' file",
    BACKUP_CREATION_FAILED: "Failed to create backup",
    TERMINAL_PATH_UPDATE_FAILED: "Failed to update terminal path",
    POETRY_SHELL_FAILED: "Failed to enter Poetry shell"
}
const SUCCESS_MESSAGES = {
    PACKAGE_JSON_FORMATTED: "Package.json formatted successfully",
    BACKUP_CREATED: "Backup created successfully",
    TERMINAL_PATH_UPDATED: "Terminal path updated successfully",
    POETRY_SHELL_ENTERED: "Poetry shell entered successfully"
}
const FILE_PATHS = {
    CONFIG_FILE: ".FocusedUX",
    PACKAGE_JSON: "package.json",
    POETRY_CONFIG: "pyproject.toml",
    BACKUP_DIRECTORY: "backups"
}

export {
    BACKUP_SUFFIX,
    BACKUP_TIMESTAMP_FORMAT,
    CONFIG_FILE_NAME,
    CONFIG_SECTION,
    DEFAULT_PACKAGE_JSON_ORDER,
    ERROR_MESSAGES,
    FILE_PATHS,
    POETRY_CONFIG_FILE,
    POETRY_SHELL_COMMAND,
    SUCCESS_MESSAGES,
    SUPPORTED_CONFIG_FORMATS,
    SUPPORTED_PACKAGE_FORMATS,
    TERMINAL_COMMAND_PREFIX,
    TERMINAL_PATH_QUOTE_CHAR
}
