import { vi, beforeEach } from 'vitest'
import { Buffer } from 'node:buffer'
import { env } from 'node:process'

// Keep test output quiet by default; enable via ENABLE_TEST_CONSOLE=true
const ENABLE_CONSOLE_OUTPUT = env.ENABLE_TEST_CONSOLE === 'true'

if (!ENABLE_CONSOLE_OUTPUT) {
	console.log = vi.fn()
	console.info = vi.fn()
	console.warn = vi.fn()
	console.error = vi.fn()
}

// Clean up between tests
beforeEach(() => {
	vi.clearAllMocks()
})

// ============================================================================
// MOCK TYPES (from mock-types.ts)
// ============================================================================

export interface MockUri {
	scheme: string
	authority: string
	path: string
	query: string
	fragment: string
	fsPath: string
	with: (change: { scheme?: string, authority?: string, path?: string, query?: string, fragment?: string }) => MockUri
	toString: () => string
}

export interface MockThemeIcon {
	id: string
	theme?: string
	color?: { readonly id: string }
}

export interface MockTreeItem {
	label: string
	resourceUri?: MockUri
	description?: string | boolean
	tooltip?: string
	contextValue?: string
	iconPath?: MockThemeIcon
	collapsibleState: number | undefined
}

export interface MockDisposable {
	dispose: () => void
}

export interface MockEventEmitter<T> {
	event: any
	fire: (data?: T) => void
	dispose: () => void
}

// Factory functions for creating mocks
export function createMockUri(path: string): MockUri {
	return {
		scheme: 'file',
		authority: '',
		path,
		query: '',
		fragment: '',
		fsPath: path,
		with: change => createMockUri(change.path || path),
		toString: () => `file://${path}`,
	}
}

export function createMockThemeIcon(id: string): MockThemeIcon {
	return {
		id,
		theme: undefined,
		color: undefined,
	}
}

export function createMockTreeItem(label: string): MockTreeItem {
	return {
		label,
		resourceUri: undefined,
		description: undefined,
		tooltip: undefined,
		contextValue: undefined,
		iconPath: undefined,
		collapsibleState: undefined,
	}
}

export function createMockDisposable(): MockDisposable {
	return {
		dispose: () => {},
	}
}

export function createMockEventEmitter<T>(): MockEventEmitter<T> {
	return {
		event: () => createMockDisposable(),
		fire: () => {},
		dispose: () => {},
	}
}

// ============================================================================
// SHARED ADAPTER MOCKS (from shared-adapters.mock.ts)
// ============================================================================

// Mock TreeItemAdapter
export const TreeItemAdapter = {
	create: vi.fn(),
}

// Mock UriAdapter
export const UriAdapter = {
	file: vi.fn(),
}

// Mock ThemeIconAdapter
export const ThemeIconAdapter = {
	create: vi.fn(),
}

// Mock ThemeColorAdapter
export const ThemeColorAdapter = {
	create: vi.fn(),
}

// Mock RelativePatternAdapter
export const RelativePatternAdapter = {
	create: vi.fn(),
}

// Mock TreeItemCollapsibleState
export const TreeItemCollapsibleState = {
	None: 0,
	Collapsed: 1,
	Expanded: 2,
}

// Mock TreeItem
export const TreeItem = vi.fn()

// Mock Uri
export const Uri = {
	file: vi.fn(),
}

// Mock ThemeIcon
export const ThemeIcon = vi.fn()

// Mock ThemeColor
export const ThemeColor = vi.fn()

// Mock RelativePattern
export const RelativePattern = vi.fn()

// ============================================================================
// MOCK INTERFACES (from mock-interfaces.ts)
// ============================================================================

export function createMockFileSystem(): any {
	return {
		createDirectory: vi.fn().mockResolvedValue(undefined),
		deleteFile: vi.fn().mockResolvedValue(undefined),
		deleteDirectory: vi.fn().mockResolvedValue(undefined),
		fileExists: vi.fn().mockResolvedValue(true),
		readFile: vi.fn().mockResolvedValue('mock file content'),
		writeFile: vi.fn().mockResolvedValue(undefined),
		readDirectory: vi.fn().mockResolvedValue([
			{ name: 'test-file.md', type: 1 },
			{ name: 'test-folder', type: 2 },
		]),
		stat: vi.fn().mockResolvedValue({
			type: 1,
			ctime: Date.now(),
			mtime: Date.now(),
			size: 1024,
		}),
		copy: vi.fn().mockResolvedValue(undefined),
		rename: vi.fn().mockResolvedValue(undefined),
	}
}

export function createMockWorkspaceUtils(): any {
	return {
		createFileWatcher: vi.fn().mockReturnValue({
			onDidCreate: vi.fn().mockReturnValue({ dispose: vi.fn() }),
			onDidChange: vi.fn().mockReturnValue({ dispose: vi.fn() }),
			onDidDelete: vi.fn().mockReturnValue({ dispose: vi.fn() }),
			dispose: vi.fn(),
		}),
		getWorkspaceFolders: vi.fn().mockReturnValue([{
			uri: { fsPath: '/workspace' },
			name: 'test-workspace',
			index: 0,
		}]),
		findFiles: vi.fn().mockResolvedValue([]),
		openTextDocument: vi.fn().mockResolvedValue({}),
		showTextDocument: vi.fn().mockResolvedValue({}),
	}
}

export function createMockFrontmatterUtils(): any {
	return {
		getFrontmatter_extractContent: vi.fn().mockReturnValue('---\nLabel: Test\n---\nContent'),
		getFrontmatter_parseContent: vi.fn().mockReturnValue({ Label: 'Test' }),
		addFrontmatterToFile: vi.fn().mockResolvedValue(undefined),
		updateFrontmatterInFile: vi.fn().mockResolvedValue(undefined),
	}
}

export function createMockProviderManager(): any {
	return {
		initializeProviders: vi.fn().mockResolvedValue(undefined),
		getProviderInstance: vi.fn().mockReturnValue(null),
		getProviderForNote: vi.fn().mockResolvedValue(null),
		refreshProviders: vi.fn(),
		revealNotesHubItem: vi.fn().mockResolvedValue(undefined),
		dispose: vi.fn(),
	}
}

export function createMockExtensionContext(): any {
	const subscriptions: MockDisposable[] = []
    
	return {
		subscriptions,
		globalState: {
			get: vi.fn().mockReturnValue(undefined),
			update: vi.fn().mockResolvedValue(undefined),
		},
		workspaceState: {
			get: vi.fn().mockReturnValue(undefined),
			update: vi.fn().mockResolvedValue(undefined),
		},
	}
}

// Mock common utility functions
export const mockCommonUtils = {
	errMsg: vi.fn(),
	infoMsg: vi.fn(),
	warnMsg: vi.fn(),
}

export const mockWindow = {
	showInformationMessage: vi.fn().mockResolvedValue(undefined),
	showWarningMessage: vi.fn().mockResolvedValue(undefined),
	showErrorMessage: vi.fn().mockResolvedValue(undefined),
	showInputBox: vi.fn().mockResolvedValue('test-input'),
	showTextDocument: vi.fn().mockResolvedValue({}),
	withProgress: vi.fn().mockImplementation((options, task) => task()),
	registerTreeDataProvider: vi.fn().mockReturnValue({ dispose: vi.fn() }),
}

export const mockCommands = {
	registerCommand: vi.fn().mockReturnValue({ dispose: vi.fn() }),
	executeCommand: vi.fn().mockResolvedValue(undefined),
}

export const mockEnv = {
	clipboard: {
		readText: vi.fn().mockResolvedValue(''),
		writeText: vi.fn().mockResolvedValue(undefined),
	},
}

// ============================================================================
// EXISTING MOCK IMPLEMENTATIONS
// ============================================================================

// Create mock implementations for all local interfaces
export function createMockWindow() {
	return {
		showInformationMessage: vi.fn().mockResolvedValue('OK'),
		showErrorMessage: vi.fn().mockResolvedValue(undefined),
		showWarningMessage: vi.fn().mockResolvedValue('Confirm'),
		showInputBox: vi.fn().mockResolvedValue('test-input'),
		showTextDocument: vi.fn().mockResolvedValue(undefined),
		withProgress: vi.fn().mockImplementation((_options, task) => task({}, {})),
		registerTreeDataProvider: vi.fn().mockReturnValue({ dispose: vi.fn() }),
	}
}

export function createMockWorkspace() {
	return {
		onDidChangeConfiguration: vi.fn().mockReturnValue({ dispose: vi.fn() }),
		getConfiguration: vi.fn().mockReturnValue({
			get: vi.fn().mockReturnValue(undefined),
			update: vi.fn().mockResolvedValue(undefined),
		}),
		openTextDocument: vi.fn().mockResolvedValue({ uri: { fsPath: '/test/path' } }),
		workspaceFolders: [],
		createFileSystemWatcher: vi.fn().mockReturnValue({
			onDidChange: vi.fn().mockReturnValue({ dispose: vi.fn() }),
			onDidCreate: vi.fn().mockReturnValue({ dispose: vi.fn() }),
			onDidDelete: vi.fn().mockReturnValue({ dispose: vi.fn() }),
			dispose: vi.fn(),
		}),
		fs: {
			readFile: vi.fn().mockResolvedValue(Buffer.from('test content')),
			writeFile: vi.fn().mockResolvedValue(undefined),
			stat: vi.fn().mockResolvedValue({ type: 1, isFile: () => true, isDirectory: () => false }),
			readDirectory: vi.fn().mockResolvedValue([['test.md', 1]]),
			createDirectory: vi.fn().mockResolvedValue(undefined),
			delete: vi.fn().mockResolvedValue(undefined),
			copy: vi.fn().mockResolvedValue(undefined),
			rename: vi.fn().mockResolvedValue(undefined),
		},
	}
}

export function createMockCommands() {
	return {
		executeCommand: vi.fn().mockResolvedValue(undefined),
		registerCommand: vi.fn().mockReturnValue({ dispose: vi.fn() }),
	}
}

export function createMockCommonUtils() {
	return {
		errMsg: vi.fn(),
		infoMsg: vi.fn(),
		warnMsg: vi.fn(),
	}
}

export function createMockPathUtils() {
	return {
		sanitizePath: vi.fn().mockImplementation((path: string) => path.replace(/[\\]/g, '/')),
		join: vi.fn().mockImplementation((...paths: string[]) => paths.join('/')),
		dirname: vi.fn().mockImplementation((path: string) => path.split('/').slice(0, -1).join('/') || '.'),
		basename: vi.fn().mockImplementation((path: string, ext?: string) => {
			const base = path.split('/').pop() || path

			if (ext && base.endsWith(ext)) {
				return base.slice(0, -ext.length)
			}
			return base
		}),
		parse: vi.fn().mockImplementation((path: string) => ({
			root: '',
			dir: path.split('/').slice(0, -1).join('/') || '.',
			base: path.split('/').pop() || path,
			ext: path.includes('.') ? `.${path.split('.').pop()}` : '',
			name: path.split('/').pop()?.split('.')[0] ?? path,
		})),
		extname: vi.fn().mockImplementation((path: string) => path.includes('.') ? `.${path.split('.').pop()}` : ''),
	}
}

export function createMockUriFactory() {
	return {
		file: vi.fn().mockReturnValue({
			fsPath: '/mock/path',
			scheme: 'file',
			authority: '',
			path: '/mock/path',
			query: '',
			fragment: '',
			toString: () => 'file:///mock/path',
			with: vi.fn().mockReturnValue({
				fsPath: '/mock/path',
				scheme: 'file',
				authority: '',
				path: '/mock/path',
				query: '',
				fragment: '',
				toString: () => 'file:///mock/path',
				with: vi.fn(),
			}),
		}),
		parse: vi.fn().mockReturnValue({
			fsPath: '/mock/path',
			scheme: 'file',
			authority: '',
			path: '/mock/path',
			query: '',
			fragment: '',
			toString: () => 'file:///mock/path',
			with: vi.fn().mockReturnValue({
				fsPath: '/mock/path',
				scheme: 'file',
				authority: '',
				path: '/mock/path',
				query: '',
				fragment: '',
				toString: () => 'file:///mock/path',
				with: vi.fn(),
			}),
		}),
	}
}

export function createMockFileType() {
	return {
		File: 1,
		Directory: 2,
		SymbolicLink: 64,
	}
}

export function createMockStorageService() {
	return {
		get: vi.fn().mockReturnValue(undefined),
		update: vi.fn().mockResolvedValue(undefined),
		delete: vi.fn().mockResolvedValue(undefined),
	}
}

export function createMockEnv() {
	return {
		machineId: 'test-machine',
		sessionId: 'test-session',
		language: 'en',
		appName: 'test-app',
		appRoot: '/test/app',
		appHost: 'test-host',
		uiKind: 1,
		clipboard: {
			readText: vi.fn().mockResolvedValue('test-clipboard'),
			writeText: vi.fn().mockResolvedValue(undefined),
		},
	}
}

// Adapter mocks
export function createMockTreeItemAdapter() {
	return {
		create: vi.fn().mockReturnValue({
			label: 'Mock TreeItem',
			collapsibleState: 0,
			resourceUri: undefined,
			iconPath: undefined,
			contextValue: undefined,
			tooltip: undefined,
			description: undefined,
		}),
	}
}

export function createMockThemeIconAdapter() {
	return {
		create: vi.fn().mockReturnValue({ id: 'mock-icon' }),
	}
}

export function createMockTreeItemCollapsibleStateAdapter() {
	return {
		None: 0,
		Collapsed: 1,
		Expanded: 2,
	}
}

// Helper function to create mock NotesHubItem
export function createMockNotesHubItem(overrides: any = {}) {
	return {
		fileName: 'test.md',
		filePath: '/test/test.md',
		isDirectory: false,
		label: 'test.md',
		resourceUri: { fsPath: '/test/test.md' },
		contextValue: 'notesHubFileItem',
		iconPath: { id: 'file' },
		tooltip: '/test/test.md',
		description: undefined,
		collapsibleState: 0,
		frontmatter: undefined,
		toVsCode: vi.fn().mockReturnValue({
			label: 'test.md',
			collapsibleState: 0,
		}),
		...overrides,
	}
}
