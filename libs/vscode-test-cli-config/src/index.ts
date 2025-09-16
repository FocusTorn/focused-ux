import { defineConfig } from '@vscode/test-cli'
import * as path from 'node:path'

/**
 * Defines the package-specific options required by the configuration factory.
 */
export interface FuxVSCodeTestConfigOptions {
	/** A unique name for the package being tested, used for the user data directory. */
	packageName: string

	/** The absolute path to the extension's development directory (usually `__dirname`). */
	extensionDevelopmentPath: string

	/** The relative path to the test workspace directory. */
	workspaceFolder: string

	/** A glob pattern for test files. Defaults to `./out-tsc/suite/**\/*.test.js`. */
	files?: string | string[]

	/** A path to a test setup file. Defaults to `./out-tsc/suite/index.js`. */
	setupFiles?: string | string[]

	/** Any other options to pass through to the underlying `defineConfig`. */
	[key: string]: any
}

/**
 * Creates a standardized VS Code integration test configuration.
 * @param options - Package-specific options.
 * @returns The complete test configuration object.
 */
export function createVscodeTestConfig(options: FuxVSCodeTestConfigOptions) {
	const {
		packageName,
		extensionDevelopmentPath,
		workspaceFolder,
		files = './out-tsc/**/*.test.js',
		setupFiles = './out-tsc/index.js',
		...restOptions
	} = options

	// Resolve paths for monorepo root and package-local test data
	const monorepoRoot = path.resolve(extensionDevelopmentPath, '..', '..', '..')
	const sharedCachePath = path.resolve(monorepoRoot, './libs/vscode-test-cli-config/.vscode-test')
	const packageUserDataDir = path.resolve(sharedCachePath, 'user-data', packageName)
	const sharedExtensionsPath = path.resolve(sharedCachePath, 'extensions')

	const defaultConfig = {
		// Centralize the VS Code download location at the monorepo root
		cachePath: sharedCachePath,
		version: 'insiders',
		files,
		workspaceFolder,
		setupFiles,
		extensionDevelopmentPath,
		env: {
			VSCODE_TEST: '1',
		},
		launchArgs: [
			// Use a dedicated, package-specific user data directory in the root for an isolated run
			'--user-data-dir',
			packageUserDataDir,

			// Centralize the extensions directory to prevent local .vscode-test folders
			'--extensions-dir',
			sharedExtensionsPath,

			// Disable all extensions except for the one being tested for a clean environment.
			'--disable-extensions',

			// Disable the workspace trust feature to prevent popups that can block tests.
			'--disable-workspace-trust',

			// Disable Settings Sync to prevent authentication provider timeouts.
			'--sync',
			'off',

			// Explicitly disable noisy or conflicting built-in and common extensions.
			'--disable-extension',
			'ms-vsliveshare.vsliveshare',
			'--disable-extension',
			'ms-python.python',
			'--disable-extension',
			'ms-python.gather',
			'--disable-extension',
			'vscode.git',
			'--disable-extension',
			'vscode.github-authentication',
			'--disable-extension',
			'GitHub.copilot',
			'--disable-extension',
			'GitHub.copilot-chat',

			// Load our extension for testing.
			'--extensionDevelopmentPath',
			extensionDevelopmentPath,
		],
	}

	// Merge the default config with any passthrough options
	return defineConfig({ ...defaultConfig, ...restOptions })
}
