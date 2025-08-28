import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as adaptersModule from '../../src/adapters/index.js'
import * as coreModule from '@fux/dynamicons-core'
import * as extensionModule from '../../src/extension.js'

// Mock vscode
vi.mock('vscode', () => ({
	window: {
		showInformationMessage: vi.fn(),
		showErrorMessage: vi.fn(),
		showWarningMessage: vi.fn(),
		showQuickPick: vi.fn(),
	},
	commands: {
		registerCommand: vi.fn(),
		executeCommand: vi.fn(),
	},
	workspace: {
		getConfiguration: vi.fn(),
		onDidChangeConfiguration: vi.fn(),
		fs: {
			stat: vi.fn(),
			readDirectory: vi.fn(),
			readFile: vi.fn(),
			writeFile: vi.fn(),
			createDirectory: vi.fn(),
			copy: vi.fn(),
		},
	},
	Uri: {
		file: (path: string) => ({
			fsPath: path,
			scheme: 'file',
			authority: '',
			path,
			query: '',
			fragment: '',
			toString: () => path,
		}),
		joinPath: (base: any, ...pathSegments: string[]) => ({
			fsPath: `${base.fsPath}/${pathSegments.join('/')}`,
			scheme: 'file',
			authority: '',
			path: `${base.path}/${pathSegments.join('/')}`,
			query: '',
			fragment: '',
			toString: () => `${base.fsPath}/${pathSegments.join('/')}`,
		}),
	},
	FileType: {
		File: 1,
		Directory: 2,
		SymbolicLink: 64,
	},
}))

// Mock core services
vi.mock('@fux/dynamicons-core', () => ({
	dynamiconsConstants: {
		featureName: 'Dynamicons',
		packageNameCore: '@focused-ux/dynamicons-core',
		packageNameExt: 'fux-dynamicons',
		configPrefix: 'dynamicons',
		iconThemeId: 'dynamicons-theme',
		commands: {
			activateIconTheme: 'dynamicons.activateIconTheme',
			assignIcon: 'dynamicons.assignIcon',
			revertIcon: 'dynamicons.revertIcon',
			toggleExplorerArrows: 'dynamicons.toggleExplorerArrows',
			showUserFileIconAssignments: 'dynamicons.showUserFileIconAssignments',
			showUserFolderIconAssignments: 'dynamicons.showUserFolderIconAssignments',
			refreshIconTheme: 'dynamicons.refreshIconTheme',
		},
		configKeys: {
			userIconsDirectory: 'userIconsDirectory',
			customIconMappings: 'customIconMappings',
			hideExplorerArrows: 'hideExplorerArrows',
			baseThemeFileName: 'baseThemeFileName',
			generatedThemeFileName: 'generatedThemeFileName',
		},
		associationKeyPrefixes: {
			file: 'file:',
			folder: 'folder:',
			language: 'language:',
		},
		defaults: {
			userIconDefinitionPrefix: '_user_',
			iconThemeNamePrefix: '_dynamiconsTheme_',
			openFolderIconSuffix: '-open',
			baseThemeFilenameDefault: 'base.theme.json',
			generatedThemeFilenameDefault: 'dynamicons.theme.json',
		},
		assets: {
			themesPath: 'assets/themes',
		},
	},
	IconActionsService: vi.fn(),
	IconThemeGeneratorService: vi.fn(),
	ConfigurationService: vi.fn(),
	IconDiscoveryService: vi.fn(),
	IconPickerService: vi.fn(),
}))

// Mock all the adapters
vi.mock('../../src/adapters/index.js', () => ({
	WindowAdapter: vi.fn(),
	CommandsAdapter: vi.fn(),
	WorkspaceAdapter: vi.fn(),
	ContextAdapter: vi.fn(),
	PathAdapter: vi.fn(),
	FileSystemAdapter: vi.fn(),
	QuickPickAdapter: vi.fn(),
	CommonUtilsAdapter: vi.fn(),
	UriAdapter: vi.fn(),
}))

describe('Extension', () => {
	let mockContext: any

	beforeEach(async () => {
		vi.clearAllMocks()

		mockContext = {
			subscriptions: [],
			extensionPath: '/test/extension/path',
			globalState: { get: vi.fn(), update: vi.fn() },
			workspaceState: { get: vi.fn(), update: vi.fn() },
		}

		// Mock CommandsAdapter
		const mockCommandsAdapter = {
			registerCommand: vi.fn().mockReturnValue({ dispose: vi.fn() }),
			executeCommand: vi.fn(),
		}

		// Mock WorkspaceAdapter with onDidChangeConfiguration
		const mockWorkspaceAdapter = {
			getConfiguration: vi.fn().mockReturnValue({
				get: vi.fn(),
				update: vi.fn(),
			}),
			onDidChangeConfiguration: vi.fn().mockReturnValue({ dispose: vi.fn() }),
		}

		// Mock the adapters to return our mock instances
		vi.mocked(adaptersModule.CommandsAdapter).mockImplementation(() => mockCommandsAdapter as any)
		vi.mocked(adaptersModule.WorkspaceAdapter).mockImplementation(() => mockWorkspaceAdapter as any)
		vi.mocked(adaptersModule.WindowAdapter).mockImplementation(() => ({
			showInformationMessage: vi.fn(),
			showErrorMessage: vi.fn(),
			showWarningMessage: vi.fn(),
			showTimedInformationMessage: vi.fn(),
		} as any))
		vi.mocked(adaptersModule.ContextAdapter).mockImplementation(() => ({
			subscriptions: [],
			extensionPath: '/test/extension/path',
		} as any))
		vi.mocked(adaptersModule.PathAdapter).mockImplementation(() => ({
			join: vi.fn(),
			relative: vi.fn(),
			basename: vi.fn(),
			dirname: vi.fn(),
			parse: vi.fn(),
		} as any))
		vi.mocked(adaptersModule.FileSystemAdapter).mockImplementation(() => ({
			stat: vi.fn(),
			readdir: vi.fn(),
			readFile: vi.fn(),
			writeFile: vi.fn(),
		} as any))
		vi.mocked(adaptersModule.QuickPickAdapter).mockImplementation(() => ({
			showQuickPickSingle: vi.fn(),
		} as any))
		vi.mocked(adaptersModule.CommonUtilsAdapter).mockImplementation(() => ({
			delay: vi.fn(),
			errMsg: vi.fn(),
		} as any))
		vi.mocked(adaptersModule.UriAdapter).mockImplementation(() => ({
			file: vi.fn(),
			create: vi.fn(),
			joinPath: vi.fn(),
			parse: vi.fn(),
			dirname: vi.fn(),
		} as any))

		vi.mocked(coreModule.IconActionsService).mockImplementation(() => {
			const mock = {
				showAvailableIconsQuickPick: vi.fn(),
				assignIconToResource: vi.fn(),
				revertIconAssignment: vi.fn(),
				showUserIconAssignments: vi.fn(),
				toggleExplorerArrows: vi.fn(),
				refreshIconTheme: vi.fn(),
			}

			return mock as any
		})
		vi.mocked(coreModule.IconThemeGeneratorService).mockImplementation(() => {
			const mock = {
				generateIconThemeManifest: vi.fn(),
				writeIconThemeFile: vi.fn(),
			}

			return mock as any
		})
		vi.mocked(coreModule.ConfigurationService).mockImplementation(() => {
			const mock = {
				getUserIconsDirectory: vi.fn(),
				getCustomMappings: vi.fn(),
				getHideArrowsSetting: vi.fn(),
				updateCustomMappings: vi.fn(),
				updateHideArrowsSetting: vi.fn(),
			}

			return mock as any
		})
		vi.mocked(coreModule.IconDiscoveryService).mockImplementation(() => {
			const mock = {
				getIconOptionsFromDirectory: vi.fn(),
				getBuiltInIconDirectories: vi.fn(),
			}

			return mock as any
		})
		vi.mocked(coreModule.IconPickerService).mockImplementation(() => {
			const mock = {
				showAvailableIconsQuickPick: vi.fn(),
			}

			return mock as any
		})
	})

	describe('Extension Import', () => {
		it('should be able to import extension', async () => {
			// Using static import instead of dynamic import

			expect(extensionModule).toBeDefined()
			expect(extensionModule.activate).toBeDefined()
			expect(extensionModule.deactivate).toBeDefined()
		})
	})

	describe('activate', () => {
		it('should register commands', async () => {
			// console.log('Before activate call')

			const { activate } = extensionModule

			await activate(mockContext)
			// console.log('After activate call')

			const mockCommandsAdapter = vi.mocked(adaptersModule.CommandsAdapter).mock.results[0].value

			// console.log('Mock calls:', mockCommandsAdapter.registerCommand.mock.calls.length)
			expect(mockCommandsAdapter.registerCommand).toHaveBeenCalled()
		})

		it('should handle activation errors gracefully', async () => {
			// Mock CommandsAdapter to throw an error
			vi.mocked(adaptersModule.CommandsAdapter).mockImplementation(() => {
				throw new Error('Test error')
			})

			const { activate } = extensionModule

			await expect(activate(mockContext)).resolves.toBeUndefined()
		})
	})

	describe('deactivate', () => {
		it('should be defined', async () => {
			const { deactivate } = extensionModule

			expect(deactivate).toBeDefined()
		})

		it('should not throw when called', async () => {
			const { deactivate } = extensionModule

			expect(() => deactivate()).not.toThrow()
		})
	})

	describe('command handlers', () => {
		it('should register all required command handlers', async () => {
			const { activate } = extensionModule

			await activate(mockContext)

			const mockCommandsAdapter = vi.mocked(adaptersModule.CommandsAdapter).mock.results[0].value

			// console.log('Command handlers count:', mockCommandsAdapter.registerCommand.mock.calls.length)
			// console.log('Mock calls:', mockCommandsAdapter.registerCommand.mock.calls.length)

			const expectedCommands = [
				'dynamicons.activateIconTheme',
				'dynamicons.assignIcon',
				'dynamicons.revertIcon',
				'dynamicons.toggleExplorerArrows',
				'dynamicons.showUserFileIconAssignments',
				'dynamicons.showUserFolderIconAssignments',
				'dynamicons.refreshIconTheme',
			]

			// Verify that registerCommand was called for each expected command
			expectedCommands.forEach((commandName) => {
				expect(mockCommandsAdapter.registerCommand).toHaveBeenCalledWith(
					commandName,
					expect.any(Function),
				)
			})
		})
	})
})
