export declare const CONFIG_FILE_NAME = ".FocusedUX"
export declare const CONFIG_SECTION = "ProjectButler"
export declare const DEFAULT_PACKAGE_JSON_ORDER: string[]
export declare const TERMINAL_COMMAND_PREFIX = "cd"
export declare const TERMINAL_PATH_QUOTE_CHAR = "\""
export declare const BACKUP_SUFFIX = ".bak"
export declare const BACKUP_TIMESTAMP_FORMAT = "YYYY-MM-DD_HH-mm-ss"
export declare const POETRY_SHELL_COMMAND = "poetry shell"
export declare const POETRY_CONFIG_FILE = "pyproject.toml"
export declare const SUPPORTED_CONFIG_FORMATS: string[]
export declare const SUPPORTED_PACKAGE_FORMATS: string[]
export declare const ERROR_MESSAGES: {
    readonly CONFIG_FILE_NOT_FOUND: "Could not read '.FocusedUX' file";
    readonly CONFIG_PARSE_ERROR: "Could not parse '.FocusedUX' file";
    readonly PACKAGE_JSON_NOT_FOUND: "Could not read 'package.json' file";
    readonly PACKAGE_JSON_PARSE_ERROR: "Could not parse 'package.json' file";
    readonly BACKUP_CREATION_FAILED: "Failed to create backup";
    readonly TERMINAL_PATH_UPDATE_FAILED: "Failed to update terminal path";
    readonly POETRY_SHELL_FAILED: "Failed to enter Poetry shell";
}
export declare const SUCCESS_MESSAGES: {
    readonly PACKAGE_JSON_FORMATTED: "Package.json formatted successfully";
    readonly BACKUP_CREATED: "Backup created successfully";
    readonly TERMINAL_PATH_UPDATED: "Terminal path updated successfully";
    readonly POETRY_SHELL_ENTERED: "Poetry shell entered successfully";
}
export declare const FILE_PATHS: {
    readonly CONFIG_FILE: ".FocusedUX";
    readonly PACKAGE_JSON: "package.json";
    readonly POETRY_CONFIG: "pyproject.toml";
    readonly BACKUP_DIRECTORY: "backups";
}
//# sourceMappingURL=constants.d.ts.map