import { describe, it, expect, beforeEach } from 'vitest'
import { mockly, mocklyService } from '@fux/mockly'

describe('MocklyService', () => {
	beforeEach(() => {
		mocklyService.reset()
	})

	describe('Core API Simulation', () => {
		it('should provide workspace API', () => {
			expect(mockly.workspace).toBeDefined()
			expect(mockly.workspace.fs).toBeDefined()
			expect(mockly.workspace.workspaceFolders).toBeDefined()
			expect(typeof mockly.workspace.onDidChangeConfiguration).toBe('function')
			expect(typeof mockly.workspace.createFileSystemWatcher).toBe('function')
			expect(typeof mockly.workspace.openTextDocument).toBe('function')
			expect(typeof mockly.workspace.getConfiguration).toBe('function')
			expect(typeof mockly.workspace.getWorkspaceRoot).toBe('function')
		})

		it('should provide window API', () => {
			expect(mockly.window).toBeDefined()
			expect(mockly.window.activeTextEditor).toBeDefined()
			expect(typeof mockly.window.showErrorMessage).toBe('function')
			expect(typeof mockly.window.showInformationMessage).toBe('function')
			expect(typeof mockly.window.showWarningMessage).toBe('function')
			expect(typeof mockly.window.showInputBox).toBe('function')
			expect(typeof mockly.window.showTextDocument).toBe('function')
		})

		it('should provide commands API', () => {
			expect(mockly.commands).toBeDefined()
			expect(typeof mockly.commands.registerCommand).toBe('function')
			expect(typeof mockly.commands.executeCommand).toBe('function')
			expect(typeof mockly.commands.getCommands).toBe('function')
		})

		it('should provide extensions API', () => {
			expect(mockly.extensions).toBeDefined()
			expect(typeof mockly.extensions.getExtension).toBe('function')
			expect(Array.isArray(mockly.extensions.all)).toBe(true)
		})

		it('should provide env API', () => {
			expect(mockly.env).toBeDefined()
			expect(mockly.env.appName).toBe('Mockly VSCode')
			expect(mockly.env.appRoot).toBe('/mockly')
			expect(mockly.env.language).toBe('en')
			expect(mockly.env.machineId).toBe('mockly-machine-id')
			expect(mockly.env.sessionId).toBe('mockly-session-id')
			expect(mockly.env.uiKind).toBe(1)
			expect(mockly.env.uriScheme).toBe('file')
			expect(mockly.env.version).toBe('1.0.0')
			expect(mockly.env.clipboard).toBeDefined()
			expect(typeof mockly.env.clipboard.writeText).toBe('function')
			expect(typeof mockly.env.clipboard.readText).toBe('function')
		})
	})

	describe('VSCode Types and Classes', () => {
		it('should provide Uri class', () => {
			expect(mockly.Uri).toBeDefined()
			expect(typeof mockly.Uri.file).toBe('function')
			expect(typeof mockly.Uri.parse).toBe('function')
			expect(typeof mockly.Uri.joinPath).toBe('function')
			expect(typeof mockly.Uri.from).toBe('function')
		})

		it('should provide Position class', () => {
			expect(mockly.Position).toBeDefined()
		})

		it('should provide Range class', () => {
			expect(mockly.Range).toBeDefined()
		})

		it('should provide Disposable class', () => {
			expect(mockly.Disposable).toBeDefined()
		})

		it('should provide EventEmitter class', () => {
			expect(mockly.EventEmitter).toBeDefined()
		})
	})

	describe('Node.js Utilities', () => {
		it('should provide path utilities', () => {
			expect(mockly.node.path).toBeDefined()
			expect(typeof mockly.node.path.join).toBe('function')
			expect(typeof mockly.node.path.normalize).toBe('function')
			expect(typeof mockly.node.path.dirname).toBe('function')
			expect(typeof mockly.node.path.basename).toBe('function')
			expect(typeof mockly.node.path.extname).toBe('function')
			expect(typeof mockly.node.path.parse).toBe('function')
		})

		it('should provide fs utilities', () => {
			expect(mockly.node.fs).toBeDefined()
			expect(typeof mockly.node.fs.readFile).toBe('function')
			expect(typeof mockly.node.fs.writeFile).toBe('function')
			expect(typeof mockly.node.fs.access).toBe('function')
			expect(typeof mockly.node.fs.stat).toBe('function')
			expect(typeof mockly.node.fs.readdir).toBe('function')
			expect(typeof mockly.node.fs.mkdir).toBe('function')
			expect(typeof mockly.node.fs.rmdir).toBe('function')
			expect(typeof mockly.node.fs.unlink).toBe('function')
			expect(typeof mockly.node.fs.rename).toBe('function')
		})
	})

	describe('Version and Reset', () => {
		it('should provide version information', () => {
			expect(mockly.version).toBe('1.0.0')
		})

		it('should provide reset functionality', () => {
			expect(typeof mocklyService.reset).toBe('function')
			// Test that reset doesn't throw
			expect(() => mocklyService.reset()).not.toThrow()
		})
	})

	describe('Configuration Management', () => {
		it('should manage configuration storage', () => {
			const config = mockly.workspace.getConfiguration('test')
			
			// Test setting and getting configuration
			expect(config.get('key')).toBeUndefined()
			expect(config.has('key')).toBe(false)
			
			// Test updating configuration
			expect(async () => await config.update('key', 'value')).not.toThrow()
			expect(config.get('key')).toBe('value')
			expect(config.has('key')).toBe(true)
			
			// Test inspect
			const inspect = config.inspect('key')

			expect(inspect).toBeDefined()
			expect(inspect?.key).toBe('test.key')
			expect(inspect?.globalValue).toBe('value')
		})
	})

	describe('Command Registration and Execution', () => {
		it('should register and execute commands', async () => {
			const testCommand = 'test.command'
			const testCallback = () => 'test result'
			
			// Register command
			const disposable = mockly.commands.registerCommand(testCommand, testCallback)

			expect(disposable).toBeDefined()
			
			// Get commands list
			const commands = await mockly.commands.getCommands()

			expect(commands).toContain(testCommand)
			
			// Execute command
			const result = await mockly.commands.executeCommand(testCommand)

			expect(result).toBe('test result')
		})

		it('should handle non-existent commands', async () => {
			const nonExistentCommand = 'non.existent.command'
			
			await expect(mockly.commands.executeCommand(nonExistentCommand)).rejects.toThrow()
		})
	})

	describe('File System Operations', () => {
		it('should handle file operations', async () => {
			const uri = mockly.Uri.file('/test/file.txt')
			const content = new TextEncoder().encode('test content')
			
			// Test write file
			await expect(mockly.workspace.fs.writeFile(uri, content)).resolves.not.toThrow()
			
			// Test read file
			const readContent = await mockly.workspace.fs.readFile(uri)

			expect(readContent).toEqual(content)
		})

		it('should handle directory operations', async () => {
			const uri = mockly.Uri.file('/test/directory')
			
			// Test create directory
			await expect(mockly.workspace.fs.createDirectory(uri)).resolves.not.toThrow()
			
			// Test read directory
			const entries = await mockly.workspace.fs.readDirectory(uri)

			expect(Array.isArray(entries)).toBe(true)
		})
	})

	describe('Text Document Operations', () => {
		it('should open text documents', async () => {
			const uri = mockly.Uri.file('/test/document.txt')
			
			// Test opening document
			const document = await mockly.workspace.openTextDocument(uri)

			expect(document).toBeDefined()
			expect(document.uri).toEqual(uri)
		})
	})

	describe('Event System', () => {
		it('should handle configuration change events', () => {
			const listener = () => {}
			const disposable = mockly.workspace.onDidChangeConfiguration(listener)
			
			expect(disposable).toBeDefined()
			expect(typeof disposable.dispose).toBe('function')
		})

		it('should create file system watchers', () => {
			const pattern = '**/*.ts'
			const watcher = mockly.workspace.createFileSystemWatcher(pattern)
			
			expect(watcher).toBeDefined()
			expect(watcher.onDidCreate).toBeDefined()
			expect(watcher.onDidChange).toBeDefined()
			expect(watcher.onDidDelete).toBeDefined()
			expect(typeof watcher.dispose).toBe('function')
		})
	})

	describe('Extension Management', () => {
		it('should get extension information', () => {
			const extensionId = 'test.extension'
			const extension = mockly.extensions.getExtension(extensionId)
			
			expect(extension).toBeDefined()
			expect(extension?.id).toBe(extensionId)
			expect(extension?.extensionPath).toBe(`/extensions/${extensionId}`)
			expect(extension?.isActive).toBe(true)
			expect(extension?.packageJSON).toBeDefined()
			expect(extension?.exports).toBeDefined()
		})
	})

	describe('Window Operations', () => {
		it('should handle message display', async () => {
			const message = 'Test message'
			
			// Test information message
			await expect(mockly.window.showInformationMessage(message)).resolves.not.toThrow()
			
			// Test error message
			expect(() => mockly.window.showErrorMessage(message)).not.toThrow()
			
			// Test warning message
			await expect(mockly.window.showWarningMessage(message)).resolves.not.toThrow()
		})

		it('should handle input operations', async () => {
			const options = { prompt: 'Enter text' }
			
			// Test input box
			await expect(mockly.window.showInputBox(options)).resolves.not.toThrow()
		})
	})

	describe('Path Normalization', () => {
		it('should normalize paths consistently', () => {
			const path1 = 'C:\\test\\path'
			const _path2 = '/test/path'
			
			// Test path joining with normalization
			const joined = mockly.node.path.join(path1, 'subdir')

			expect(joined).toContain('/')
			expect(joined).not.toContain('\\')
			
			// Test path normalization
			const normalized = mockly.node.path.normalize(path1)

			expect(normalized).toContain('/')
			expect(normalized).not.toContain('\\')
		})
	})
})
