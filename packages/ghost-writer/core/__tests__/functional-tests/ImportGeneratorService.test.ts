import { vi, describe, it, expect, beforeEach } from 'vitest'
import { ImportGeneratorService } from '../../src/services/ImportGenerator.service.js'
import type { StoredFragment } from '../../src/_interfaces/IClipboardService.js'
import {
    createMockTestEnvironment,
    resetAllMocks
} from '../__mocks__/helpers'
import {
    setupImportGeneratorSuccessScenario,
    setupImportGeneratorFailureScenario,
    setupCommonUtilsScenario,
    createGhostWriterMockBuilder
} from '../__mocks__/mock-scenario-builder'

describe('ImportGeneratorService', () => {
    let importGeneratorService: ImportGeneratorService
    let mocks: ReturnType<typeof createMockTestEnvironment>

    beforeEach(() => {
        mocks = createMockTestEnvironment()
        importGeneratorService = new ImportGeneratorService(mocks.pathUtils, mocks.commonUtils)
        resetAllMocks(mocks)
    })

    describe('generate', () => {
        it('should generate import statement for valid paths', () => {
            // Arrange
            const fragment: StoredFragment = {
                text: 'MyComponent',
                sourceFilePath: '/path/to/component.ts',
            }
            const currentFilePath = '/path/to/main.ts'
            const expectedImport = "import { MyComponent } from './component.js'\n"

            setupImportGeneratorSuccessScenario(mocks, {
                currentFilePath,
                fragment,
                expectedImport
            })

            // Act
            const result = importGeneratorService.generate(currentFilePath, fragment)

            // Assert
            expect(result).toBe(expectedImport)
            expect(mocks.pathUtils.getDottedPath).toHaveBeenCalledWith(fragment.sourceFilePath, currentFilePath)
        })

        it('should generate import statement for nested paths', () => {
            // Arrange
            const fragment: StoredFragment = {
                text: 'Helper',
                sourceFilePath: '/path/to/utils/helper.ts',
            }
            const currentFilePath = '/path/to/main.ts'
            const expectedImport = "import { Helper } from './utils/helper.js'\n"

            setupImportGeneratorSuccessScenario(mocks, {
                currentFilePath,
                fragment,
                expectedImport
            })

            // Act
            const result = importGeneratorService.generate(currentFilePath, fragment)

            // Assert
            expect(result).toBe(expectedImport)
        })

        it('should return undefined when path cannot be determined', () => {
            // Arrange
            const fragment: StoredFragment = {
                text: 'UnknownComponent',
                sourceFilePath: '/unknown/path.ts',
            }
            const currentFilePath = '/path/to/main.ts'

            setupImportGeneratorFailureScenario(mocks, {
                currentFilePath,
                fragment
            })

            // Act
            const result = importGeneratorService.generate(currentFilePath, fragment)

            // Assert
            expect(result).toBeUndefined()
            expect(mocks.commonUtils.errMsg).toHaveBeenCalledWith('Could not determine relative path for import.')
        })

        it('should handle different file extensions', () => {
            // Arrange
            const fragment: StoredFragment = {
                text: 'Component',
                sourceFilePath: '/path/to/component.tsx',
            }
            const currentFilePath = '/path/to/main.ts'
            const expectedImport = "import { Component } from './component.js'\n"

            setupImportGeneratorSuccessScenario(mocks, {
                currentFilePath,
                fragment,
                expectedImport
            })

            // Act
            const result = importGeneratorService.generate(currentFilePath, fragment)

            // Assert
            expect(result).toBe(expectedImport)
        })

        it('should handle complex component names', () => {
            // Arrange
            const fragment: StoredFragment = {
                text: 'MyComplexComponent',
                sourceFilePath: '/path/to/component.ts',
            }
            const currentFilePath = '/path/to/main.ts'
            const expectedImport = "import { MyComplexComponent } from './component.js'\n"

            setupImportGeneratorSuccessScenario(mocks, {
                currentFilePath,
                fragment,
                expectedImport
            })

            // Act
            const result = importGeneratorService.generate(currentFilePath, fragment)

            // Assert
            expect(result).toBe(expectedImport)
        })
    })

    describe('integration', () => {
        it('should handle multiple imports from same source', () => {
            // Arrange
            const fragment1: StoredFragment = {
                text: 'ComponentA',
                sourceFilePath: '/path/to/component.ts',
            }
            const fragment2: StoredFragment = {
                text: 'ComponentB',
                sourceFilePath: '/path/to/component.ts',
            }
            const currentFilePath = '/path/to/main.ts'

            // Setup mock to handle multiple calls
            mocks.pathUtils.getDottedPath = vi.fn().mockReturnValue('./component')
            setupCommonUtilsScenario(mocks)

            // Act
            const result1 = importGeneratorService.generate(currentFilePath, fragment1)
            const result2 = importGeneratorService.generate(currentFilePath, fragment2)

            // Assert
            expect(result1).toBe("import { ComponentA } from './component.js'\n")
            expect(result2).toBe("import { ComponentB } from './component.js'\n")
            expect(mocks.pathUtils.getDottedPath).toHaveBeenCalledTimes(2)
        })

        it('should handle error scenarios gracefully', () => {
            // Arrange
            const fragment: StoredFragment = {
                text: 'Component',
                sourceFilePath: '/invalid/path.ts',
            }
            const currentFilePath = '/path/to/main.ts'

            setupImportGeneratorFailureScenario(mocks, {
                currentFilePath,
                fragment
            })

            // Act
            const result = importGeneratorService.generate(currentFilePath, fragment)

            // Assert
            expect(result).toBeUndefined()
            expect(mocks.commonUtils.errMsg).toHaveBeenCalledWith('Could not determine relative path for import.')
        })
    })
})
