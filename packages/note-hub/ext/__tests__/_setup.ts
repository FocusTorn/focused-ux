// Extension package test setup
import { vi } from 'vitest'

// ============================================================================
// MOCK VSCode (from mock-vscode.ts)
// ============================================================================

// Mock VSCode namespace
export const mockVSCode = {
	// Commands
	commands: {
		registerCommand: vi.fn().mockReturnValue({ dispose: vi.fn() }),
		executeCommand: vi.fn().mockResolvedValue(undefined),
	},

	// Window
	window: {
		showInformationMessage: vi.fn().mockResolvedValue(undefined),
		showWarningMessage: vi.fn().mockResolvedValue(undefined),
		showErrorMessage: vi.fn().mockResolvedValue(undefined),
		showInputBox: vi.fn().mockResolvedValue('test-input'),
		showTextDocument: vi.fn().mockResolvedValue({}),
		withProgress: vi.fn().mockImplementation((options, task) => task()),
		registerTreeDataProvider: vi.fn().mockReturnValue({ dispose: vi.fn() }),
	},

	// Workspace
	workspace: {
		getConfiguration: vi.fn().mockReturnValue({
			get: vi.fn().mockReturnValue('test-value'),
		}),
		onDidChangeConfiguration: vi.fn().mockReturnValue({ dispose: vi.fn() }),
		fs: {
			stat: vi.fn().mockResolvedValue({ type: 1, size: 1024 }),
			createDirectory: vi.fn().mockResolvedValue(undefined),
			readFile: vi.fn().mockResolvedValue(new Uint8Array([116, 101, 115, 116])), // "test"
			writeFile: vi.fn().mockResolvedValue(undefined),
			delete: vi.fn().mockResolvedValue(undefined),
			copy: vi.fn().mockResolvedValue(undefined),
			rename: vi.fn().mockResolvedValue(undefined),
		},
		workspaceFolders: [
			{
				uri: { fsPath: '/test/workspace' },
				name: 'test-workspace',
				index: 0,
			},
		],
		findFiles: vi.fn().mockResolvedValue([]),
		openTextDocument: vi.fn().mockResolvedValue({}),
		createFileSystemWatcher: vi.fn().mockReturnValue({
			onDidCreate: vi.fn().mockReturnValue({ dispose: vi.fn() }),
			onDidChange: vi.fn().mockReturnValue({ dispose: vi.fn() }),
			onDidDelete: vi.fn().mockReturnValue({ dispose: vi.fn() }),
			dispose: vi.fn(),
		}),
	},

	// Uri
	Uri: {
		file: vi.fn().mockImplementation((path: string) => ({
			scheme: 'file',
			authority: '',
			path,
			query: '',
			fragment: '',
			fsPath: path,
			with: vi.fn().mockReturnThis(),
			toString: vi.fn().mockReturnValue(`file://${path}`),
		})),
		parse: vi.fn().mockImplementation((uri: string) => ({
			scheme: 'file',
			authority: '',
			path: uri.replace('file://', ''),
			query: '',
			fragment: '',
			fsPath: uri.replace('file://', ''),
			with: vi.fn().mockReturnThis(),
			toString: vi.fn().mockReturnValue(uri),
		})),
	},

	// TreeItem
	TreeItem: vi.fn().mockImplementation((label: string, collapsibleState: number) => ({
		label,
		collapsibleState,
		resourceUri: undefined,
		description: undefined,
		tooltip: undefined,
		contextValue: undefined,
		iconPath: undefined,
		toVsCode: vi.fn().mockReturnValue({ label, collapsibleState }),
	})),

	// TreeItemCollapsibleState
	TreeItemCollapsibleState: {
		None: 0,
		Collapsed: 1,
		Expanded: 2,
	},

	// ThemeIcon
	ThemeIcon: vi.fn().mockImplementation((id: string, theme?: string) => ({
		id,
		theme,
		color: undefined,
	})),

	// ThemeColor
	ThemeColor: vi.fn().mockImplementation((id: string) => ({
		id,
	})),

	// RelativePattern
	RelativePattern: vi.fn().mockImplementation((base: any, pattern: string) => ({
		base,
		pattern,
		match: vi.fn().mockReturnValue(true),
	})),

	// EventEmitter
	EventEmitter: vi.fn().mockImplementation(() => ({
		event: vi.fn().mockReturnValue({ dispose: vi.fn() }),
		fire: vi.fn(),
		dispose: vi.fn(),
	})),

	// Disposable
	Disposable: vi.fn().mockImplementation((dispose: () => void) => ({
		dispose,
	})),
}

// Mock the vscode module
vi.mock('vscode', () => mockVSCode)

// ============================================================================
// GLOBAL TEST CONFIGURATION
// ============================================================================

// Global test configuration
globalThis.console = {
	...console,
	// Suppress console output during tests unless explicitly needed
	log: vi.fn(),
	warn: vi.fn(),
	error: vi.fn(),
}
