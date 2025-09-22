import { describe, it, expect, beforeEach, vi } from 'vitest'
import { QuickSettingsService } from '../../src/services/QuickSettings.service.js'
import { setupTestEnvironment, resetAllMocks, setupFileSystemMocks, setupPathMocks, setupYamlMocks } from '../__mocks__/helpers'
import { 
    setupQuickSettingsSuccessScenario, 
    setupQuickSettingsErrorScenario, 
    createCCPMockBuilder 
} from '../__mocks__/mock-scenario-builder'

// Mock service classes
class MockContext {
    extensionUri = '/test/extension'
}

class MockWorkspace {
    workspaceFolders = [{ uri: '/test/project' }]
    onDidChangeConfiguration = vi.fn()
}

describe('QuickSettingsService', () => {
    let service: QuickSettingsService
    let mockContext: MockContext
    let mockWorkspace: MockWorkspace
    let mocks: ReturnType<typeof setupTestEnvironment>

    beforeEach(() => {
        mocks = setupTestEnvironment()
        resetAllMocks(mocks)
        setupFileSystemMocks(mocks)
        setupPathMocks(mocks)
        setupYamlMocks(mocks)

        // Initialize mock services
        mockContext = new MockContext()
        mockWorkspace = new MockWorkspace()

        // Initialize service with mocked dependencies
        service = new QuickSettingsService(
            mockContext as any,
            mockWorkspace as any,
            mocks.fileSystem as any,
            mocks.path as any
        )
    })

    describe('initialization', () => {
        it('should initialize with default values when no config file exists', async () => {
            // Arrange
            setupQuickSettingsSuccessScenario(mocks, {
                operation: 'initialize',
                configFileExists: false,
                expectedSettings: {
                    'ccp.projectStructureContents': 'all',
                    'ccp.defaultStatusMessage': 'drop'
                }
            })

            mocks.fileSystem.readFile.mockRejectedValue(new Error('File not found'))

            // Act
            await service.refresh()

            // Assert
            const projectStructureState = await service.getSettingState('ccp.projectStructureContents')
            const statusMessageState = await service.getSettingState('ccp.defaultStatusMessage')

            expect(projectStructureState).toBe('all')
            expect(statusMessageState).toBe('drop')
        })

        it('should initialize with config file values', async () => {
            // Arrange
            const configData = {
                ContextCherryPicker: {
                    quick_settings_panel: {
                        project_structure_contents: {
                            visible: true,
                            filter: 'selected'
                        },
                        default_status_message: {
                            visible: true,
                            style: 'toast'
                        },
                        file_groups: {
                            'source-files': {
                                initially_visible: true,
                                items: ['src/**/*.ts']
                            },
                            'test-files': {
                                initially_visible: false,
                                items: ['**/*.test.ts']
                            }
                        }
                    }
                }
            }

            setupQuickSettingsSuccessScenario(mocks, {
                operation: 'initialize',
                configData,
                expectedSettings: {
                    'ccp.projectStructureContents': 'selected',
                    'ccp.defaultStatusMessage': 'toast',
                    'ccp.fileGroupVisibility.source-files': true,
                    'ccp.fileGroupVisibility.test-files': false
                }
            })

            mocks.fileSystem.readFile.mockResolvedValue('yaml content')
            mockYaml.load.mockReturnValue(configData)

            // Act
            await service.refresh()

            // Assert
            const projectStructureState = await service.getSettingState('ccp.projectStructureContents')
            const statusMessageState = await service.getSettingState('ccp.defaultStatusMessage')
            const sourceFilesState = await service.getSettingState('ccp.fileGroupVisibility.source-files')
            const testFilesState = await service.getSettingState('ccp.fileGroupVisibility.test-files')

            expect(projectStructureState).toBe('selected')
            expect(statusMessageState).toBe('toast')
            expect(sourceFilesState).toBe(true)
            expect(testFilesState).toBe(false)
        })

        it('should handle malformed config file gracefully', async () => {
            // Arrange
            setupQuickSettingsErrorScenario(mocks, 'readFile', 'Invalid YAML', {
                operation: 'initialize'
            })

            mocks.fileSystem.readFile.mockResolvedValue('invalid yaml content')
            mockYaml.load.mockImplementation(() => {
                throw new Error('Invalid YAML')
            })

            // Act
            await service.refresh()

            // Assert
            const projectStructureState = await service.getSettingState('ccp.projectStructureContents')
            const statusMessageState = await service.getSettingState('ccp.defaultStatusMessage')

            expect(projectStructureState).toBe('all')
            expect(statusMessageState).toBe('drop')
        })
    })

    describe('getSettingState', () => {
        it('should return setting state after initialization', async () => {
            // Arrange
            setupQuickSettingsSuccessScenario(mocks, {
                operation: 'getSettingState',
                settingId: 'ccp.projectStructureContents',
                expectedValue: 'all'
            })

            // Act
            const result = await service.getSettingState('ccp.projectStructureContents')

            // Assert
            expect(result).toBe('all')
        })

        it('should return undefined for non-existent setting', async () => {
            // Arrange
            setupQuickSettingsSuccessScenario(mocks, {
                operation: 'getSettingState',
                settingId: 'nonexistent.setting',
                expectedValue: undefined
            })

            // Act
            const result = await service.getSettingState('nonexistent.setting')

            // Assert
            expect(result).toBeUndefined()
        })

        it('should wait for initialization before returning value', async () => {
            // Arrange
            setupQuickSettingsSuccessScenario(mocks, {
                operation: 'getSettingState',
                settingId: 'ccp.projectStructureContents',
                expectedValue: 'selected'
            })

            // Mock slow initialization
            mocks.fileSystem.readFile.mockResolvedValue('{}')

            // Act
            const resultPromise = service.getSettingState('ccp.projectStructureContents')
            
            // Should wait for initialization
            const result = await resultPromise

            // Assert
            expect(result).toBe('all') // Default value
        })
    })

    describe('updateSettingState', () => {
        it('should update setting state and write to config', async () => {
            // Arrange
            const settingId = 'ccp.projectStructureContents'
            const newValue = 'selected'

            setupQuickSettingsSuccessScenario(mocks, {
                operation: 'updateSettingState',
                settingId,
                newValue,
                shouldWriteToConfig: true
            })

            mocks.fileSystem.readFile.mockResolvedValue('{}')
            mockYaml.load.mockReturnValue({})
            mockYaml.dump.mockReturnValue('updated yaml')
            mocks.fileSystem.writeFile.mockResolvedValue(undefined)

            // Act
            await service.updateSettingState(settingId, newValue)

            // Assert
            const result = await service.getSettingState(settingId)
            expect(result).toBe(newValue)
            expect(mocks.fileSystem.writeFile).toHaveBeenCalled()
        })

        it('should update file group visibility setting', async () => {
            // Arrange
            const settingId = 'ccp.fileGroupVisibility.source-files'
            const newValue = true

            setupQuickSettingsSuccessScenario(mocks, {
                operation: 'updateSettingState',
                settingId,
                newValue,
                shouldWriteToConfig: true
            })

            const configData = {
                ContextCherryPicker: {
                    quick_settings_panel: {
                        file_groups: {
                            'source-files': {
                                initially_visible: false,
                                items: ['src/**/*.ts']
                            }
                        }
                    }
                }
            }

            mocks.fileSystem.readFile.mockResolvedValue('{}')
            mockYaml.load.mockReturnValue(configData)
            mockYaml.dump.mockReturnValue('updated yaml')
            mocks.fileSystem.writeFile.mockResolvedValue(undefined)

            // Act
            await service.updateSettingState(settingId, newValue)

            // Assert
            const result = await service.getSettingState(settingId)
            expect(result).toBe(newValue)
        })

        it('should handle config write errors gracefully', async () => {
            // Arrange
            const settingId = 'ccp.projectStructureContents'
            const newValue = 'selected'

            setupQuickSettingsErrorScenario(mocks, 'writeFile', 'Permission denied', {
                operation: 'updateSettingState',
                settingId,
                newValue
            })

            mocks.fileSystem.readFile.mockResolvedValue('{}')
            mockYaml.load.mockReturnValue({})
            mockYaml.dump.mockReturnValue('updated yaml')
            mocks.fileSystem.writeFile.mockRejectedValue(new Error('Permission denied'))

            // Mock console.error to avoid test output
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

            // Act
            await service.updateSettingState(settingId, newValue)

            // Assert
            const result = await service.getSettingState(settingId)
            expect(result).toBe(newValue) // State should still be updated locally
            expect(consoleSpy).toHaveBeenCalled()

            // Cleanup
            consoleSpy.mockRestore()
        })

        it('should fire update event when setting changes', async () => {
            // Arrange
            const settingId = 'ccp.projectStructureContents'
            const newValue = 'selected'
            let eventFired = false
            let eventData: any = null

            setupQuickSettingsSuccessScenario(mocks, {
                operation: 'updateSettingState',
                settingId,
                newValue,
                shouldFireEvent: true
            })

            // Subscribe to events
            service.onDidUpdateSetting((data) => {
                eventFired = true
                eventData = data
            })

            mocks.fileSystem.readFile.mockResolvedValue('{}')
            mockYaml.load.mockReturnValue({})
            mockYaml.dump.mockReturnValue('updated yaml')
            mocks.fileSystem.writeFile.mockResolvedValue(undefined)

            // Act
            await service.updateSettingState(settingId, newValue)

            // Assert
            expect(eventFired).toBe(true)
            expect(eventData).toEqual({ settingId, value: newValue })
        })
    })

    describe('refresh', () => {
        it('should reload settings from config file', async () => {
            // Arrange
            const initialConfig = {
                ContextCherryPicker: {
                    quick_settings_panel: {
                        project_structure_contents: {
                            filter: 'selected'
                        }
                    }
                }
            }

            const updatedConfig = {
                ContextCherryPicker: {
                    quick_settings_panel: {
                        project_structure_contents: {
                            filter: 'all'
                        }
                    }
                }
            }

            setupQuickSettingsSuccessScenario(mocks, {
                operation: 'refresh',
                initialConfig,
                updatedConfig
            })

            mocks.fileSystem.readFile
                .mockResolvedValueOnce('initial yaml')
                .mockResolvedValueOnce('updated yaml')
            mockYaml.load
                .mockReturnValueOnce(initialConfig)
                .mockReturnValueOnce(updatedConfig)

            // Set initial state
            await service.updateSettingState('ccp.projectStructureContents', 'selected')

            // Act
            await service.refresh()

            // Assert
            const result = await service.getSettingState('ccp.projectStructureContents')
            expect(result).toBe('all')
        })

        it('should fire refresh event', async () => {
            // Arrange
            let refreshEventFired = false

            setupQuickSettingsSuccessScenario(mocks, {
                operation: 'refresh',
                shouldFireEvent: true
            })

            // Subscribe to events
            service.onDidUpdateSetting((data) => {
                if (data.settingId === 'refresh') {
                    refreshEventFired = true
                }
            })

            mocks.fileSystem.readFile.mockResolvedValue('{}')
            mockYaml.load.mockReturnValue({})

            // Act
            await service.refresh()

            // Assert
            expect(refreshEventFired).toBe(true)
        })
    })

    describe('getHtml', () => {
        it('should generate HTML with project structure section', async () => {
            // Arrange
            const configData = {
                ContextCherryPicker: {
                    quick_settings_panel: {
                        project_structure_contents: {
                            visible: true
                        }
                    }
                }
            }

            const htmlTemplate = `
                <html>
                    <body>
                        \${projectStructureSection}
                    </body>
                </html>
            `

            setupQuickSettingsSuccessScenario(mocks, {
                operation: 'getHtml',
                configData,
                htmlTemplate,
                cspSource: 'test-csp',
                nonce: 'test-nonce'
            })

            mocks.fileSystem.readFile.mockResolvedValue(htmlTemplate)
            mockYaml.load.mockReturnValue(configData)

            // Set current state
            await service.updateSettingState('ccp.projectStructureContents', 'selected')

            // Act
            const result = await service.getHtml('test-csp', 'test-nonce')

            // Assert
            expect(result).toContain('Project Structure Contents')
            expect(result).toContain('data-setting-id="ccp.projectStructureContents"')
            expect(result).toContain('data-value="selected"')
            expect(result).toContain('class="option-button selected"')
        })

        it('should generate HTML with status message section', async () => {
            // Arrange
            const configData = {
                ContextCherryPicker: {
                    quick_settings_panel: {
                        default_status_message: {
                            visible: true
                        }
                    }
                }
            }

            const htmlTemplate = `
                <html>
                    <body>
                        \${statusMessageSection}
                    </body>
                </html>
            `

            setupQuickSettingsSuccessScenario(mocks, {
                operation: 'getHtml',
                configData,
                htmlTemplate,
                cspSource: 'test-csp',
                nonce: 'test-nonce'
            })

            mocks.fileSystem.readFile.mockResolvedValue(htmlTemplate)
            mockYaml.load.mockReturnValue(configData)

            // Set current state
            await service.updateSettingState('ccp.defaultStatusMessage', 'toast')

            // Act
            const result = await service.getHtml('test-csp', 'test-nonce')

            // Assert
            expect(result).toContain('Default Status Message')
            expect(result).toContain('data-setting-id="ccp.defaultStatusMessage"')
            expect(result).toContain('data-value="toast"')
            expect(result).toContain('class="option-button selected"')
        })

        it('should generate HTML with file group buttons', async () => {
            // Arrange
            const configData = {
                ContextCherryPicker: {
                    quick_settings_panel: {
                        file_groups: {
                            'source-files': {
                                initially_visible: true,
                                items: ['src/**/*.ts']
                            },
                            'test-files': {
                                initially_visible: false,
                                items: ['**/*.test.ts']
                            }
                        }
                    }
                }
            }

            const htmlTemplate = `
                <html>
                    <body>
                        \${fileGroupButtonsHtml}
                    </body>
                </html>
            `

            setupQuickSettingsSuccessScenario(mocks, {
                operation: 'getHtml',
                configData,
                htmlTemplate,
                cspSource: 'test-csp',
                nonce: 'test-nonce'
            })

            mocks.fileSystem.readFile.mockResolvedValue(htmlTemplate)
            mockYaml.load.mockReturnValue(configData)

            // Act
            const result = await service.getHtml('test-csp', 'test-nonce')

            // Assert
            expect(result).toContain('data-setting-id="ccp.fileGroupVisibility.source-files"')
            expect(result).toContain('data-setting-id="ccp.fileGroupVisibility.test-files"')
            expect(result).toContain('class="toggle-button selected"') // source-files should be selected
            expect(result).toContain('class="toggle-button"') // test-files should not be selected
        })

        it('should replace template variables correctly', async () => {
            // Arrange
            const htmlTemplate = `
                <html>
                    <head>
                        <meta http-equiv="Content-Security-Policy" content="\${webview.cspSource}">
                        <script nonce="\${nonce}">
                            console.log('test');
                        </script>
                    </head>
                    <body>
                        \${projectStructureSection}
                        \${statusMessageSection}
                        \${fileGroupButtonsHtml}
                    </body>
                </html>
            `

            setupQuickSettingsSuccessScenario(mocks, {
                operation: 'getHtml',
                htmlTemplate,
                cspSource: 'test-csp-source',
                nonce: 'test-nonce-value'
            })

            mocks.fileSystem.readFile.mockResolvedValue(htmlTemplate)
            mockYaml.load.mockReturnValue({})

            // Act
            const result = await service.getHtml('test-csp-source', 'test-nonce-value')

            // Assert
            expect(result).toContain('content="test-csp-source"')
            expect(result).toContain('nonce="test-nonce-value"')
            expect(result).not.toContain('${webview.cspSource}')
            expect(result).not.toContain('${nonce}')
        })

        it('should handle HTML file read errors', async () => {
            // Arrange
            setupQuickSettingsErrorScenario(mocks, 'readFile', 'File not found', {
                operation: 'getHtml'
            })

            mocks.fileSystem.readFile.mockRejectedValue(new Error('File not found'))

            // Act & Assert
            await expect(service.getHtml('test-csp', 'test-nonce')).rejects.toThrow('File not found')
        })

        it('should handle missing workspace folders', async () => {
            // Arrange
            setupQuickSettingsSuccessScenario(mocks, {
                operation: 'getHtml',
                hasWorkspaceFolders: false
            })

            mockWorkspace.workspaceFolders = null
            mocks.fileSystem.readFile.mockResolvedValue('<html></html>')
            mockYaml.load.mockReturnValue({})

            // Act
            const result = await service.getHtml('test-csp', 'test-nonce')

            // Assert
            expect(result).toBe('<html></html>')
        })
    })

    describe('edge cases', () => {
        it('should handle empty config file', async () => {
            // Arrange
            setupQuickSettingsSuccessScenario(mocks, {
                operation: 'initialize',
                configData: {},
                expectedSettings: {
                    'ccp.projectStructureContents': 'all',
                    'ccp.defaultStatusMessage': 'drop'
                }
            })

            mocks.fileSystem.readFile.mockResolvedValue('')
            mockYaml.load.mockReturnValue({})

            // Act
            await service.refresh()

            // Assert
            const projectStructureState = await service.getSettingState('ccp.projectStructureContents')
            const statusMessageState = await service.getSettingState('ccp.defaultStatusMessage')

            expect(projectStructureState).toBe('all')
            expect(statusMessageState).toBe('drop')
        })

        it('should handle config with partial settings', async () => {
            // Arrange
            const configData = {
                ContextCherryPicker: {
                    quick_settings_panel: {
                        project_structure_contents: {
                            filter: 'selected'
                        }
                        // Missing default_status_message and file_groups
                    }
                }
            }

            setupQuickSettingsSuccessScenario(mocks, {
                operation: 'initialize',
                configData,
                expectedSettings: {
                    'ccp.projectStructureContents': 'selected',
                    'ccp.defaultStatusMessage': 'drop' // Should use default
                }
            })

            mocks.fileSystem.readFile.mockResolvedValue('yaml content')
            mockYaml.load.mockReturnValue(configData)

            // Act
            await service.refresh()

            // Assert
            const projectStructureState = await service.getSettingState('ccp.projectStructureContents')
            const statusMessageState = await service.getSettingState('ccp.defaultStatusMessage')

            expect(projectStructureState).toBe('selected')
            expect(statusMessageState).toBe('drop')
        })

        it('should handle concurrent setting updates', async () => {
            // Arrange
            setupQuickSettingsSuccessScenario(mocks, {
                operation: 'concurrentUpdates',
                settings: [
                    { id: 'ccp.projectStructureContents', value: 'selected' },
                    { id: 'ccp.defaultStatusMessage', value: 'toast' }
                ]
            })

            mocks.fileSystem.readFile.mockResolvedValue('{}')
            mockYaml.load.mockReturnValue({})
            mockYaml.dump.mockReturnValue('updated yaml')
            mocks.fileSystem.writeFile.mockResolvedValue(undefined)

            // Act
            await Promise.all([
                service.updateSettingState('ccp.projectStructureContents', 'selected'),
                service.updateSettingState('ccp.defaultStatusMessage', 'toast')
            ])

            // Assert
            const projectStructureState = await service.getSettingState('ccp.projectStructureContents')
            const statusMessageState = await service.getSettingState('ccp.defaultStatusMessage')

            expect(projectStructureState).toBe('selected')
            expect(statusMessageState).toBe('toast')
        })
    })
})
