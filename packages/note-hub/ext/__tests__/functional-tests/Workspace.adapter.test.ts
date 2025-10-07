import { describe, it, expect, beforeEach, vi } from 'vitest'
import { WorkspaceAdapter } from '../../src/adapters/Workspace.adapter.js'
import type { IWorkspace } from '@fux/note-hub-core'

describe('WorkspaceAdapter', () => {
	let mockVSCodeWorkspace: any
	let adapter: IWorkspace

	beforeEach(() => {
		vi.clearAllMocks()
        
		// Create a comprehensive mock VSCode workspace
		mockVSCodeWorkspace = {
			onDidChangeConfiguration: vi.fn().mockReturnValue({ dispose: vi.fn() }),
			getConfiguration: vi.fn().mockReturnValue({
				get: vi.fn().mockReturnValue('test-value'),
				update: vi.fn().mockResolvedValue(undefined),
			}),
			openTextDocument: vi.fn().mockResolvedValue({ uri: { fsPath: '/test/file.md' } }),
			workspaceFolders: [
				{
					uri: { fsPath: '/test/workspace' },
					name: 'test-workspace',
					index: 0,
				},
			],
			createFileSystemWatcher: vi.fn().mockReturnValue({
				onDidChange: vi.fn().mockReturnValue({ dispose: vi.fn() }),
				onDidCreate: vi.fn().mockReturnValue({ dispose: vi.fn() }),
				onDidDelete: vi.fn().mockReturnValue({ dispose: vi.fn() }),
				dispose: vi.fn(),
			}),
			fs: {
				readFile: vi.fn().mockResolvedValue(new Uint8Array([116, 101, 115, 116])), // "test"
				writeFile: vi.fn().mockResolvedValue(undefined),
				stat: vi.fn().mockResolvedValue({ type: 1, size: 1024 }),
				readDirectory: vi.fn().mockResolvedValue([['file.txt', 1], ['folder', 2]]),
				createDirectory: vi.fn().mockResolvedValue(undefined),
				delete: vi.fn().mockResolvedValue(undefined),
				copy: vi.fn().mockResolvedValue(undefined),
				rename: vi.fn().mockResolvedValue(undefined),
			},
		}

		adapter = new WorkspaceAdapter(mockVSCodeWorkspace)
	})

	describe('configuration management', () => {
		it('should register configuration change listener', () => {
			const listener = vi.fn()
            
			const disposable = adapter.onDidChangeConfiguration(listener)
            
			expect(mockVSCodeWorkspace.onDidChangeConfiguration).toHaveBeenCalledWith(listener)
			expect(disposable).toBeDefined()
			expect(disposable.dispose).toBeDefined()
		})

		it('should get configuration without section', () => {
			const config = adapter.getConfiguration()
            
			expect(mockVSCodeWorkspace.getConfiguration).toHaveBeenCalledWith(undefined)
			expect(config).toBeDefined()
			expect(config.get).toBeDefined()
			expect(config.update).toBeDefined()
		})

		it('should get configuration with specific section', () => {
			const section = 'notesHub'
            
			const config = adapter.getConfiguration(section)
            
			expect(mockVSCodeWorkspace.getConfiguration).toHaveBeenCalledWith(section)
			expect(config).toBeDefined()
		})

		it('should handle configuration get with default value', () => {
			const config = adapter.getConfiguration('test')
			const key = 'projectPath'
			const defaultValue = '/default/path'
            
			const result = config.get(key, defaultValue)
            
			expect(mockVSCodeWorkspace.getConfiguration().get).toHaveBeenCalledWith(key, defaultValue)
			expect(result).toBe('test-value')
		})

		it('should handle configuration update', async () => {
			const config = adapter.getConfiguration('test')
			const key = 'projectPath'
			const value = '/new/path'
			const target = 1
            
			await config.update(key, value, target)
            
			expect(mockVSCodeWorkspace.getConfiguration().update).toHaveBeenCalledWith(key, value, target)
		})

		it('should handle configuration update errors', async () => {
			const config = adapter.getConfiguration('test')
			const error = new Error('Update failed')
            
			mockVSCodeWorkspace.getConfiguration().update.mockRejectedValueOnce(error)
            
			await expect(config.update('key', 'value')).rejects.toThrow('Update failed')
		})
	})

	describe('document management', () => {
		it('should open text document', async () => {
			const uri = { fsPath: '/test/file.md' }
            
			const document = await adapter.openTextDocument(uri)
            
			expect(mockVSCodeWorkspace.openTextDocument).toHaveBeenCalledWith(uri)
			expect(document).toBeDefined()
			expect(document.uri).toBeDefined()
		})

		it('should handle document opening errors', async () => {
			const uri = { fsPath: '/invalid/file.md' }
			const error = new Error('File not found')
            
			mockVSCodeWorkspace.openTextDocument.mockRejectedValueOnce(error)
            
			await expect(adapter.openTextDocument(uri)).rejects.toThrow('File not found')
		})
	})

	describe('workspace folders', () => {
		it('should return workspace folders', () => {
			const folders = adapter.workspaceFolders
            
			expect(folders).toBeDefined()
			expect(folders).toHaveLength(1)
			expect(folders![0].name).toBe('test-workspace')
			expect(folders![0].uri.fsPath).toBe('/test/workspace')
		})

		it('should handle undefined workspace folders', () => {
			mockVSCodeWorkspace.workspaceFolders = undefined

			const newAdapter = new WorkspaceAdapter(mockVSCodeWorkspace)
            
			const folders = newAdapter.workspaceFolders
            
			expect(folders).toBeUndefined()
		})
	})

	describe('file system watcher', () => {
		it('should create file system watcher', () => {
			const pattern = '**/*.md'
            
			const watcher = adapter.createFileSystemWatcher(pattern)
            
			expect(mockVSCodeWorkspace.createFileSystemWatcher).toHaveBeenCalledWith(pattern)
			expect(watcher).toBeDefined()
			expect(watcher.onDidChange).toBeDefined()
			expect(watcher.onDidCreate).toBeDefined()
			expect(watcher.onDidDelete).toBeDefined()
			expect(watcher.dispose).toBeDefined()
		})

		it('should handle watcher events', () => {
			const pattern = '**/*.md'
			const changeListener = vi.fn()
			const createListener = vi.fn()
			const deleteListener = vi.fn()
            
			const watcher = adapter.createFileSystemWatcher(pattern)
            
			watcher.onDidChange(changeListener)
			watcher.onDidCreate(createListener)
			watcher.onDidDelete(deleteListener)
            
			expect(mockVSCodeWorkspace.createFileSystemWatcher().onDidChange).toHaveBeenCalledWith(changeListener)
			expect(mockVSCodeWorkspace.createFileSystemWatcher().onDidCreate).toHaveBeenCalledWith(createListener)
			expect(mockVSCodeWorkspace.createFileSystemWatcher().onDidDelete).toHaveBeenCalledWith(deleteListener)
		})

		it('should dispose watcher', () => {
			const pattern = '**/*.md'
            
			const watcher = adapter.createFileSystemWatcher(pattern)

			watcher.dispose()
            
			expect(mockVSCodeWorkspace.createFileSystemWatcher().dispose).toHaveBeenCalled()
		})
	})

	describe('file system operations', () => {
		it('should read file', async () => {
			const uri = { fsPath: '/test/file.txt' }
            
			const content = await adapter.fs.readFile(uri)
            
			expect(mockVSCodeWorkspace.fs.readFile).toHaveBeenCalledWith(uri)
			expect(content).toBeInstanceOf(Uint8Array)
			expect(Array.from(content)).toEqual([116, 101, 115, 116]) // "test"
		})

		it('should write file', async () => {
			const uri = { fsPath: '/test/file.txt' }
			const content = new Uint8Array([116, 101, 115, 116]) // "test"
            
			await adapter.fs.writeFile(uri, content)
            
			expect(mockVSCodeWorkspace.fs.writeFile).toHaveBeenCalledWith(uri, content)
		})

		it('should get file stats', async () => {
			const uri = { fsPath: '/test/file.txt' }
            
			const stats = await adapter.fs.stat(uri)
            
			expect(mockVSCodeWorkspace.fs.stat).toHaveBeenCalledWith(uri)
			expect(stats.type).toBe(1)
			expect(stats.size).toBe(1024)
		})

		it('should read directory', async () => {
			const uri = { fsPath: '/test/directory' }
            
			const entries = await adapter.fs.readDirectory(uri)
            
			expect(mockVSCodeWorkspace.fs.readDirectory).toHaveBeenCalledWith(uri)
			expect(entries).toHaveLength(2)
			expect(entries[0]).toEqual(['file.txt', 1])
			expect(entries[1]).toEqual(['folder', 2])
		})

		it('should create directory', async () => {
			const uri = { fsPath: '/test/new-directory' }
            
			await adapter.fs.createDirectory(uri)
            
			expect(mockVSCodeWorkspace.fs.createDirectory).toHaveBeenCalledWith(uri)
		})

		it('should delete file', async () => {
			const uri = { fsPath: '/test/file.txt' }
			const options = { recursive: true, useTrash: false }
            
			await adapter.fs.delete(uri, options)
            
			expect(mockVSCodeWorkspace.fs.delete).toHaveBeenCalledWith(uri, options)
		})

		it('should copy file', async () => {
			const source = { fsPath: '/test/source.txt' }
			const destination = { fsPath: '/test/destination.txt' }
			const options = { overwrite: true }
            
			await adapter.fs.copy(source, destination, options)
            
			expect(mockVSCodeWorkspace.fs.copy).toHaveBeenCalledWith(source, destination, options)
		})

		it('should rename file', async () => {
			const source = { fsPath: '/test/old-name.txt' }
			const destination = { fsPath: '/test/new-name.txt' }
			const options = { overwrite: false }
            
			await adapter.fs.rename(source, destination, options)
            
			expect(mockVSCodeWorkspace.fs.rename).toHaveBeenCalledWith(source, destination, options)
		})

		it('should handle file system operation errors', async () => {
			const uri = { fsPath: '/invalid/file.txt' }
			const error = new Error('File not found')
            
			mockVSCodeWorkspace.fs.readFile.mockRejectedValueOnce(error)
            
			await expect(adapter.fs.readFile(uri)).rejects.toThrow('File not found')
		})
	})

	describe('integration scenarios', () => {
		it('should handle complete workspace configuration workflow', async () => {
			const section = 'notesHub'
			const key = 'projectPath'
			const newValue = '/updated/path'
            
			// Get configuration
			const config = adapter.getConfiguration(section)
			const currentValue = config.get(key)
            
			// Update configuration
			await config.update(key, newValue)
            
			expect(currentValue).toBe('test-value')
			expect(mockVSCodeWorkspace.getConfiguration).toHaveBeenCalledWith(section)
			expect(mockVSCodeWorkspace.getConfiguration().update).toHaveBeenCalledWith(key, newValue, undefined)
		})

		it('should handle file operation workflow', async () => {
			const uri = { fsPath: '/test/workflow.txt' }
			const content = new Uint8Array([104, 101, 108, 108, 111]) // "hello"
            
			// Check if file exists
			const stats = await adapter.fs.stat(uri)
            
			// Write file
			await adapter.fs.writeFile(uri, content)
            
			// Read file back
			const readContent = await adapter.fs.readFile(uri)
            
			expect(stats).toBeDefined()
			expect(mockVSCodeWorkspace.fs.writeFile).toHaveBeenCalledWith(uri, content)
			expect(mockVSCodeWorkspace.fs.readFile).toHaveBeenCalledWith(uri)
			expect(readContent).toBeInstanceOf(Uint8Array)
		})

		it('should handle workspace folder and watcher integration', () => {
			const folders = adapter.workspaceFolders
            
			if (folders && folders.length > 0) {
				const pattern = '**/*.md'
				const watcher = adapter.createFileSystemWatcher(pattern)
                
				expect(folders[0].uri.fsPath).toBe('/test/workspace')
				expect(watcher).toBeDefined()
                
				watcher.dispose()
			}
		})
	})
})
