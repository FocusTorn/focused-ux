import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createDIContainer } from '../src/injection.js'
import type { ExtensionContext } from 'vscode'

// Mock the shared adapters
vi.mock('@fux/shared', () => ({
	ConfigurationService: vi.fn().mockImplementation(() => ({
		get: vi.fn(),
		update: vi.fn(),
	})),
	TerminalAdapter: vi.fn().mockImplementation(() => ({
		activeTerminal: undefined,
		createTerminal: vi.fn().mockReturnValue({
			name: 'Test Terminal',
			sendText: vi.fn(),
			show: vi.fn(),
			hide: vi.fn(),
			dispose: vi.fn(),
			processId: Promise.resolve(1),
			creationOptions: {},
			exitStatus: undefined,
			state: 1,
			shellIntegration: undefined,
		}),
	})),
	WindowAdapter: vi.fn().mockImplementation(() => ({
		activeTextEditorUri: 'file:///test/path/file.txt',
		showErrorMessage: vi.fn(),
		showTimedInformationMessage: vi.fn(),
	})),
	ProcessAdapter: vi.fn().mockImplementation(() => ({
		getWorkspaceRoot: vi.fn().mockReturnValue('/test/workspace'),
	})),
	WorkspaceAdapter: vi.fn().mockImplementation(() => ({
		getWorkspaceRoot: vi.fn().mockReturnValue('/test/workspace'),
	})),
}))

// Mock the core container creation
vi.mock('@fux/project-butler-core', () => ({
	createCoreContainer: vi.fn().mockImplementation((deps: any) => ({
		cradle: {
			projectButlerService: {
				updateTerminalPath: vi.fn(),
				createBackup: vi.fn(),
				enterPoetryShell: vi.fn(),
				formatPackageJson: vi.fn(),
			},
		},
	})),
}))

// Mock the local FileSystem adapter
vi.mock('../src/_adapters/FileSystem.adapter.js', () => ({
	FileSystemAdapter: vi.fn().mockImplementation(() => ({
		stat: vi.fn().mockResolvedValue({
			type: 2, // Directory
			size: 1024,
			ctime: Date.now(),
			mtime: Date.now(),
		}),
		access: vi.fn().mockResolvedValue(undefined),
		copyFile: vi.fn().mockResolvedValue(undefined),
		readFile: vi.fn().mockResolvedValue('test content'),
		writeFile: vi.fn().mockResolvedValue(undefined),
	})),
}))

describe('Extension DI Container', () => {
	let mockContext: ExtensionContext

	beforeEach(() => {
		// Reset all mocks
		vi.clearAllMocks()

		// Create a fresh mock context for each test
		mockContext = {
			subscriptions: [],
			workspaceState: {
				get: vi.fn(),
				update: vi.fn(),
			},
			globalState: {
				get: vi.fn(),
				update: vi.fn(),
			},
			extensionPath: '/test/extension/path',
			extensionUri: { fsPath: '/test/extension/path' },
			environmentVariableCollection: {
				replace: vi.fn(),
				append: vi.fn(),
				prepend: vi.fn(),
				delete: vi.fn(),
			},
		} as any
	})

	describe('createDIContainer', () => {
		it('should create a DI container successfully', async () => {
			const container = await createDIContainer(mockContext)

			expect(container).toBeDefined()
			expect(typeof container.resolve).toBe('function')
		})

		it('should register all required services', async () => {
			const container = await createDIContainer(mockContext)

			// Test that we can resolve all the key services
			expect(() => container.resolve('fileSystem')).not.toThrow()
			expect(() => container.resolve('workspace')).not.toThrow()
			expect(() => container.resolve('process')).not.toThrow()
			expect(() => container.resolve('terminalProvider')).not.toThrow()
			expect(() => container.resolve('projectButlerService')).not.toThrow()
		})

		it('should create core container with injected dependencies', async () => {
			const { createCoreContainer } = await import('@fux/project-butler-core')
			
			await createDIContainer(mockContext)

			expect(createCoreContainer).toHaveBeenCalledWith({
				fileSystem: expect.any(Object),
				window: expect.any(Object),
				terminalProvider: expect.any(Object),
				process: expect.any(Object),
			})
		})

		it('should register projectButlerService from core container', async () => {
			const container = await createDIContainer(mockContext)

			const projectButlerService = container.resolve('projectButlerService')

			expect(projectButlerService).toBeDefined()
			expect(projectButlerService.updateTerminalPath).toBeDefined()
			expect(projectButlerService.createBackup).toBeDefined()
			expect(projectButlerService.enterPoetryShell).toBeDefined()
			expect(projectButlerService.formatPackageJson).toBeDefined()
		})

		it('should handle errors gracefully during container creation', async () => {
			// Mock a failure in one of the dependencies
			const { FileSystemAdapter } = await import('../src/_adapters/FileSystem.adapter.js')

			vi.mocked(FileSystemAdapter).mockImplementationOnce(() => {
				throw new Error('FileSystem creation failed')
			})

			await expect(createDIContainer(mockContext)).rejects.toThrow('FileSystem creation failed')
		})
	})

	describe('Service Dependencies', () => {
		it('should inject fileSystem with correct interface', async () => {
			const container = await createDIContainer(mockContext)
			const fileSystem = container.resolve('fileSystem')

			expect(fileSystem.stat).toBeDefined()
			expect(fileSystem.access).toBeDefined()
			expect(fileSystem.copyFile).toBeDefined()
			expect(fileSystem.readFile).toBeDefined()
			expect(fileSystem.writeFile).toBeDefined()
		})

		it('should inject terminalProvider with correct interface', async () => {
			const container = await createDIContainer(mockContext)
			const terminalProvider = container.resolve('terminalProvider')

			console.log('terminalProvider:', terminalProvider)
			console.log('terminalProvider type:', typeof terminalProvider)
			console.log('terminalProvider keys:', Object.keys(terminalProvider || {}))

			// Check that the properties exist on the object
			expect('activeTerminal' in terminalProvider).toBe(true)
			expect('createTerminal' in terminalProvider).toBe(true)
			
			// Check that the methods are callable
			expect(typeof terminalProvider.createTerminal).toBe('function')
		})

		it('should inject window with correct interface', async () => {
			const container = await createDIContainer(mockContext)
			const window = container.resolve('window')

			expect(window.activeTextEditorUri).toBeDefined()
			expect(window.showErrorMessage).toBeDefined()
			expect(window.showTimedInformationMessage).toBeDefined()
		})

		it('should inject process with correct interface', async () => {
			const container = await createDIContainer(mockContext)
			const process = container.resolve('process')

			expect(process.getWorkspaceRoot).toBeDefined()
		})
	})
})
