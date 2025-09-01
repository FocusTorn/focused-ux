import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as vscode from 'vscode'
import * as path from 'node:path'
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
		parse: (value: string) => ({
			fsPath: value,
			scheme: 'file',
			authority: '',
			path: value,
			query: '',
			fragment: '',
			toString: () => value,
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
	// Mocks are now handled in _setup.ts

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
			
			vi.mocked(vscode.window.showInformationMessage).mockResolvedValue(expectedResult)

			const result = await adapter.showInformationMessage(message)

			expect(vi.mocked(vscode.window.showInformationMessage)).toHaveBeenCalledWith(message)
			expect(result).toBe(expectedResult)
		})

		it('should call vscode.window.showErrorMessage', async () => {
			const message = 'Test error'
			const expectedResult = 'Retry'
			
			vi.mocked(vscode.window.showErrorMessage).mockResolvedValue(expectedResult)

			const result = await adapter.showErrorMessage(message)

			expect(vi.mocked(vscode.window.showErrorMessage)).toHaveBeenCalledWith(message)
			expect(result).toBe(expectedResult)
		})

		it('should call vscode.window.showWarningMessage', async () => {
			const message = 'Test warning'
			const expectedResult = 'Continue'
			
			vi.mocked(vscode.window.showWarningMessage).mockResolvedValue(expectedResult)

			const result = await adapter.showWarningMessage(message)

			expect(vi.mocked(vscode.window.showWarningMessage)).toHaveBeenCalledWith(message)
			expect(result).toBe(expectedResult)
		})

		it('should call vscode.window.showInformationMessage for timed message', async () => {
			const message = 'Test timed message'
			
			vi.mocked(vscode.window.showInformationMessage).mockResolvedValue(undefined)

			await adapter.showTimedInformationMessage(message)

			expect(vi.mocked(vscode.window.showInformationMessage)).toHaveBeenCalledWith(message)
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
			
			vi.mocked(vscode.commands.registerCommand).mockReturnValue(expectedResult)

			const result = adapter.registerCommand(command, callback)

			expect(vi.mocked(vscode.commands.registerCommand)).toHaveBeenCalledWith(command, callback)
			expect(result).toBe(expectedResult)
		})

		it('should call vscode.commands.executeCommand', async () => {
			const command = 'test.command'
			const expectedResult = 'success'
			
			vi.mocked(vscode.commands.executeCommand).mockResolvedValue(expectedResult)

			const result = await adapter.executeCommand(command)

			expect(vi.mocked(vscode.commands.executeCommand)).toHaveBeenCalledWith(command)
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
			
			vi.mocked(vscode.workspace.getConfiguration).mockReturnValue(mockConfig)

			const result = adapter.getConfiguration(section)

			expect(vi.mocked(vscode.workspace.getConfiguration)).toHaveBeenCalledWith(section)
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
			
			vi.mocked(path.join).mockReturnValue(expectedResult)

			const result = adapter.join(...args)

			expect(vi.mocked(path.join)).toHaveBeenCalledWith(...args)
			expect(result).toBe(expectedResult)
		})

		it('should call path.relative', () => {
			const from = '/test/from'
			const to = '/test/to/file.txt'
			const expectedResult = '../to/file.txt'
			
			vi.mocked(path.relative).mockReturnValue(expectedResult)

			const result = adapter.relative(from, to)

			expect(vi.mocked(path.relative)).toHaveBeenCalledWith(from, to)
			expect(result).toBe(expectedResult)
		})

		it('should call path.basename', () => {
			const pathStr = '/test/path/file.txt'
			const expectedResult = 'file.txt'
			
			vi.mocked(path.basename).mockReturnValue(expectedResult)

			const result = adapter.basename(pathStr)

			expect(vi.mocked(path.basename)).toHaveBeenCalledWith(pathStr, undefined)
			expect(result).toBe(expectedResult)
		})

		it('should call path.dirname', () => {
			const pathStr = '/test/path/file.txt'
			const expectedResult = '/test/path'
			
			vi.mocked(path.dirname).mockReturnValue(expectedResult)

			const result = adapter.dirname(pathStr)

			expect(vi.mocked(path.dirname)).toHaveBeenCalledWith(pathStr)
			expect(result).toBe(expectedResult)
		})

		it('should call path.parse', () => {
			const pathStr = '/test/path/file.txt'
			const expectedResult = {
				root: '/',
				dir: '/test/path',
				base: 'file.txt',
				ext: '.txt',
				name: 'file',
			}
			
			vi.mocked(path.parse).mockReturnValue(expectedResult)

			const result = adapter.parse(pathStr)

			expect(vi.mocked(path.parse)).toHaveBeenCalledWith(pathStr)
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
				type: vscode.FileType.File,
				size: 1024,
				ctime: 1234567890,
				mtime: 1234567890,
			}
			
			vi.mocked(vscode.workspace.fs.stat).mockResolvedValue(mockStats)

			const result = await adapter.stat(path)

			expect(vi.mocked(vscode.workspace.fs.stat)).toHaveBeenCalledWith(expect.objectContaining({ fsPath: path }))
			expect(result.isFile()).toBe(true)
			expect(result.isDirectory()).toBe(false)
			expect(result.size).toBe(1024)
		})

		it('should call vscode.workspace.fs.readDirectory', async () => {
			const path = '/test/path'
			const mockEntries = [['file1.txt', vscode.FileType.File], ['folder1', vscode.FileType.Directory]]
			
			vi.mocked(vscode.workspace.fs.readDirectory).mockResolvedValue(mockEntries)

			const result = await adapter.readdir(path)

			expect(vi.mocked(vscode.workspace.fs.readDirectory)).toHaveBeenCalledWith(expect.objectContaining({ fsPath: path }))
			expect(result).toEqual(['file1.txt', 'folder1'])
		})

		it('should call vscode.workspace.fs.readFile', async () => {
			const path = '/test/path'
			const mockContent = new TextEncoder().encode('test content')
			
			vi.mocked(vscode.workspace.fs.readFile).mockResolvedValue(mockContent)

			const result = await adapter.readFile(path)

			expect(vi.mocked(vscode.workspace.fs.readFile)).toHaveBeenCalledWith(expect.objectContaining({ fsPath: path }))
			expect(result).toBe('test content')
		})

		it('should call vscode.workspace.fs.writeFile', async () => {
			const path = '/test/path'
			const data = 'test content'
			
			vi.mocked(vscode.workspace.fs.writeFile).mockResolvedValue(undefined)

			await adapter.writeFile(path, data)

			expect(vi.mocked(vscode.workspace.fs.writeFile)).toHaveBeenCalledWith(
				expect.objectContaining({ fsPath: path }),
				expect.any(Uint8Array),
			)
		})

		it('should throw error for readFileSync', () => {
			const path = '/test/path'

			expect(() => adapter.readFileSync(path)).toThrow(
				'readFileSync is not supported in VSCode extensions. Use readFile instead.',
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
			
			vi.mocked(vscode.window.showQuickPick).mockResolvedValue({ data: { label: 'item2' } })

			const result = await adapter.showQuickPickSingle(items, options, key)

			expect(vi.mocked(vscode.window.showQuickPick)).toHaveBeenCalledWith(
				expect.arrayContaining([
					expect.objectContaining({ label: 'item1', data: expect.any(Object) }),
					expect.objectContaining({ label: 'item2', data: expect.any(Object) }),
					expect.objectContaining({ label: 'item3', data: expect.any(Object) }),
				]),
				expect.objectContaining({ placeHolder: 'Select an item' }),
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
		let consoleWarnSpy: any

		beforeEach(() => {
			adapter = new UriAdapter()
			consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
		})

		afterEach(() => {
			consoleWarnSpy.mockRestore()
		})

		it('should be instantiable', () => {
			expect(adapter).toBeInstanceOf(UriAdapter)
		})

		describe('file method', () => {
			it('should call vscode.Uri.file with valid path', () => {
				const path = '/test/path'
				
				const result = adapter.file(path)

				expect(result.fsPath).toBe(path)
				expect(result.scheme).toBe('file')
				expect(result.authority).toBe('')
				expect(result.path).toBe(path)
				expect(result.query).toBe('')
				expect(result.fragment).toBe('')
			})

			it('should handle empty path gracefully', () => {
				const result = adapter.file('')
				
				expect(consoleWarnSpy).toHaveBeenCalledWith('[UriAdapter] Invalid path provided to file():', '')
				expect(result.fsPath).toBe('/invalid-path')
			})

			it('should handle null path gracefully', () => {
				const result = adapter.file(null as any)
				
				expect(consoleWarnSpy).toHaveBeenCalledWith('[UriAdapter] Invalid path provided to file():', null)
				expect(result.fsPath).toBe('/invalid-path')
			})

			it('should handle undefined path gracefully', () => {
				const result = adapter.file(undefined as any)
				
				expect(consoleWarnSpy).toHaveBeenCalledWith('[UriAdapter] Invalid path provided to file():', undefined)
				expect(result.fsPath).toBe('/invalid-path')
			})
		})

		describe('create method', () => {
			it('should return the provided uri object', () => {
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

				expect(result.fsPath).toBe(uri.fsPath)
				expect(result.scheme).toBe(uri.scheme)
				expect(result.path).toBe(uri.path)
			})

			it('should handle string input by calling file method', () => {
				const path = '/test/path'
				const fileSpy = vi.spyOn(adapter, 'file')
				
				adapter.create(path)

				expect(fileSpy).toHaveBeenCalledWith(path)
			})

			it('should handle null input gracefully', () => {
				const result = adapter.create(null as any)
				
				expect(consoleWarnSpy).toHaveBeenCalledWith('[UriAdapter] Invalid URI provided to create():', null)
				expect(result.fsPath).toBe('/invalid-uri')
			})

			it('should handle undefined input gracefully', () => {
				const result = adapter.create(undefined as any)
				
				expect(consoleWarnSpy).toHaveBeenCalledWith('[UriAdapter] Invalid URI provided to create():', undefined)
				expect(result.fsPath).toBe('/invalid-uri')
			})
		})

		describe('joinPath method', () => {
			it('should call vscode.Uri.joinPath with valid inputs', () => {
				const base = vscode.Uri.file('/test/base')
				const pathSegment = 'file.txt'
				
				const result = adapter.joinPath(base, pathSegment)

				expect(result.fsPath).toBe('/test/base/file.txt')
				expect(result.path).toBe('/test/base/file.txt')
			})

			it('should filter out invalid path segments', () => {
				const base = vscode.Uri.file('/test/base')
				const validSegment = 'file.txt'
				const invalidSegments = ['', null, undefined, '  ']
				
				const result = adapter.joinPath(base, ...invalidSegments, validSegment)

				expect(result.fsPath).toBe('/test/base/file.txt')
				expect(result.path).toBe('/test/base/file.txt')
			})

			it('should handle null base gracefully', () => {
				const result = adapter.joinPath(null as any, 'file.txt')
				
				expect(consoleWarnSpy).toHaveBeenCalledWith('[UriAdapter] Invalid base URI provided to joinPath():', null)
				expect(result.fsPath).toBe('/invalid-base')
			})

			it('should handle undefined base gracefully', () => {
				const result = adapter.joinPath(undefined as any, 'file.txt')
				
				expect(consoleWarnSpy).toHaveBeenCalledWith('[UriAdapter] Invalid base URI provided to joinPath():', undefined)
				expect(result.fsPath).toBe('/invalid-base')
			})
		})

		describe('dirname method', () => {
			it('should return directory path for file', () => {
				const uri = vscode.Uri.file('/test/path/file.txt')
				
				const result = adapter.dirname(uri)

				expect(result).toBe('/test/path')
			})

			it('should handle null uri gracefully', () => {
				const result = adapter.dirname(null as any)
				
				expect(consoleWarnSpy).toHaveBeenCalledWith('[UriAdapter] Invalid URI provided to dirname():', null)
				expect(result).toBe('/')
			})

			it('should handle undefined uri gracefully', () => {
				const result = adapter.dirname(undefined as any)
				
				expect(consoleWarnSpy).toHaveBeenCalledWith('[UriAdapter] Invalid URI provided to dirname():', undefined)
				expect(result).toBe('/')
			})

			it('should handle uri without fsPath gracefully', () => {
				const uri = { scheme: 'file', authority: '', path: '/test', query: '', fragment: '' }
				const result = adapter.dirname(uri as any)
				
				expect(consoleWarnSpy).toHaveBeenCalledWith('[UriAdapter] Invalid URI provided to dirname():', uri)
				expect(result).toBe('/')
			})
		})

		describe('integration scenarios', () => {
			it('should handle real-world extension URI usage', () => {
				const extensionUri = vscode.Uri.file('/extension/path')
				const assetsPath = 'assets/themes'
				
				const createdUri = adapter.create(extensionUri)
				const joinedUri = adapter.joinPath(createdUri, assetsPath)
				
				expect(createdUri.fsPath).toBe(extensionUri.fsPath)
				expect(joinedUri.fsPath).toBe('/extension/path/assets/themes')
			})

			it('should handle multiple path segments', () => {
				const base = vscode.Uri.file('/base')
				const segments = ['folder1', 'folder2', 'file.txt']
				
				const result = adapter.joinPath(base, ...segments)
				
				expect(result.fsPath).toBe('/base/folder1/folder2/file.txt')
			})
		})
	})
})
