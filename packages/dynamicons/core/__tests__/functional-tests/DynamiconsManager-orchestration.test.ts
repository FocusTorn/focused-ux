import { describe, it, expect, beforeEach, vi } from 'vitest'
import { DynamiconsManagerService } from '../../src/services/DynamiconsManager.service.js'
import type { IDynamiconsDependencies } from '../../src/_interfaces/IDynamiconsManagerService.js'
import type { Uri } from 'vscode'

// Mock global setTimeout to resolve immediately
const originalSetTimeout = global.setTimeout
const originalSetImmediate = global.setImmediate

beforeEach(() => {
    global.setTimeout = vi.fn((callback: () => void) => {
        callback()
        return 1
    })
    global.setImmediate = vi.fn((callback: () => void) => {
        callback()
        return 1
    })
})

afterEach(() => {
    global.setTimeout = originalSetTimeout
    global.setImmediate = originalSetImmediate
})

describe('Dynamicons Manager Complex Orchestration', () => {
    let manager: DynamiconsManagerService
    let mockDependencies: IDynamiconsDependencies

    beforeEach(() => {
        // Create comprehensive mock dependencies
        mockDependencies = {
            context: {
                extensionPath: '/test/extension'
            },
            window: {
                showWarningMessage: vi.fn(),
                showInformationMessage: vi.fn(),
                showErrorMessage: vi.fn()
            },
            commands: {
                executeCommand: vi.fn().mockResolvedValue(undefined)
            },
            path: {
                basename: vi.fn().mockReturnValue('test-file.ts'),
                join: vi.fn().mockReturnValue('/test/path')
            },
            commonUtils: {
                errMsg: vi.fn()
            },
            fileSystem: {
                stat: vi.fn().mockResolvedValue({
                    isDirectory: vi.fn().mockReturnValue(false),
                    isFile: vi.fn().mockReturnValue(true)
                })
            },
            iconThemeGenerator: {
                generateIconThemeManifest: vi.fn().mockResolvedValue({}),
                writeIconThemeFile: vi.fn().mockResolvedValue(undefined)
            },
            configService: {
                updateCustomMappings: vi.fn().mockImplementation(async (callback) => {
                    const mappings = {}
                    await callback(mappings)
                    return mappings
                }),
                getCustomMappings: vi.fn().mockResolvedValue({}),
                getUserIconsDirectory: vi.fn().mockResolvedValue('/test/icons'),
                getHideArrowsSetting: vi.fn().mockResolvedValue(false),
                updateHideArrowsSetting: vi.fn().mockResolvedValue(undefined)
            },
            iconPicker: {
                showAvailableIconsQuickPick: vi.fn().mockResolvedValue('test-icon')
            },
            uriFactory: {
                file: vi.fn().mockReturnValue({ fsPath: '/test/path' })
            }
        }

        manager = new DynamiconsManagerService(mockDependencies)
    })

    describe('assignIconWithValidation', () => {
        it('should execute complete workflow: validation + icon assignment + theme regeneration', async () => {
            // Arrange
            const resourceUris = [{ fsPath: '/test/file1.ts' }, { fsPath: '/test/file2.js' }] as Uri[]
            const iconTypeScope = 'file'

            // Act
            const result = await manager.assignIconWithValidation(resourceUris, iconTypeScope)

            // Assert
            expect(result).toEqual({
                assigned: true,
                resourceCount: 2,
                iconName: 'test-icon'
            })

            // Verify validation was called
            expect(mockDependencies.fileSystem.stat).toHaveBeenCalledTimes(2)

            // Verify icon picker was called
            expect(mockDependencies.iconPicker.showAvailableIconsQuickPick).toHaveBeenCalledWith('file', undefined)

            // Verify configuration was updated
            expect(mockDependencies.configService.updateCustomMappings).toHaveBeenCalled()

            // Verify theme was regenerated
            expect(mockDependencies.iconThemeGenerator.generateIconThemeManifest).toHaveBeenCalled()
            expect(mockDependencies.iconThemeGenerator.writeIconThemeFile).toHaveBeenCalled()

            // Verify theme refresh commands were called
            expect(mockDependencies.commands.executeCommand).toHaveBeenCalledWith('workbench.action.selectIconTheme', 'vs-seti-file-icons')
            expect(mockDependencies.commands.executeCommand).toHaveBeenCalledWith('workbench.action.selectIconTheme', 'dynamicons-theme')

            // Verify success message
            expect(mockDependencies.window.showInformationMessage).toHaveBeenCalledWith('Icon assigned to 2 resource(s).')
        })

        it('should handle validation errors gracefully', async () => {
            // Arrange
            const resourceUris = [] as Uri[]

            // Act & Assert
            await expect(manager.assignIconWithValidation(resourceUris)).rejects.toThrow('No resources selected')
        })

        it('should handle no icon selected gracefully', async () => {
            // Arrange
            const resourceUris = [{ fsPath: '/test/file.ts' }] as Uri[]
            mockDependencies.iconPicker.showAvailableIconsQuickPick.mockResolvedValue(undefined)

            // Act
            const result = await manager.assignIconWithValidation(resourceUris)

            // Assert
            expect(result).toEqual({
                assigned: false,
                resourceCount: 1
            })
        })
    })

    describe('revertIconWithValidation', () => {
        it('should execute complete workflow: validation + icon reversion + theme regeneration', async () => {
            // Arrange
            const resourceUris = [{ fsPath: '/test/file1.ts' }, { fsPath: '/test/file2.js' }] as Uri[]

            // Act
            const result = await manager.revertIconWithValidation(resourceUris)

            // Assert
            expect(result).toEqual({
                reverted: true,
                resourceCount: 2
            })

            // Verify validation was called
            expect(mockDependencies.fileSystem.stat).toHaveBeenCalledTimes(2)

            // Verify configuration was updated
            expect(mockDependencies.configService.updateCustomMappings).toHaveBeenCalled()

            // Verify theme was regenerated
            expect(mockDependencies.iconThemeGenerator.generateIconThemeManifest).toHaveBeenCalled()
            expect(mockDependencies.iconThemeGenerator.writeIconThemeFile).toHaveBeenCalled()

            // Verify success message
            expect(mockDependencies.window.showInformationMessage).toHaveBeenCalledWith('Icon assignments reverted for 2 resource(s).')
        })

        it('should handle validation errors gracefully', async () => {
            // Arrange
            const resourceUris = [] as Uri[]

            // Act & Assert
            await expect(manager.revertIconWithValidation(resourceUris)).rejects.toThrow('No resources selected')
        })
    })

    describe('completeIconWorkflow', () => {
        it('should execute complete workflow: assign operation', async () => {
            // Arrange
            const resourceUris = [{ fsPath: '/test/file.ts' }] as Uri[]
            const operation = 'assign' as const
            const iconTypeScope = 'file'

            // Act
            const result = await manager.completeIconWorkflow(resourceUris, operation, iconTypeScope)

            // Assert
            expect(result).toEqual({
                success: true,
                operation: 'assign',
                resourceCount: 1
            })

            // Verify the assign workflow was called
            expect(mockDependencies.iconPicker.showAvailableIconsQuickPick).toHaveBeenCalled()
            expect(mockDependencies.configService.updateCustomMappings).toHaveBeenCalled()
        })

        it('should execute complete workflow: revert operation', async () => {
            // Arrange
            const resourceUris = [{ fsPath: '/test/file.ts' }] as Uri[]
            const operation = 'revert' as const

            // Act
            const result = await manager.completeIconWorkflow(resourceUris, operation)

            // Assert
            expect(result).toEqual({
                success: true,
                operation: 'revert',
                resourceCount: 1
            })

            // Verify the revert workflow was called
            expect(mockDependencies.configService.updateCustomMappings).toHaveBeenCalled()
        })

        it('should handle no resources gracefully', async () => {
            // Arrange
            const resourceUris = [] as Uri[]
            const operation = 'assign' as const

            // Act & Assert
            await expect(manager.completeIconWorkflow(resourceUris, operation)).rejects.toThrow('No resources selected')
        })
    })

    describe('legacy methods', () => {
        it('should maintain backward compatibility with assignIconToResource', async () => {
            // Arrange
            const resourceUris = [{ fsPath: '/test/file.ts' }] as Uri[]

            // Act
            await manager.assignIconToResource(resourceUris)

            // Assert
            expect(mockDependencies.iconPicker.showAvailableIconsQuickPick).toHaveBeenCalled()
            expect(mockDependencies.configService.updateCustomMappings).toHaveBeenCalled()
            expect(mockDependencies.window.showInformationMessage).toHaveBeenCalledWith('Icon assigned to 1 resource(s).')
        })

        it('should maintain backward compatibility with revertIconAssignment', async () => {
            // Arrange
            const resourceUris = [{ fsPath: '/test/file.ts' }] as Uri[]

            // Act
            await manager.revertIconAssignment(resourceUris)

            // Assert
            expect(mockDependencies.configService.updateCustomMappings).toHaveBeenCalled()
            expect(mockDependencies.window.showInformationMessage).toHaveBeenCalledWith('Icon assignments reverted for 1 resource(s).')
        })
    })
})
