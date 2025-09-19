import { describe, it, expect, beforeEach, vi } from 'vitest'
import { FileSystemAdapter } from '../../src/adapters/FileSystem.adapter'
import { Buffer } from 'node:buffer'
import * as vscode from 'vscode'
import {
    setupTestEnvironment,
    resetAllMocks,
    setupVSCodeMocks
} from '../__mocks__/helpers'
import {
    setupVSCodeFileReadScenario,
    setupVSCodeFileWriteScenario,
    setupVSCodeFileStatScenario,
    setupVSCodeFileCopyScenario,
    createExtensionMockBuilder
} from '../__mocks__/mock-scenario-builder'

describe('FileSystemAdapter', () => {
    let adapter: FileSystemAdapter
    let mocks: ReturnType<typeof setupTestEnvironment>

    beforeEach(() => {
        mocks = setupTestEnvironment()
        setupVSCodeMocks(mocks)
        adapter = new FileSystemAdapter()
        resetAllMocks(mocks)
    })

    describe('readFile', () => {
        it('should read file content', async () => {
            // Arrange
            const path = '/test/file.txt'
            const content = 'file content'

            setupVSCodeFileReadScenario(mocks, { filePath: path, content })

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

            setupVSCodeFileWriteScenario(mocks, { filePath: path, content })

            // Act
            await adapter.writeFile(path, content)

            // Assert
            expect(vscode.Uri.file).toHaveBeenCalledWith(path)
            expect(vscode.workspace.fs.writeFile).toHaveBeenCalledWith(
                { fsPath: path },
                Buffer.from(content),
            )
        })
    })

    describe('stat', () => {
        it('should return file stats', async () => {
            // Arrange
            const path = '/test/file.txt'

            setupVSCodeFileStatScenario(mocks, { filePath: path, fileType: 'file' })

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

            setupVSCodeFileStatScenario(mocks, { filePath: path, fileType: 'directory' })

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

            setupVSCodeFileCopyScenario(mocks, source, destination)

            // Act
            await adapter.copyFile(source, destination)

            // Assert
            expect(vscode.Uri.file).toHaveBeenCalledWith(source)
            expect(vscode.Uri.file).toHaveBeenCalledWith(destination)
            expect(vscode.workspace.fs.copy).toHaveBeenCalledWith(
                { fsPath: source },
                { fsPath: destination },
            )
        })
    })
})
