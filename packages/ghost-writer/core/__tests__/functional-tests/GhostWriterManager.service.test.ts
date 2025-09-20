import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GhostWriterManagerService } from '../../src/services/GhostWriterManager.service.js'
import type {
    IGhostWriterDependencies,
    ConsoleLoggerGenerateOptions,
    StoredFragment,
    ConsoleLoggerResult
} from '../../src/_interfaces/IGhostWriterManagerService.js'
import { ERROR_MESSAGES } from '../../src/_config/constants.js'

// Mock dependencies
class MockClipboardService {

    store = vi.fn()
    retrieve = vi.fn()
    clear = vi.fn()

}

class MockConsoleLoggerService {

    generate = vi.fn()

}

class MockImportGeneratorService {

    generate = vi.fn()

}

describe('GhostWriterManagerService', () => {
    let service: GhostWriterManagerService
    let mocks: {
        clipboard: MockClipboardService
        consoleLogger: MockConsoleLoggerService
        importGenerator: MockImportGeneratorService
        dependencies: IGhostWriterDependencies
    }

    beforeEach(() => {
        const clipboard = new MockClipboardService()
        const consoleLogger = new MockConsoleLoggerService()
        const importGenerator = new MockImportGeneratorService()
		
        mocks = {
            clipboard,
            consoleLogger,
            importGenerator,
            dependencies: {
                clipboard: clipboard as any,
                consoleLogger: consoleLogger as any,
                importGenerator: importGenerator as any
            }
        }
        service = new GhostWriterManagerService(mocks.dependencies)
    })

    describe('generateConsoleLog', () => {
        it('should generate console log successfully', () => {
            // Arrange
            const options: ConsoleLoggerGenerateOptions = {
                documentContent: 'function test() { const myVar = "test"; }',
                fileName: 'test.ts',
                selectedVar: 'myVar',
                selectionLine: 1,
                includeClassName: false,
                includeFunctionName: true
            }
            const expectedResult: ConsoleLoggerResult = {
                logStatement: 'console.log(\'test -> myVar:\', myVar);\n',
                insertLine: 2
            }

            mocks.consoleLogger.generate.mockReturnValue(expectedResult)

            // Act
            const result = service.generateConsoleLog(options)

            // Assert
            expect(result).toEqual(expectedResult)
            expect(mocks.consoleLogger.generate).toHaveBeenCalledWith(options)
        })

        it('should throw error when console logger returns undefined', () => {
            // Arrange
            const options: ConsoleLoggerGenerateOptions = {
                documentContent: 'function test() { const myVar = "test"; }',
                fileName: 'test.ts',
                selectedVar: 'myVar',
                selectionLine: 1,
                includeClassName: false,
                includeFunctionName: true
            }

            mocks.consoleLogger.generate.mockReturnValue(undefined)

            // Act & Assert
            expect(() => service.generateConsoleLog(options))
                .toThrow(ERROR_MESSAGES.CONSOLE_LOG_GENERATION_FAILED)
        })

        it('should throw error when console logger throws', () => {
            // Arrange
            const options: ConsoleLoggerGenerateOptions = {
                documentContent: 'function test() { const myVar = "test"; }',
                fileName: 'test.ts',
                selectedVar: 'myVar',
                selectionLine: 1,
                includeClassName: false,
                includeFunctionName: true
            }
            const consoleLoggerError = new Error('Console logger failed')

            mocks.consoleLogger.generate.mockImplementation(() => {
                throw consoleLoggerError
            })

            // Act & Assert
            expect(() => service.generateConsoleLog(options))
                .toThrow(`${ERROR_MESSAGES.CONSOLE_LOG_GENERATION_FAILED}: ${consoleLoggerError.message}`)
        })

        it('should validate required parameters', () => {
            // Act & Assert
            expect(() => service.generateConsoleLog(null as any))
                .toThrow(ERROR_MESSAGES.MISSING_REQUIRED_PARAMETER)

            expect(() => service.generateConsoleLog(undefined as any))
                .toThrow(ERROR_MESSAGES.MISSING_REQUIRED_PARAMETER)
        })

        it('should validate selectedVar parameter', () => {
            // Arrange
            const options: ConsoleLoggerGenerateOptions = {
                documentContent: 'function test() { const myVar = "test"; }',
                fileName: 'test.ts',
                selectedVar: '',
                selectionLine: 1,
                includeClassName: false,
                includeFunctionName: true
            }

            // Act & Assert
            expect(() => service.generateConsoleLog(options))
                .toThrow(ERROR_MESSAGES.INVALID_INPUT)

            // Test whitespace-only
            options.selectedVar = '   '
            expect(() => service.generateConsoleLog(options))
                .toThrow(ERROR_MESSAGES.INVALID_INPUT)
        })

        it('should validate fileName parameter', () => {
            // Arrange
            const options: ConsoleLoggerGenerateOptions = {
                documentContent: 'function test() { const myVar = "test"; }',
                fileName: '',
                selectedVar: 'myVar',
                selectionLine: 1,
                includeClassName: false,
                includeFunctionName: true
            }

            // Act & Assert
            expect(() => service.generateConsoleLog(options))
                .toThrow(ERROR_MESSAGES.INVALID_FILE_PATH)

            // Test whitespace-only
            options.fileName = '   '
            expect(() => service.generateConsoleLog(options))
                .toThrow(ERROR_MESSAGES.INVALID_FILE_PATH)
        })

        it('should validate selectionLine parameter', () => {
            // Arrange
            const options: ConsoleLoggerGenerateOptions = {
                documentContent: 'function test() { const myVar = "test"; }',
                fileName: 'test.ts',
                selectedVar: 'myVar',
                selectionLine: -1,
                includeClassName: false,
                includeFunctionName: true
            }

            // Act & Assert
            expect(() => service.generateConsoleLog(options))
                .toThrow(ERROR_MESSAGES.INVALID_INPUT)

            // Test non-number
            options.selectionLine = 'invalid' as any
            expect(() => service.generateConsoleLog(options))
                .toThrow(ERROR_MESSAGES.INVALID_INPUT)
        })
    })

    describe('storeFragment', () => {
        it('should store fragment successfully', async () => {
            // Arrange
            const fragment: StoredFragment = {
                text: 'MyComponent',
                sourceFilePath: '/path/to/component.ts'
            }

            mocks.clipboard.store.mockResolvedValue(undefined)

            // Act
            await service.storeFragment(fragment)

            // Assert
            expect(mocks.clipboard.store).toHaveBeenCalledWith(fragment)
        })

        it('should throw error when clipboard store fails', async () => {
            // Arrange
            const fragment: StoredFragment = {
                text: 'MyComponent',
                sourceFilePath: '/path/to/component.ts'
            }
            const clipboardError = new Error('Storage failed')

            mocks.clipboard.store.mockRejectedValue(clipboardError)

            // Act & Assert
            await expect(service.storeFragment(fragment))
                .rejects.toThrow(`${ERROR_MESSAGES.STORAGE_OPERATION_FAILED}: ${clipboardError.message}`)
        })

        it('should validate fragment parameter', async () => {
            // Act & Assert
            await expect(service.storeFragment(null as any))
                .rejects.toThrow(ERROR_MESSAGES.MISSING_REQUIRED_PARAMETER)

            await expect(service.storeFragment(undefined as any))
                .rejects.toThrow(ERROR_MESSAGES.MISSING_REQUIRED_PARAMETER)
        })

        it('should validate fragment text', async () => {
            // Arrange
            const fragment: StoredFragment = {
                text: '',
                sourceFilePath: '/path/to/component.ts'
            }

            // Act & Assert
            await expect(service.storeFragment(fragment))
                .rejects.toThrow(ERROR_MESSAGES.INVALID_INPUT)

            // Test whitespace-only
            fragment.text = '   '
            await expect(service.storeFragment(fragment))
                .rejects.toThrow(ERROR_MESSAGES.INVALID_INPUT)
        })

        it('should validate fragment sourceFilePath', async () => {
            // Arrange
            const fragment: StoredFragment = {
                text: 'MyComponent',
                sourceFilePath: ''
            }

            // Act & Assert
            await expect(service.storeFragment(fragment))
                .rejects.toThrow(ERROR_MESSAGES.INVALID_FILE_PATH)

            // Test whitespace-only
            fragment.sourceFilePath = '   '
            await expect(service.storeFragment(fragment))
                .rejects.toThrow(ERROR_MESSAGES.INVALID_FILE_PATH)
        })
    })

    describe('retrieveFragment', () => {
        it('should retrieve fragment successfully', async () => {
            // Arrange
            const fragment: StoredFragment = {
                text: 'MyComponent',
                sourceFilePath: '/path/to/component.ts'
            }

            mocks.clipboard.retrieve.mockResolvedValue(fragment)

            // Act
            const result = await service.retrieveFragment()

            // Assert
            expect(result).toEqual(fragment)
            expect(mocks.clipboard.retrieve).toHaveBeenCalled()
        })

        it('should return undefined when no fragment stored', async () => {
            // Arrange
            mocks.clipboard.retrieve.mockResolvedValue(undefined)

            // Act
            const result = await service.retrieveFragment()

            // Assert
            expect(result).toBeUndefined()
        })

        it('should throw error when clipboard retrieve fails', async () => {
            // Arrange
            const clipboardError = new Error('Retrieve failed')

            mocks.clipboard.retrieve.mockRejectedValue(clipboardError)

            // Act & Assert
            await expect(service.retrieveFragment())
                .rejects.toThrow(`${ERROR_MESSAGES.STORAGE_OPERATION_FAILED}: ${clipboardError.message}`)
        })
    })

    describe('clearFragment', () => {
        it('should clear fragment successfully', async () => {
            // Arrange
            mocks.clipboard.clear.mockResolvedValue(undefined)

            // Act
            await service.clearFragment()

            // Assert
            expect(mocks.clipboard.clear).toHaveBeenCalled()
        })

        it('should throw error when clipboard clear fails', async () => {
            // Arrange
            const clipboardError = new Error('Clear failed')

            mocks.clipboard.clear.mockRejectedValue(clipboardError)

            // Act & Assert
            await expect(service.clearFragment())
                .rejects.toThrow(`${ERROR_MESSAGES.STORAGE_OPERATION_FAILED}: ${clipboardError.message}`)
        })
    })

    describe('generateImport', () => {
        it('should generate import successfully', () => {
            // Arrange
            const currentFilePath = '/path/to/main.ts'
            const fragment: StoredFragment = {
                text: 'MyComponent',
                sourceFilePath: '/path/to/component.ts'
            }
            const expectedImport = "import { MyComponent } from './component.js'\n"

            mocks.importGenerator.generate.mockReturnValue(expectedImport)

            // Act
            const result = service.generateImport(currentFilePath, fragment)

            // Assert
            expect(result).toBe(expectedImport)
            expect(mocks.importGenerator.generate).toHaveBeenCalledWith(currentFilePath, fragment)
        })

        it('should throw error when import generator returns undefined', () => {
            // Arrange
            const currentFilePath = '/path/to/main.ts'
            const fragment: StoredFragment = {
                text: 'MyComponent',
                sourceFilePath: '/path/to/component.ts'
            }

            mocks.importGenerator.generate.mockReturnValue(undefined)

            // Act & Assert
            expect(() => service.generateImport(currentFilePath, fragment))
                .toThrow(ERROR_MESSAGES.IMPORT_GENERATION_FAILED)
        })

        it('should throw error when import generator throws', () => {
            // Arrange
            const currentFilePath = '/path/to/main.ts'
            const fragment: StoredFragment = {
                text: 'MyComponent',
                sourceFilePath: '/path/to/component.ts'
            }
            const importGeneratorError = new Error('Import generation failed')

            mocks.importGenerator.generate.mockImplementation(() => {
                throw importGeneratorError
            })

            // Act & Assert
            expect(() => service.generateImport(currentFilePath, fragment))
                .toThrow(`${ERROR_MESSAGES.IMPORT_GENERATION_FAILED}: ${importGeneratorError.message}`)
        })

        it('should validate currentFilePath parameter', () => {
            // Arrange
            const fragment: StoredFragment = {
                text: 'MyComponent',
                sourceFilePath: '/path/to/component.ts'
            }

            // Act & Assert
            expect(() => service.generateImport('', fragment))
                .toThrow(ERROR_MESSAGES.INVALID_FILE_PATH)

            expect(() => service.generateImport('   ', fragment))
                .toThrow(ERROR_MESSAGES.INVALID_FILE_PATH)
        })
    })

    describe('generateAndStoreConsoleLog', () => {
        it('should generate and store console log successfully', async () => {
            // Arrange
            const options: ConsoleLoggerGenerateOptions = {
                documentContent: 'function test() { const myVar = "test"; }',
                fileName: 'test.ts',
                selectedVar: 'myVar',
                selectionLine: 1,
                includeClassName: false,
                includeFunctionName: true
            }
            const consoleLogResult: ConsoleLoggerResult = {
                logStatement: 'console.log(\'test -> myVar:\', myVar);\n',
                insertLine: 2
            }

            mocks.consoleLogger.generate.mockReturnValue(consoleLogResult)
            mocks.clipboard.store.mockResolvedValue(undefined)

            // Act
            const result = await service.generateAndStoreConsoleLog(options)

            // Assert
            expect(result).toEqual(consoleLogResult)
            expect(mocks.consoleLogger.generate).toHaveBeenCalledWith(options)
            expect(mocks.clipboard.store).toHaveBeenCalledWith({
                text: options.selectedVar,
                sourceFilePath: options.fileName,
                timestamp: expect.any(String),
                metadata: {
                    lineNumber: options.selectionLine,
                    includeClassName: options.includeClassName,
                    includeFunctionName: options.includeFunctionName,
                    logStatement: consoleLogResult.logStatement,
                    insertLine: consoleLogResult.insertLine
                }
            })
        })

        it('should throw error when console log generation fails', async () => {
            // Arrange
            const options: ConsoleLoggerGenerateOptions = {
                documentContent: 'function test() { const myVar = "test"; }',
                fileName: 'test.ts',
                selectedVar: 'myVar',
                selectionLine: 1,
                includeClassName: false,
                includeFunctionName: true
            }

            mocks.consoleLogger.generate.mockReturnValue(undefined)

            // Act & Assert
            await expect(service.generateAndStoreConsoleLog(options))
                .rejects.toThrow('Failed to generate and store console log: Failed to generate console log statement: Failed to generate console log statement')
        })

        it('should throw error when storage fails', async () => {
            // Arrange
            const options: ConsoleLoggerGenerateOptions = {
                documentContent: 'function test() { const myVar = "test"; }',
                fileName: 'test.ts',
                selectedVar: 'myVar',
                selectionLine: 1,
                includeClassName: false,
                includeFunctionName: true
            }
            const consoleLogResult: ConsoleLoggerResult = {
                logStatement: 'console.log(\'test -> myVar:\', myVar);\n',
                insertLine: 2
            }
            const storageError = new Error('Storage failed')

            mocks.consoleLogger.generate.mockReturnValue(consoleLogResult)
            mocks.clipboard.store.mockRejectedValue(storageError)

            // Act & Assert
            await expect(service.generateAndStoreConsoleLog(options))
                .rejects.toThrow(`Failed to generate and store console log: ${ERROR_MESSAGES.STORAGE_OPERATION_FAILED}: ${storageError.message}`)
        })
    })

    describe('retrieveAndGenerateImport', () => {
        it('should retrieve and generate import successfully', async () => {
            // Arrange
            const currentFilePath = '/path/to/main.ts'
            const fragment: StoredFragment = {
                text: 'MyComponent',
                sourceFilePath: '/path/to/component.ts'
            }
            const expectedImport = "import { MyComponent } from './component.js'\n"

            mocks.clipboard.retrieve.mockResolvedValue(fragment)
            mocks.importGenerator.generate.mockReturnValue(expectedImport)

            // Act
            const result = await service.retrieveAndGenerateImport(currentFilePath)

            // Assert
            expect(result).toBe(expectedImport)
            expect(mocks.clipboard.retrieve).toHaveBeenCalled()
            expect(mocks.importGenerator.generate).toHaveBeenCalledWith(currentFilePath, fragment)
        })

        it('should throw error when no fragment is stored', async () => {
            // Arrange
            const currentFilePath = '/path/to/main.ts'

            mocks.clipboard.retrieve.mockResolvedValue(undefined)

            // Act & Assert
            await expect(service.retrieveAndGenerateImport(currentFilePath))
                .rejects.toThrow(`Failed to retrieve and generate import: ${ERROR_MESSAGES.FRAGMENT_NOT_FOUND}`)
        })

        it('should throw error when import generation fails', async () => {
            // Arrange
            const currentFilePath = '/path/to/main.ts'
            const fragment: StoredFragment = {
                text: 'MyComponent',
                sourceFilePath: '/path/to/component.ts'
            }

            mocks.clipboard.retrieve.mockResolvedValue(fragment)
            mocks.importGenerator.generate.mockReturnValue(undefined)

            // Act & Assert
            await expect(service.retrieveAndGenerateImport(currentFilePath))
                .rejects.toThrow(`Failed to retrieve and generate import: ${ERROR_MESSAGES.IMPORT_GENERATION_FAILED}`)
        })

        it('should throw error when retrieval fails', async () => {
            // Arrange
            const currentFilePath = '/path/to/main.ts'
            const retrievalError = new Error('Retrieval failed')

            mocks.clipboard.retrieve.mockRejectedValue(retrievalError)

            // Act & Assert
            await expect(service.retrieveAndGenerateImport(currentFilePath))
                .rejects.toThrow(`Failed to retrieve and generate import: ${ERROR_MESSAGES.STORAGE_OPERATION_FAILED}: ${retrievalError.message}`)
        })
    })

    describe('completeCodeGenerationWorkflow', () => {
        it('should complete full workflow successfully', async () => {
            // Arrange
            const consoleLogOptions: ConsoleLoggerGenerateOptions = {
                documentContent: 'function test() { const myVar = "test"; }',
                fileName: 'test.ts',
                selectedVar: 'myVar',
                selectionLine: 1,
                includeClassName: false,
                includeFunctionName: true
            }
            const currentFilePath = '/path/to/main.ts'
            const consoleLogResult: ConsoleLoggerResult = {
                logStatement: 'console.log(\'test -> myVar:\', myVar);\n',
                insertLine: 2
            }
            const expectedImport = "import { myVar } from './test.js'\n"

            mocks.consoleLogger.generate.mockReturnValue(consoleLogResult)
            mocks.clipboard.store.mockResolvedValue(undefined)
            mocks.clipboard.retrieve.mockResolvedValue({
                text: 'myVar',
                sourceFilePath: 'test.ts'
            })
            mocks.importGenerator.generate.mockReturnValue(expectedImport)

            // Act
            const result = await service.completeCodeGenerationWorkflow(consoleLogOptions, currentFilePath)

            // Assert
            expect(result).toEqual({
                consoleLog: consoleLogResult,
                importStatement: expectedImport
            })
            expect(mocks.consoleLogger.generate).toHaveBeenCalledWith(consoleLogOptions)
            expect(mocks.clipboard.store).toHaveBeenCalled()
            expect(mocks.clipboard.retrieve).toHaveBeenCalled()
            expect(mocks.importGenerator.generate).toHaveBeenCalledWith(currentFilePath, {
                text: 'myVar',
                sourceFilePath: 'test.ts'
            })
        })

        it('should throw error when console log generation fails', async () => {
            // Arrange
            const consoleLogOptions: ConsoleLoggerGenerateOptions = {
                documentContent: 'function test() { const myVar = "test"; }',
                fileName: 'test.ts',
                selectedVar: 'myVar',
                selectionLine: 1,
                includeClassName: false,
                includeFunctionName: true
            }
            const currentFilePath = '/path/to/main.ts'

            mocks.consoleLogger.generate.mockReturnValue(undefined)

            // Act & Assert
            await expect(service.completeCodeGenerationWorkflow(consoleLogOptions, currentFilePath))
                .rejects.toThrow('Complete code generation workflow failed: Failed to generate and store console log: Failed to generate console log statement: Failed to generate console log statement')
        })

        it('should throw error when import generation fails', async () => {
            // Arrange
            const consoleLogOptions: ConsoleLoggerGenerateOptions = {
                documentContent: 'function test() { const myVar = "test"; }',
                fileName: 'test.ts',
                selectedVar: 'myVar',
                selectionLine: 1,
                includeClassName: false,
                includeFunctionName: true
            }
            const currentFilePath = '/path/to/main.ts'
            const consoleLogResult: ConsoleLoggerResult = {
                logStatement: 'console.log(\'test -> myVar:\', myVar);\n',
                insertLine: 2
            }

            mocks.consoleLogger.generate.mockReturnValue(consoleLogResult)
            mocks.clipboard.store.mockResolvedValue(undefined)
            mocks.clipboard.retrieve.mockResolvedValue(undefined)

            // Act & Assert
            await expect(service.completeCodeGenerationWorkflow(consoleLogOptions, currentFilePath))
                .rejects.toThrow('Complete code generation workflow failed: Failed to retrieve and generate import: No stored fragment found')
        })
    })

    describe('Complex Error Scenarios', () => {
        it('should handle multiple service failures gracefully', async () => {
            // Arrange
            const options: ConsoleLoggerGenerateOptions = {
                documentContent: 'function test() { const myVar = "test"; }',
                fileName: 'test.ts',
                selectedVar: 'myVar',
                selectionLine: 1,
                includeClassName: false,
                includeFunctionName: true
            }

            mocks.consoleLogger.generate.mockImplementation(() => {
                throw new Error('Console logger service unavailable')
            })

            // Act & Assert
            expect(() => service.generateConsoleLog(options))
                .toThrow('Failed to generate console log statement: Console logger service unavailable')
        })

        it('should handle concurrent operations', async () => {
            // Arrange
            const fragment1: StoredFragment = {
                text: 'Component1',
                sourceFilePath: '/path/to/component1.ts'
            }
            const fragment2: StoredFragment = {
                text: 'Component2',
                sourceFilePath: '/path/to/component2.ts'
            }

            mocks.clipboard.store.mockResolvedValue(undefined)

            // Act
            const promises = [
                service.storeFragment(fragment1),
                service.storeFragment(fragment2)
            ]

            await Promise.all(promises)

            // Assert
            expect(mocks.clipboard.store).toHaveBeenCalledTimes(2)
            expect(mocks.clipboard.store).toHaveBeenCalledWith(fragment1)
            expect(mocks.clipboard.store).toHaveBeenCalledWith(fragment2)
        })

        it('should handle service timeout scenarios', async () => {
            // Arrange
            const fragment: StoredFragment = {
                text: 'MyComponent',
                sourceFilePath: '/path/to/component.ts'
            }

            mocks.clipboard.store.mockImplementation(() =>
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Service timeout')), 100)))

            // Act & Assert
            await expect(service.storeFragment(fragment))
                .rejects.toThrow('Storage operation failed: Service timeout')
        })
    })

    describe('Edge Cases and Boundary Conditions', () => {
        it('should handle very long variable names', () => {
            // Arrange
            const longVarName = 'a'.repeat(1000)
            const options: ConsoleLoggerGenerateOptions = {
                documentContent: `function test() { const ${longVarName} = "test"; }`,
                fileName: 'test.ts',
                selectedVar: longVarName,
                selectionLine: 1,
                includeClassName: false,
                includeFunctionName: true
            }
            const expectedResult: ConsoleLoggerResult = {
                logStatement: `console.log('test -> ${longVarName}:', ${longVarName});\n`,
                insertLine: 2
            }

            mocks.consoleLogger.generate.mockReturnValue(expectedResult)

            // Act
            const result = service.generateConsoleLog(options)

            // Assert
            expect(result).toEqual(expectedResult)
        })

        it('should handle special characters in file paths', async () => {
            // Arrange
            const fragment: StoredFragment = {
                text: 'MyComponent',
                sourceFilePath: '/path/with spaces & special-chars/component.ts'
            }

            mocks.clipboard.store.mockResolvedValue(undefined)

            // Act
            await service.storeFragment(fragment)

            // Assert
            expect(mocks.clipboard.store).toHaveBeenCalledWith(fragment)
        })

        it('should handle Unicode characters', () => {
            // Arrange
            const options: ConsoleLoggerGenerateOptions = {
                documentContent: 'function test() { const 变量 = "测试"; }',
                fileName: '测试.ts',
                selectedVar: '变量',
                selectionLine: 1,
                includeClassName: false,
                includeFunctionName: true
            }
            const expectedResult: ConsoleLoggerResult = {
                logStatement: 'console.log(\'test -> 变量:\', 变量);\n',
                insertLine: 2
            }

            mocks.consoleLogger.generate.mockReturnValue(expectedResult)

            // Act
            const result = service.generateConsoleLog(options)

            // Assert
            expect(result).toEqual(expectedResult)
        })

        it('should handle zero line numbers', () => {
            // Arrange
            const options: ConsoleLoggerGenerateOptions = {
                documentContent: 'const myVar = "test";',
                fileName: 'test.ts',
                selectedVar: 'myVar',
                selectionLine: 0,
                includeClassName: false,
                includeFunctionName: false
            }
            const expectedResult: ConsoleLoggerResult = {
                logStatement: 'console.log(\'myVar:\', myVar);\n',
                insertLine: 1
            }

            mocks.consoleLogger.generate.mockReturnValue(expectedResult)

            // Act
            const result = service.generateConsoleLog(options)

            // Assert
            expect(result).toEqual(expectedResult)
        })
    })
})
