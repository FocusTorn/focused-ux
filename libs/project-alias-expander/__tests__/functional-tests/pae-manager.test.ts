import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PAEManagerService } from '../../src/services/PAEManager.service.js'
import type { IPAEDependencies } from '../../src/_types/index.js'

// Mock the individual services
const mockExpandableProcessor = {
    expandTemplate: vi.fn(),
    detectShellType: vi.fn(),
    processTemplateArray: vi.fn(),
    processShellSpecificTemplate: vi.fn(),
    parseExpandableFlag: vi.fn(),
    expandFlags: vi.fn(),
    constructWrappedCommand: vi.fn()
}

const mockCommandExecution = {
    runNx: vi.fn(),
    runCommand: vi.fn(),
    runMany: vi.fn()
}

const mockAliasManager = {
    generateLocalFiles: vi.fn(),
    installAliases: vi.fn(),
    refreshAliases: vi.fn(),
    refreshAliasesDirect: vi.fn()
}

describe('PAEManagerService', () => {
    let service: PAEManagerService
    let dependencies: IPAEDependencies

    beforeEach(() => {
        dependencies = {
            expandableProcessor: mockExpandableProcessor,
            commandExecution: mockCommandExecution,
            aliasManager: mockAliasManager
        }
        service = new PAEManagerService(dependencies)
        
        // Reset all mocks
        vi.clearAllMocks()
    })

    describe('Alias Management Operations', () => {
        it('should delegate generateLocalFiles to AliasManagerService', () => {
            // Act
            service.generateLocalFiles()

            // Assert
            expect(mockAliasManager.generateLocalFiles).toHaveBeenCalledTimes(1)
        })

        it('should delegate installAliases to AliasManagerService', () => {
            // Act
            service.installAliases()

            // Assert
            expect(mockAliasManager.installAliases).toHaveBeenCalledTimes(1)
        })

        it('should delegate refreshAliases to AliasManagerService', () => {
            // Act
            service.refreshAliases()

            // Assert
            expect(mockAliasManager.refreshAliases).toHaveBeenCalledTimes(1)
        })

        it('should delegate refreshAliasesDirect to AliasManagerService', () => {
            // Act
            service.refreshAliasesDirect()

            // Assert
            expect(mockAliasManager.refreshAliasesDirect).toHaveBeenCalledTimes(1)
        })
    })

    describe('Command Execution Operations', () => {
        it('should delegate runNx to CommandExecutionService', async () => {
            // Arrange
            const argv = ['nx', 'run', 'test']
            mockCommandExecution.runNx.mockResolvedValue(0)

            // Act
            const result = await service.runNx(argv)

            // Assert
            expect(mockCommandExecution.runNx).toHaveBeenCalledWith(argv)
            expect(result).toBe(0)
        })

        it('should delegate runCommand to CommandExecutionService', async () => {
            // Arrange
            const command = 'npm'
            const args = ['run', 'test']
            mockCommandExecution.runCommand.mockResolvedValue(0)

            // Act
            const result = await service.runCommand(command, args)

            // Assert
            expect(mockCommandExecution.runCommand).toHaveBeenCalledWith(command, args)
            expect(result).toBe(0)
        })

        it('should delegate runMany to CommandExecutionService', async () => {
            // Arrange
            const runType = 'core' as const
            const targets = ['build', 'test']
            const flags = ['--verbose']
            const config = { 'nxPackages': {} }
            mockCommandExecution.runMany.mockResolvedValue(0)

            // Act
            const result = await service.runMany(runType, targets, flags, config)

            // Assert
            expect(mockCommandExecution.runMany).toHaveBeenCalledWith(runType, targets, flags, config)
            expect(result).toBe(0)
        })
    })

    describe('Expandable Processing Operations', () => {
        it('should delegate expandTemplate to ExpandableProcessorService', () => {
            // Arrange
            const template = 'timeout {duration}s'
            const variables = { duration: '10' }
            mockExpandableProcessor.expandTemplate.mockReturnValue('timeout 10s')

            // Act
            const result = service.expandTemplate(template, variables)

            // Assert
            expect(mockExpandableProcessor.expandTemplate).toHaveBeenCalledWith(template, variables)
            expect(result).toBe('timeout 10s')
        })

        it('should delegate detectShellType to ExpandableProcessorService', () => {
            // Arrange
            mockExpandableProcessor.detectShellType.mockReturnValue('pwsh')

            // Act
            const result = service.detectShellType()

            // Assert
            expect(mockExpandableProcessor.detectShellType).toHaveBeenCalledTimes(1)
            expect(result).toBe('pwsh')
        })

        it('should delegate processTemplateArray to ExpandableProcessorService', () => {
            // Arrange
            const templates = [
                { position: 'start' as const, template: 'timeout {duration}s' }
            ]
            const variables = { duration: '10' }
            const expectedResult = { start: ['timeout 10s'], end: [] }
            mockExpandableProcessor.processTemplateArray.mockReturnValue(expectedResult)

            // Act
            const result = service.processTemplateArray(templates, variables)

            // Assert
            expect(mockExpandableProcessor.processTemplateArray).toHaveBeenCalledWith(templates, variables)
            expect(result).toEqual(expectedResult)
        })

        it('should delegate processShellSpecificTemplate to ExpandableProcessorService', () => {
            // Arrange
            const expandable = {
                'pwsh-template': { position: 'start' as const, template: 'timeout {duration}s' }
            }
            const variables = { duration: '10' }
            const expectedResult = { start: ['timeout 10s'], end: [] }
            mockExpandableProcessor.processShellSpecificTemplate.mockReturnValue(expectedResult)

            // Act
            const result = service.processShellSpecificTemplate(expandable, variables)

            // Assert
            expect(mockExpandableProcessor.processShellSpecificTemplate).toHaveBeenCalledWith(expandable, variables)
            expect(result).toEqual(expectedResult)
        })

        it('should delegate parseExpandableFlag to ExpandableProcessorService', () => {
            // Arrange
            const flag = '-sto=5'
            const expectedResult = { key: 'sto', value: '5' }
            mockExpandableProcessor.parseExpandableFlag.mockReturnValue(expectedResult)

            // Act
            const result = service.parseExpandableFlag(flag)

            // Assert
            expect(mockExpandableProcessor.parseExpandableFlag).toHaveBeenCalledWith(flag)
            expect(result).toEqual(expectedResult)
        })

        it('should delegate expandFlags to ExpandableProcessorService', () => {
            // Arrange
            const args = ['-f', '-s']
            const expandables = { f: '--fix', s: '--skip-nx-cache' }
            const expectedResult = {
                start: [],
                prefix: [],
                preArgs: [],
                suffix: ['--fix', '--skip-nx-cache'],
                end: [],
                remainingArgs: []
            }
            mockExpandableProcessor.expandFlags.mockReturnValue(expectedResult)

            // Act
            const result = service.expandFlags(args, expandables)

            // Assert
            expect(mockExpandableProcessor.expandFlags).toHaveBeenCalledWith(args, expandables)
            expect(result).toEqual(expectedResult)
        })

        it('should delegate constructWrappedCommand to ExpandableProcessorService', () => {
            // Arrange
            const baseCommand = ['nx', 'run', 'test']
            const startTemplates = ['timeout 10s']
            const endTemplates = ['cleanup']
            const expectedResult = ['timeout 10s', 'nx', 'run', 'test', 'cleanup']
            mockExpandableProcessor.constructWrappedCommand.mockReturnValue(expectedResult)

            // Act
            const result = service.constructWrappedCommand(baseCommand, startTemplates, endTemplates)

            // Assert
            expect(mockExpandableProcessor.constructWrappedCommand).toHaveBeenCalledWith(baseCommand, startTemplates, endTemplates)
            expect(result).toEqual(expectedResult)
        })
    })

    describe('Error Handling', () => {
        it('should propagate errors from AliasManagerService', () => {
            // Arrange
            const error = new Error('Alias manager error')
            mockAliasManager.generateLocalFiles.mockImplementation(() => {
                throw error
            })

            // Act & Assert
            expect(() => service.generateLocalFiles()).toThrow(error)
        })

        it('should propagate errors from CommandExecutionService', () => {
            // Arrange
            const error = new Error('Command execution error')
            mockCommandExecution.runNx.mockImplementation(() => {
                throw error
            })

            // Act & Assert
            expect(() => service.runNx(['nx', 'run', 'test'])).toThrow(error)
        })

        it('should propagate errors from ExpandableProcessorService', () => {
            // Arrange
            const error = new Error('Expandable processor error')
            mockExpandableProcessor.expandTemplate.mockImplementation(() => {
                throw error
            })

            // Act & Assert
            expect(() => service.expandTemplate('template', {})).toThrow(error)
        })
    })

    describe('Return Value Handling', () => {
        it('should return values from CommandExecutionService', () => {
            // Arrange
            mockCommandExecution.runNx.mockReturnValue(1)

            // Act
            const result = service.runNx(['nx', 'run', 'test'])

            // Assert
            expect(result).toBe(1)
        })

        it('should return values from ExpandableProcessorService', () => {
            // Arrange
            mockExpandableProcessor.expandTemplate.mockReturnValue('expanded template')

            // Act
            const result = service.expandTemplate('template', {})

            // Assert
            expect(result).toBe('expanded template')
        })

        it('should handle void return values from AliasManagerService', () => {
            // Arrange
            mockAliasManager.generateLocalFiles.mockReturnValue(undefined)

            // Act
            const result = service.generateLocalFiles()

            // Assert
            expect(result).toBeUndefined()
        })
    })
})
