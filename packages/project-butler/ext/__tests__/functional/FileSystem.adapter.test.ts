import { describe, it, expect, beforeEach, vi } from 'vitest'
import { FileSystemAdapter } from '../../src/adapters/FileSystem.adapter'
import { Buffer } from 'node:buffer'
import * as vscode from 'vscode'

describe('FileSystemAdapter', () => {
	let adapter: FileSystemAdapter

	beforeEach(() => {
		vi.clearAllMocks()
		adapter = new FileSystemAdapter()
	})

	describe('readFile', () => {
		it('should read file content', async () => {
			// Arrange
			const path = '/test/file.txt'
			const content = 'file content'
			const buffer = Buffer.from(content)
			vi.mocked(vscode.workspace.fs.readFile).mockResolvedValue(buffer)

			// Act
			const result = await adapter.readFile(path)

			// Assert
			expect(result).toBe(content)
			expect(vscode.Uri.file).toHaveBeenCalledWith(path)
			expect(vscode.workspace.fs.readFile).toHaveBeenCalledWith({ fsPath: path })
		})
	})

	describe('writeFile', () => {
		it('should write file content', async () => {
			// Arrange
			const path = '/test/file.txt'
			const content = 'file content'
			vi.mocked(vscode.workspace.fs.writeFile).mockResolvedValue(undefined)

			// Act
			await adapter.writeFile(path, content)

			// Assert
			expect(vscode.Uri.file).toHaveBeenCalledWith(path)
			expect(vscode.workspace.fs.writeFile).toHaveBeenCalledWith(
				{ fsPath: path },
				Buffer.from(content)
			)
		})
	})

	describe('stat', () => {
		it('should return file stats', async () => {
			// Arrange
			const path = '/test/file.txt'
			vi.mocked(vscode.workspace.fs.stat).mockResolvedValue({ type: vscode.FileType.File })

			// Act
			const result = await adapter.stat(path)

			// Assert
			expect(result.type).toBe('file')
			expect(vscode.Uri.file).toHaveBeenCalledWith(path)
			expect(vscode.workspace.fs.stat).toHaveBeenCalledWith({ fsPath: path })
		})

		it('should return directory stats', async () => {
			// Arrange
			const path = '/test/directory'
			vi.mocked(vscode.workspace.fs.stat).mockResolvedValue({ type: vscode.FileType.Directory })

			// Act
			const result = await adapter.stat(path)

			// Assert
			expect(result.type).toBe('directory')
		})
	})

	describe('copyFile', () => {
		it('should copy file', async () => {
			// Arrange
			const source = '/test/source.txt'
			const destination = '/test/destination.txt'
			vi.mocked(vscode.workspace.fs.copy).mockResolvedValue(undefined)

			// Act
			await adapter.copyFile(source, destination)

			// Assert
			expect(vscode.Uri.file).toHaveBeenCalledWith(source)
			expect(vscode.Uri.file).toHaveBeenCalledWith(destination)
			expect(vscode.workspace.fs.copy).toHaveBeenCalledWith(
				{ fsPath: source },
				{ fsPath: destination }
			)
		})
	})
}) 