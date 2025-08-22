import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
	WindowAdapter,
	CommandsAdapter,
	WorkspaceAdapter,
	ContextAdapter,
	PathAdapter,
	FileSystemAdapter,
	QuickPickAdapter,
	CommonUtilsAdapter,
	UriAdapter,
} from '../../src/adapters/index.js'

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

// Mock node:path
vi.mock('node:path', () => ({
	join: vi.fn(),
	relative: vi.fn(),
	basename: vi.fn(),
	dirname: vi.fn(),
	parse: vi.fn(),
}))

describe('Adapters', () => {
	let mockVscode: any
	let mockPath: any

	beforeEach(async () => {
		vi.clearAllMocks()
		mockVscode = await import('vscode')
		mockPath = await import('node:path')
	})

	describe('WindowAdapter', () => {
		let adapter: WindowAdapter

		beforeEach(() => {
			adapter = new WindowAdapter()
		})

		it('should be instantiable', () => {
			expect(adapter).toBeInstanceOf(WindowAdapter)
		})

		it('should call vscode.window.showInformationMessage', async () => {
			const message = 'Test message'
			const expectedResult = 'Activate'
			
			mockVscode.window.showInformationMessage.mockResolvedValue(expectedResult)

			const result = await adapter.showInformationMessage(message)

			expect(mockVscode.window.showInformationMessage).toHaveBeenCalledWith(message)
			expect(result).toBe(expectedResult)
		})

		it('should call vscode.window.showErrorMessage', async () => {
			const message = 'Test error'
			const expectedResult = 'Retry'
			
			mockVscode.window.showErrorMessage.mockResolvedValue(expectedResult)

			const result = await adapter.showErrorMessage(message)

			expect(mockVscode.window.showErrorMessage).toHaveBeenCalledWith(message)
			expect(result).toBe(expectedResult)
		})

		it('should call vscode.window.showWarningMessage', async () => {
			const message = 'Test warning'
			const expectedResult = 'Continue'
			
			mockVscode.window.showWarningMessage.mockResolvedValue(expectedResult)

			const result = await adapter.showWarningMessage(message)

			expect(mockVscode.window.showWarningMessage).toHaveBeenCalledWith(message)
			expect(result).toBe(expectedResult)
		})

		it('should call vscode.window.showInformationMessage for timed message', async () => {
			const message = 'Test timed message'
			
			mockVscode.window.showInformationMessage.mockResolvedValue(undefined)

			await adapter.showTimedInformationMessage(message)

			expect(mockVscode.window.showInformationMessage).toHaveBeenCalledWith(message)
		})
	})

	describe('CommandsAdapter', () => {
		let adapter: CommandsAdapter

		beforeEach(() => {
			adapter = new CommandsAdapter()
		})

		it('should be instantiable', () => {
			expect(adapter).toBeInstanceOf(CommandsAdapter)
		})

		it('should call vscode.commands.registerCommand', () => {
			const command = 'test.command'
			const callback = vi.fn()
			const expectedResult = { dispose: vi.fn() }
			
			mockVscode.commands.registerCommand.mockReturnValue(expectedResult)

			const result = adapter.registerCommand(command, callback)

			expect(mockVscode.commands.registerCommand).toHaveBeenCalledWith(command, callback)
			expect(result).toBe(expectedResult)
		})

		it('should call vscode.commands.executeCommand', async () => {
			const command = 'test.command'
			const expectedResult = 'success'
			
			mockVscode.commands.executeCommand.mockResolvedValue(expectedResult)

			const result = await adapter.executeCommand(command)

			expect(mockVscode.commands.executeCommand).toHaveBeenCalledWith(command)
			expect(result).toBe(expectedResult)
		})
	})

	describe('WorkspaceAdapter', () => {
		let adapter: WorkspaceAdapter

		beforeEach(() => {
			adapter = new WorkspaceAdapter()
		})

		it('should be instantiable', () => {
			expect(adapter).toBeInstanceOf(WorkspaceAdapter)
		})

		it('should call vscode.workspace.getConfiguration', () => {
			const section = 'test.section'
			const mockConfig = {
				get: vi.fn(),
				update: vi.fn(),
			}
			
			mockVscode.workspace.getConfiguration.mockReturnValue(mockConfig)

			const result = adapter.getConfiguration(section)

			expect(mockVscode.workspace.getConfiguration).toHaveBeenCalledWith(section)
			expect(result).toBeInstanceOf(Object)
			expect(result.get).toBeDefined()
			expect(result.update).toBeDefined()
		})
	})

	describe('ContextAdapter', () => {
		let adapter: ContextAdapter
		let mockContext: any

		beforeEach(() => {
			mockContext = {
				subscriptions: [],
				extensionPath: '/test/path',
				globalState: { get: vi.fn(), update: vi.fn() },
				workspaceState: { get: vi.fn(), update: vi.fn() },
			}
			adapter = new ContextAdapter(mockContext)
		})

		it('should be instantiable', () => {
			expect(adapter).toBeInstanceOf(ContextAdapter)
		})

		it('should return extension path', () => {
			expect(adapter.extensionPath).toBe('/test/path')
		})

		it('should return subscriptions array', () => {
			expect(adapter.subscriptions).toBe(mockContext.subscriptions)
		})

		it('should return extension path', () => {
			expect(adapter.extensionPath).toBe('/test/path')
		})

		it('should return subscriptions array', () => {
			expect(adapter.subscriptions).toBe(mockContext.subscriptions)
		})
	})

	describe('PathAdapter', () => {
		let adapter: PathAdapter

		beforeEach(() => {
			adapter = new PathAdapter()
		})

		it('should be instantiable', () => {
			expect(adapter).toBeInstanceOf(PathAdapter)
		})

		it('should call path.join', () => {
			const args = ['/test', 'path', 'file.txt']
			const expectedResult = '/test/path/file.txt'
			
			mockPath.join.mockReturnValue(expectedResult)

			const result = adapter.join(...args)

			expect(mockPath.join).toHaveBeenCalledWith(...args)
			expect(result).toBe(expectedResult)
		})

		it('should call path.relative', () => {
			const from = '/test/from'
			const to = '/test/to/file.txt'
			const expectedResult = '../to/file.txt'
			
			mockPath.relative.mockReturnValue(expectedResult)

			const result = adapter.relative(from, to)

			expect(mockPath.relative).toHaveBeenCalledWith(from, to)
			expect(result).toBe(expectedResult)
		})

		it('should call path.basename', () => {
			const path = '/test/path/file.txt'
			const expectedResult = 'file.txt'
			
			mockPath.basename.mockReturnValue(expectedResult)

			const result = adapter.basename(path)

			expect(mockPath.basename).toHaveBeenCalledWith(path, undefined)
			expect(result).toBe(expectedResult)
		})

		it('should call path.dirname', () => {
			const path = '/test/path/file.txt'
			const expectedResult = '/test/path'
			
			mockPath.dirname.mockReturnValue(expectedResult)

			const result = adapter.dirname(path)

			expect(mockPath.dirname).toHaveBeenCalledWith(path)
			expect(result).toBe(expectedResult)
		})

		it('should call path.parse', () => {
			const path = '/test/path/file.txt'
			const expectedResult = {
				root: '/',
				dir: '/test/path',
				base: 'file.txt',
				ext: '.txt',
				name: 'file',
			}
			
			mockPath.parse.mockReturnValue(expectedResult)

			const result = adapter.parse(path)

			expect(mockPath.parse).toHaveBeenCalledWith(path)
			expect(result).toBe(expectedResult)
		})
	})

	describe('FileSystemAdapter', () => {
		let adapter: FileSystemAdapter

		beforeEach(() => {
			adapter = new FileSystemAdapter()
		})

		it('should be instantiable', () => {
			expect(adapter).toBeInstanceOf(FileSystemAdapter)
		})

		it('should call vscode.workspace.fs.stat', async () => {
			const path = '/test/path'
			const mockStats = {
				type: mockVscode.FileType.File,
				size: 1024,
				ctime: 1234567890,
				mtime: 1234567890,
			}
			
			mockVscode.workspace.fs.stat.mockResolvedValue(mockStats)

			const result = await adapter.stat(path)

			expect(mockVscode.workspace.fs.stat).toHaveBeenCalledWith(expect.objectContaining({ fsPath: path }))
			expect(result.isFile()).toBe(true)
			expect(result.isDirectory()).toBe(false)
			expect(result.size).toBe(1024)
		})

		it('should call vscode.workspace.fs.readDirectory', async () => {
			const path = '/test/path'
			const mockEntries = [['file1.txt', mockVscode.FileType.File], ['folder1', mockVscode.FileType.Directory]]
			
			mockVscode.workspace.fs.readDirectory.mockResolvedValue(mockEntries)

			const result = await adapter.readdir(path)

			expect(mockVscode.workspace.fs.readDirectory).toHaveBeenCalledWith(expect.objectContaining({ fsPath: path }))
			expect(result).toEqual(['file1.txt', 'folder1'])
		})

		it('should call vscode.workspace.fs.readFile', async () => {
			const path = '/test/path'
			const mockContent = new TextEncoder().encode('test content')
			
			mockVscode.workspace.fs.readFile.mockResolvedValue(mockContent)

			const result = await adapter.readFile(path)

			expect(mockVscode.workspace.fs.readFile).toHaveBeenCalledWith(expect.objectContaining({ fsPath: path }))
			expect(result).toBe('test content')
		})

		it('should call vscode.workspace.fs.writeFile', async () => {
			const path = '/test/path'
			const data = 'test content'
			
			mockVscode.workspace.fs.writeFile.mockResolvedValue(undefined)

			await adapter.writeFile(path, data)

			expect(mockVscode.workspace.fs.writeFile).toHaveBeenCalledWith(
				expect.objectContaining({ fsPath: path }),
				expect.any(Uint8Array)
			)
		})

		it('should throw error for readFileSync', () => {
			const path = '/test/path'

			expect(() => adapter.readFileSync(path)).toThrow(
				'readFileSync is not supported in VSCode extensions. Use readFile instead.'
			)
		})
	})

	describe('QuickPickAdapter', () => {
		let adapter: QuickPickAdapter

		beforeEach(() => {
			adapter = new QuickPickAdapter()
		})

		it('should be instantiable', () => {
			expect(adapter).toBeInstanceOf(QuickPickAdapter)
		})

		it('should call vscode.window.showQuickPick for single selection', async () => {
			const items = [{ label: 'item1' }, { label: 'item2' }, { label: 'item3' }]
			const options = { placeHolder: 'Select an item' }
			const key = 'label'
			const expectedResult = 'item2'
			
			mockVscode.window.showQuickPick.mockResolvedValue({ data: { label: 'item2' } })

			const result = await adapter.showQuickPickSingle(items, options, key)

			expect(mockVscode.window.showQuickPick).toHaveBeenCalledWith(
				expect.arrayContaining([
					expect.objectContaining({ label: 'item1', data: expect.any(Object) }),
					expect.objectContaining({ label: 'item2', data: expect.any(Object) }),
					expect.objectContaining({ label: 'item3', data: expect.any(Object) })
				]),
				expect.objectContaining({ placeHolder: 'Select an item' })
			)
			expect(result).toBe(expectedResult)
		})
	})

	describe('CommonUtilsAdapter', () => {
		let adapter: CommonUtilsAdapter
		let mockWindow: any

		beforeEach(() => {
			mockWindow = {
				showInformationMessage: vi.fn(),
				showErrorMessage: vi.fn(),
				showWarningMessage: vi.fn(),
			}
			adapter = new CommonUtilsAdapter(mockWindow)
		})

		it('should be instantiable', () => {
			expect(adapter).toBeInstanceOf(CommonUtilsAdapter)
		})

		it('should delay for specified milliseconds', async () => {
			const ms = 50
			const startTime = Date.now()
			
			await adapter.delay(ms)
			
			const endTime = Date.now()
			const elapsed = endTime - startTime
			
			// Allow some tolerance for timing
			expect(elapsed).toBeGreaterThanOrEqual(ms - 10)
		})

		it('should call window.showErrorMessage', async () => {
			const message = 'Test error message'
			
			mockWindow.showErrorMessage.mockResolvedValue(undefined)

			await adapter.errMsg(message)

			expect(mockWindow.showErrorMessage).toHaveBeenCalledWith(message)
		})
	})

	describe('UriAdapter', () => {
		let adapter: UriAdapter

		beforeEach(() => {
			adapter = new UriAdapter()
		})

		it('should be instantiable', () => {
			expect(adapter).toBeInstanceOf(UriAdapter)
		})

		it('should call vscode.Uri.file', () => {
			const path = '/test/path'
			
			const result = adapter.file(path)

			expect(result.fsPath).toBe(path)
			expect(result.scheme).toBe('file')
			expect(result.authority).toBe('')
			expect(result.path).toBe(path)
			expect(result.query).toBe('')
			expect(result.fragment).toBe('')
		})

		it('should return the provided uri', () => {
			const uri = {
				fsPath: '/test/path',
				scheme: 'file',
				authority: '',
				path: '/test/path',
				query: '',
				fragment: '',
				toString: () => '/test/path',
			}
			
			const result = adapter.create(uri)

			expect(result).toBe(uri)
		})

		it('should call vscode.Uri.joinPath', () => {
			const base = mockVscode.Uri.file('/test/base')
			const pathSegment = 'file.txt'
			
			const result = adapter.joinPath(base, pathSegment)

			expect(result.fsPath).toBe('/test/base/file.txt')
			expect(result.path).toBe('/test/base/file.txt')
		})

		it('should return directory path for file', () => {
			const uri = mockVscode.Uri.file('/test/path/file.txt')
			
			const result = adapter.dirname(uri)

			expect(result).toBe('/test/path')
		})
	})
}) 