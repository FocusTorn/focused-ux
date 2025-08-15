import { vi, beforeEach } from 'vitest'
import process from 'node:process'
import { Buffer } from 'node:buffer'
import { mockly, mocklyService } from '@fux/mockly'
import type { AwilixContainer } from 'awilix'
import { createContainer, InjectionMode, asValue } from 'awilix'

// Mock VSCode at the module level to prevent import issues
vi.mock('vscode', () => ({
	Uri: {
		file: vi.fn().mockReturnValue({ fsPath: '/mock/path', path: '/mock/path' }),
		joinPath: vi.fn().mockReturnValue({ fsPath: '/mock/path', path: '/mock/path' }),
		create: vi.fn().mockReturnValue({ fsPath: '/mock/path', path: '/mock/path' }),
		parse: vi.fn().mockReturnValue({ fsPath: '/mock/path', path: '/mock/path' }),
	},
	TreeItem: vi.fn().mockImplementation(() => ({
		label: 'Mock TreeItem',
		collapsibleState: 0,
		resourceUri: undefined,
		iconPath: undefined,
		contextValue: undefined,
		tooltip: undefined,
		description: undefined,
	})),
	ThemeIcon: vi.fn().mockImplementation(() => ({ id: 'mock-icon' })),
	ThemeColor: vi.fn().mockImplementation(() => ({ id: 'mock-color' })),
	TreeItemCollapsibleState: {
		None: 0,
		Collapsed: 1,
		Expanded: 2,
	},
	EventEmitter: vi.fn().mockImplementation(() => ({
		event: { on: vi.fn(), fire: vi.fn() },
		fire: vi.fn(),
		dispose: vi.fn(),
	})),
	RelativePattern: vi.fn().mockImplementation(() => ({})),
	Disposable: vi.fn().mockImplementation(() => ({ dispose: vi.fn() })),
	Position: vi.fn().mockImplementation(() => ({ line: 0, character: 0 })),
	Range: vi.fn().mockImplementation(() => ({ start: { line: 0, character: 0 }, end: { line: 0, character: 0 } })),
	window: {
		showInputBox: vi.fn().mockResolvedValue('test-input'),
		showInformationMessage: vi.fn().mockResolvedValue('Overwrite'),
		showWarningMessage: vi.fn().mockResolvedValue('Confirm'),
		showErrorMessage: vi.fn().mockResolvedValue(undefined),
		showTextDocument: vi.fn().mockResolvedValue(undefined),
		activeTextEditor: undefined,
	},
	workspace: {
		fs: {
			readFile: vi.fn().mockResolvedValue(Buffer.from('test content')),
			writeFile: vi.fn().mockResolvedValue(undefined),
			rename: vi.fn().mockResolvedValue(undefined),
			copy: vi.fn().mockResolvedValue(undefined),
			delete: vi.fn().mockResolvedValue(undefined),
			createDirectory: vi.fn().mockResolvedValue(undefined),
			readDirectory: vi.fn().mockResolvedValue([['test.md', 1]]),
			stat: vi.fn().mockResolvedValue({ type: 1, isFile: () => true, isDirectory: () => false }),
			access: vi.fn().mockResolvedValue(undefined),
		},
		openTextDocument: vi.fn().mockResolvedValue({ uri: { fsPath: '/test/path' } }),
		workspaceFolders: [],
		onDidChangeConfiguration: vi.fn().mockReturnValue({ dispose: vi.fn() }),
		getConfiguration: vi.fn().mockReturnValue({ get: vi.fn().mockReturnValue(undefined) }),
	},
	commands: {
		executeCommand: vi.fn().mockResolvedValue(undefined),
		registerCommand: vi.fn().mockReturnValue({ dispose: vi.fn() }),
	},
	env: {
		clipboard: {
			readText: vi.fn().mockResolvedValue('test-clipboard'),
			writeText: vi.fn().mockResolvedValue(undefined),
		},
	},
	extensions: {
		all: [],
		getExtension: vi.fn().mockReturnValue(undefined),
	},
	ExtensionContext: vi.fn().mockImplementation(() => ({
		subscriptions: [],
		workspaceState: {
			get: vi.fn(),
			update: vi.fn(),
		},
		globalState: {
			get: vi.fn(),
			update: vi.fn(),
		},
	})),
}))

// Mock the entire @fux/shared module to prevent any shared library code from loading
vi.mock('@fux/shared', () => ({
	// Mock all the adapters that might be imported
	FileSystemAdapter: vi.fn().mockImplementation(() => ({
		readFile: vi.fn().mockResolvedValue(Buffer.from('test content')),
		writeFile: vi.fn().mockResolvedValue(undefined),
		rename: vi.fn().mockResolvedValue(undefined),
		copy: vi.fn().mockResolvedValue(undefined),
		delete: vi.fn().mockResolvedValue(undefined),
		createDirectory: vi.fn().mockResolvedValue(undefined),
		readDirectory: vi.fn().mockResolvedValue([['test.md', 1]]),
		stat: vi.fn().mockResolvedValue({ type: 1, isFile: () => true, isDirectory: () => false }),
		access: vi.fn().mockResolvedValue(undefined),
	})),
	WindowAdapter: vi.fn().mockImplementation(() => ({
		showInputBox: vi.fn().mockResolvedValue('test-input'),
		showInformationMessage: vi.fn().mockResolvedValue('Overwrite'),
		showWarningMessage: vi.fn().mockResolvedValue('Confirm'),
		showErrorMessage: vi.fn().mockResolvedValue(undefined),
		showTextDocument: vi.fn().mockResolvedValue(undefined),
		activeTextEditor: undefined,
	})),
	WorkspaceAdapter: vi.fn().mockImplementation(() => ({
		fs: {
			readFile: vi.fn().mockResolvedValue(Buffer.from('test content')),
			writeFile: vi.fn().mockResolvedValue(undefined),
			rename: vi.fn().mockResolvedValue(undefined),
			copy: vi.fn().mockResolvedValue(undefined),
			delete: vi.fn().mockResolvedValue(undefined),
			createDirectory: vi.fn().mockResolvedValue(undefined),
			readDirectory: vi.fn().mockResolvedValue([['test.md', 1]]),
			stat: vi.fn().mockResolvedValue({ type: 1, isFile: () => true, isDirectory: () => false }),
			access: vi.fn().mockResolvedValue(undefined),
		},
		openTextDocument: vi.fn().mockResolvedValue({ uri: { fsPath: '/test/path' } }),
		workspaceFolders: [],
		onDidChangeConfiguration: vi.fn().mockReturnValue({ dispose: vi.fn() }),
		getConfiguration: vi.fn().mockReturnValue({ get: vi.fn().mockReturnValue(undefined) }),
	})),
	CommandsAdapter: vi.fn().mockImplementation(() => ({
		executeCommand: vi.fn().mockResolvedValue(undefined),
		registerCommand: vi.fn().mockReturnValue({ dispose: vi.fn() }),
	})),
	PathUtilsAdapter: vi.fn().mockImplementation(() => ({
		sanitizePath: vi.fn().mockImplementation(path => path),
		basename: vi.fn().mockImplementation(path => path.split('/').pop() || path),
		dirname: vi.fn().mockImplementation(path => path.split('/').slice(0, -1).join('/') || '.'),
		extname: vi.fn().mockImplementation(path => path.includes('.') ? `.${path.split('.').pop()}` : ''),
		join: vi.fn().mockImplementation((...paths) => paths.join('/')),
		normalize: vi.fn().mockImplementation(path => path.replace(/\\/g, '/')),
		parse: vi.fn().mockImplementation(path => ({
			root: '',
			dir: path.split('/').slice(0, -1).join('/') || '.',
			base: path.split('/').pop() || path,
			ext: path.includes('.') ? `.${path.split('.').pop()}` : '',
			name: path.split('/').pop()?.split('.')[0] ?? path,
		})),
	})),
	ProcessAdapter: vi.fn().mockImplementation(() => ({
		workspaceRoot: vi.fn().mockReturnValue(process.cwd()),
	})),
	EnvAdapter: vi.fn().mockImplementation(() => ({
		clipboard: {
			readText: vi.fn().mockResolvedValue('test-uri'),
			writeText: vi.fn().mockResolvedValue(undefined),
		},
	})),
	ConfigurationService: vi.fn().mockImplementation(() => ({
		get: vi.fn().mockReturnValue({ get: vi.fn().mockReturnValue(undefined) }),
	})),
	CommonUtilsAdapter: vi.fn().mockImplementation(() => ({
		showTimedInformationMessage: vi.fn().mockResolvedValue(undefined),
		errMsg: vi.fn().mockImplementation((msg, error) => console.error(msg, error)),
	})),
	StorageService: vi.fn().mockImplementation(() => ({
		update: vi.fn().mockResolvedValue(undefined),
		get: vi.fn().mockResolvedValue(undefined),
	})),
	// Mock the specific adapters used by NotesHubItem
	TreeItemAdapter: vi.fn().mockImplementation(() => ({
		create: vi.fn().mockReturnValue({
			label: 'Mock TreeItem',
			collapsibleState: 0,
			resourceUri: undefined,
			iconPath: undefined,
			contextValue: undefined,
			tooltip: undefined,
			description: undefined,
		}),
	})),
	ThemeIconAdapter: vi.fn().mockImplementation(() => ({
		create: vi.fn().mockReturnValue({ id: 'mock-icon' }),
	})),
	ThemeColorAdapter: vi.fn().mockImplementation(() => ({
		create: vi.fn().mockReturnValue({ id: 'mock-color' }),
	})),
	UriAdapter: vi.fn().mockImplementation(() => ({
		file: vi.fn().mockReturnValue({
			fsPath: '/mock/path',
			path: '/mock/path',
			uri: { fsPath: '/mock/path', path: '/mock/path' },
		}),
		create: vi.fn().mockReturnValue({
			fsPath: '/mock/path',
			path: '/mock/path',
			uri: { fsPath: '/mock/path', path: '/mock/path' },
		}),
		joinPath: vi.fn().mockReturnValue({
			fsPath: '/mock/path',
			path: '/mock/path',
			uri: { fsPath: '/mock/path', path: '/mock/path' },
		}),
	})),
	TreeItemCollapsibleStateAdapter: vi.fn().mockImplementation(() => ({
		None: 0,
		Collapsed: 1,
		Expanded: 2,
	})),
	// Mock other services that might be imported
	FrontmatterUtilsService: vi.fn().mockImplementation(() => ({
		getFrontmatter: vi.fn().mockResolvedValue({}),
	})),
	WorkspaceUtilsService: vi.fn().mockImplementation(() => ({
		getWorkspaceFolder: vi.fn().mockReturnValue({ uri: { fsPath: '/test/workspace' } }),
	})),
}))

// Keep test output quiet by default; enable via ENABLE_TEST_CONSOLE=true
const ENABLE_CONSOLE_OUTPUT = process.env.ENABLE_TEST_CONSOLE === 'true'

if (!ENABLE_CONSOLE_OUTPUT) {
	console.log = vi.fn()
	console.info = vi.fn()
	console.warn = vi.fn()
	console.error = vi.fn()
}

// Reset Mockly state between tests for isolation
beforeEach(() => {
	mocklyService.reset()
})

// Create a test container with Mockly shims and mocked shared adapters
export function createTestContainer(): AwilixContainer {
	const container = createContainer({
		injectionMode: InjectionMode.PROXY,
	})
	
	// Register Mockly services directly for testing
	container.register({
		iFileSystem: asValue(mockly.workspace.fs),
		iWindow: asValue({
			...mockly.window,
			showInputBox: vi.fn().mockResolvedValue('test-input'),
			showInformationMessage: vi.fn().mockResolvedValue('Overwrite'),
			showWarningMessage: vi.fn().mockResolvedValue('Confirm'),
			showErrorMessage: vi.fn().mockResolvedValue(undefined),
			showTextDocument: vi.fn().mockResolvedValue(undefined),
		}),
		iWorkspace: asValue({
			...mockly.workspace,
			fs: {
				...mockly.workspace.fs,
				readFile: vi.fn().mockResolvedValue(Buffer.from('test content')),
				writeFile: vi.fn().mockResolvedValue(undefined),
				rename: vi.fn().mockResolvedValue(undefined),
				copy: vi.fn().mockResolvedValue(undefined),
				delete: vi.fn().mockResolvedValue(undefined),
				createDirectory: vi.fn().mockResolvedValue(undefined),
				readDirectory: vi.fn().mockResolvedValue([['test.md', 1]]),
				stat: vi.fn().mockResolvedValue({ type: 1, isFile: () => true, isDirectory: () => false }),
				access: vi.fn().mockResolvedValue(undefined),
			},
			openTextDocument: vi.fn().mockResolvedValue({ uri: { fsPath: '/test/path' } }),
		}),
		iCommands: asValue({
			...mockly.commands,
			executeCommand: vi.fn().mockResolvedValue(undefined),
		}),
		iPathUtils: asValue({
			...mockly.node.path,
			sanitizePath: vi.fn().mockImplementation(path => path),
		}),
		iProcess: asValue({ workspaceRoot: () => process.cwd() }),
		iEnv: asValue({
			...mockly.env,
			clipboard: {
				readText: vi.fn().mockResolvedValue('test-uri'),
				writeText: vi.fn().mockResolvedValue(undefined),
			},
		}),
		iConfigurationService: asValue({ get: () => ({ get: () => undefined }) }),
		iCommonUtils: asValue({
			showTimedInformationMessage: async () => {},
			errMsg: vi.fn().mockImplementation((msg, error) => console.error(msg, error)),
		}),
		iFrontmatterUtils: asValue({
			getFrontmatter: vi.fn().mockResolvedValue({}),
		}),
		iFileType: asValue({
			Directory: 1,
			File: 2,
		}),
		iStorage: asValue({
			update: vi.fn().mockResolvedValue(undefined),
			get: vi.fn().mockResolvedValue(undefined),
		}),
		iExtensionContext: asValue({
			subscriptions: [],
			workspaceState: {
				get: vi.fn(),
				update: vi.fn(),
			},
		}),
		iWorkspaceUtils: asValue({
			getWorkspaceFolder: vi.fn().mockReturnValue({ uri: { fsPath: '/test/workspace' } }),
		}),
		iFspRename: asValue(vi.fn().mockResolvedValue(undefined)),
		// Mock shared adapters to work with mocked VSCode
		treeItemAdapter: asValue({
			create: vi.fn().mockReturnValue({
				label: 'Mock TreeItem',
				collapsibleState: 0,
				resourceUri: undefined,
				iconPath: undefined,
				contextValue: undefined,
				tooltip: undefined,
				description: undefined,
			}),
		}),
		themeIconAdapter: asValue({
			create: vi.fn().mockReturnValue({ id: 'mock-icon' }),
		}),
		themeColorAdapter: asValue({
			create: vi.fn().mockReturnValue({ id: 'mock-color' }),
		}),
		uriAdapter: asValue({
			file: vi.fn().mockReturnValue({
				fsPath: '/mock/path',
				path: '/mock/path',
				uri: { fsPath: '/mock/path', path: '/mock/path' },
			}),
			create: vi.fn().mockReturnValue({
				fsPath: '/mock/path',
				path: '/mock/path',
				uri: { fsPath: '/mock/path', path: '/mock/path' },
			}),
			joinPath: vi.fn().mockReturnValue({
				fsPath: '/mock/path',
				path: '/mock/path',
				uri: { fsPath: '/mock/path', path: '/mock/path' },
			}),
		}),
		treeItemCollapsibleStateAdapter: asValue({
			None: 0,
			Collapsed: 1,
			Expanded: 2,
		}),
		// Add missing services that tests might need
		iPathJoin: asValue(vi.fn().mockImplementation((...paths) => paths.join('/'))),
		iPathDirname: asValue(vi.fn().mockImplementation(path => path.split('/').slice(0, -1).join('/') ?? '.')),
		iPathBasename: asValue(vi.fn().mockImplementation(path => path.split('/').pop() ?? path)),
		iPathParse: asValue(vi.fn().mockImplementation(path => ({
			root: '',
			dir: path.split('/').slice(0, -1).join('/') ?? '.',
			base: path.split('/').pop() ?? path,
			ext: path.includes('.') ? `.${path.split('.').pop()}` : '',
			name: path.split('/').pop()?.split('.')[0] ?? path,
		}))),
		iPathExtname: asValue(vi.fn().mockImplementation(path => path.includes('.') ? `.${path.split('.').pop()}` : '')),
		iFspAccess: asValue(vi.fn().mockResolvedValue(undefined)),
		iOsHomedir: asValue(vi.fn().mockReturnValue('/home/user')),
		iPathNormalize: asValue(vi.fn().mockImplementation(path => path.replace(/\\/g, '/'))),
	})
	
	return container
}

// Helper function to create test NotesHubItem instances with proper dependencies
export function createTestNotesHubItem(
	fileName: string,
	filePath: string,
	isDirectory: boolean,
	parentUri?: any,
	frontmatter?: { [key: string]: string },
) {
	const container = createTestContainer()
	
	// Import NotesHubItem dynamically to avoid import issues
	const { NotesHubItem } = require('../../src/models/NotesHubItem.js')
	
	return new NotesHubItem(
		fileName,
		filePath,
		isDirectory,
		container.resolve('treeItemAdapter'),
		container.resolve('themeIconAdapter'),
		container.resolve('themeColorAdapter'),
		container.resolve('uriAdapter'),
		container.resolve('treeItemCollapsibleStateAdapter'),
		parentUri,
		frontmatter,
	)
}

// Helper function to create test service instances with proper dependencies
export function createTestService<T>(serviceClass: new (...args: any[]) => T, ...args: any[]): T {
	const container = createTestContainer()
	
	// Create a new instance with the provided arguments
	return new serviceClass(...args)
}
