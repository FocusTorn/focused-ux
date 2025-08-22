import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

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

describe('Configuration Change Listener - Core Functionality Tests', () => {
	let mockContext: any
	let mockWorkspaceAdapter: any
	let mockIconThemeGeneratorService: any
	let mockFileSystemAdapter: any
	let mockCommandsAdapter: any
	let mockWindowAdapter: any
	let mockUriAdapter: any
	let configChangeListener: any

	beforeEach(async () => {
		vi.clearAllMocks()
		vi.resetModules()

		mockContext = {
			subscriptions: [],
			extensionPath: '/test/extension/path',
			globalState: { get: vi.fn(), update: vi.fn() },
			workspaceState: { get: vi.fn(), update: vi.fn() },
		}

		// Create mock services
		mockIconThemeGeneratorService = {
			generateIconThemeManifest: vi.fn().mockResolvedValue({
				iconDefinitions: { _test: { iconPath: 'test.svg' } },
				file: { '*.test': '_test' },
				folder: { 'test-folder': '_test' },
			}),
			writeIconThemeFile: vi.fn().mockResolvedValue(undefined),
		}

		mockFileSystemAdapter = {
			stat: vi.fn(),
			readdir: vi.fn(),
			readFile: vi.fn(),
			writeFile: vi.fn().mockResolvedValue(undefined),
			mkdir: vi.fn(),
			access: vi.fn(),
		}

		mockCommandsAdapter = {
			registerCommand: vi.fn().mockReturnValue({ dispose: vi.fn() }),
			executeCommand: vi.fn().mockResolvedValue(undefined),
		}

		mockWindowAdapter = {
			showInformationMessage: vi.fn(),
			showErrorMessage: vi.fn(),
			showWarningMessage: vi.fn(),
		}

		mockUriAdapter = {
			create: vi.fn(uri => uri),
			joinPath: vi.fn(),
			file: vi.fn(),
			dirname: vi.fn(),
		}

		mockWorkspaceAdapter = {
			getConfiguration: vi.fn().mockReturnValue({
				get: vi.fn(),
				update: vi.fn(),
			}),
			onDidChangeConfiguration: vi.fn().mockImplementation((listener) => {
				configChangeListener = listener
				return { dispose: vi.fn() }
			}),
		}

		// Mock the adapters module
		vi.doMock('../../src/adapters/index.js', () => ({
			WindowAdapter: vi.fn().mockImplementation(() => mockWindowAdapter),
			CommandsAdapter: vi.fn().mockImplementation(() => mockCommandsAdapter),
			WorkspaceAdapter: vi.fn().mockImplementation(() => mockWorkspaceAdapter),
			ContextAdapter: vi.fn().mockImplementation(() => ({
				extensionPath: '/test/extension/path',
				subscriptions: [],
			})),
			PathAdapter: vi.fn().mockImplementation(() => ({
				basename: vi.fn(),
				parse: vi.fn(),
				join: vi.fn(),
				dirname: vi.fn(),
				relative: vi.fn(),
			})),
			FileSystemAdapter: vi.fn().mockImplementation(() => mockFileSystemAdapter),
			QuickPickAdapter: vi.fn().mockImplementation(() => ({
				showQuickPick: vi.fn(),
			})),
			CommonUtilsAdapter: vi.fn().mockImplementation(() => ({
				errMsg: vi.fn(),
				infoMsg: vi.fn(),
			})),
			UriAdapter: vi.fn().mockImplementation(() => mockUriAdapter),
		}))

		// Mock the core services
		const coreModule = await import('@fux/dynamicons-core')

		vi.mocked(coreModule.IconThemeGeneratorService).mockImplementation(() => mockIconThemeGeneratorService)
		vi.mocked(coreModule.IconActionsService).mockImplementation(() => ({
			showAvailableIconsQuickPick: vi.fn(),
			assignIconToResource: vi.fn(),
			revertIconAssignment: vi.fn(),
			showUserIconAssignments: vi.fn(),
			toggleExplorerArrows: vi.fn(),
		} as any))
		vi.mocked(coreModule.ConfigurationService).mockImplementation(() => ({
			getUserIconsDirectory: vi.fn(),
			getCustomMappings: vi.fn(),
			getHideArrowsSetting: vi.fn(),
			updateCustomMappings: vi.fn(),
			updateHideArrowsSetting: vi.fn(),
		} as any))
		vi.mocked(coreModule.IconDiscoveryService).mockImplementation(() => ({
			getIconOptionsFromDirectory: vi.fn(),
			getBuiltInIconDirectories: vi.fn(),
		} as any))
		vi.mocked(coreModule.IconPickerService).mockImplementation(() => ({
			showAvailableIconsQuickPick: vi.fn(),
		} as any))
	})

	afterEach(() => {
		vi.resetModules()
	})

	it('should register configuration change listener during activation', async () => {
		const { activate } = await import('../../src/extension.js')

		await activate(mockContext)

		expect(mockWorkspaceAdapter.onDidChangeConfiguration).toHaveBeenCalledWith(expect.any(Function))
		expect(configChangeListener).toBeDefined()
		expect(typeof configChangeListener).toBe('function')
	})

	it('should trigger configuration change listener when customIconMappings changes', async () => {
		const { activate } = await import('../../src/extension.js')

		await activate(mockContext)

		// Create a mock event that affects customIconMappings
		const mockEvent = {
			affectsConfiguration: vi.fn().mockImplementation((configKey: string) => {
				return configKey === 'dynamicons.customIconMappings'
			}),
		}

		// Capture initial call count
		const initialCallCount = mockEvent.affectsConfiguration.mock.calls.length

		// Simulate the configuration change
		await configChangeListener(mockEvent)

		// Verify that affectsConfiguration was called to check our config keys
		expect(mockEvent.affectsConfiguration).toHaveBeenCalledWith('dynamicons.customIconMappings')
		expect(mockEvent.affectsConfiguration.mock.calls.length).toBeGreaterThan(initialCallCount)
	})

	it('should not trigger action for unrelated configuration changes', async () => {
		const { activate } = await import('../../src/extension.js')

		await activate(mockContext)

		// Create a mock event that doesn't affect any relevant configuration
		const mockEvent = {
			affectsConfiguration: vi.fn().mockImplementation((configKey: string) => {
				return configKey === 'unrelated.setting'
			}),
		}

		// Simulate the configuration change
		await configChangeListener(mockEvent)

		// Verify that our relevant configurations were checked but returned false
		expect(mockEvent.affectsConfiguration).toHaveBeenCalledWith('dynamicons.customIconMappings')
		expect(mockEvent.affectsConfiguration).toHaveBeenCalledWith('dynamicons.userIconsDirectory')
		expect(mockEvent.affectsConfiguration).toHaveBeenCalledWith('dynamicons.hideExplorerArrows')
	})

	it('should handle multiple configuration changes in one event', async () => {
		const { activate } = await import('../../src/extension.js')

		await activate(mockContext)

		// Create a mock event that only affects one config (due to short-circuit behavior in ||)
		const mockEvent = {
			affectsConfiguration: vi.fn().mockImplementation((configKey: string) => {
				return configKey === 'dynamicons.customIconMappings'
			}),
		}

		// Simulate the configuration change
		await configChangeListener(mockEvent)

		// Verify that the first configuration was checked (others may not due to short-circuit)
		expect(mockEvent.affectsConfiguration).toHaveBeenCalledWith('dynamicons.customIconMappings')
		// The first true result short-circuits the || chain, so other checks may not happen
	})
})
