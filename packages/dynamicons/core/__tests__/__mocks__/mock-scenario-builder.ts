import { vi } from 'vitest'
import type { DynamiconsTestMocks } from './helpers.js'

// ============================================================================
// DYNAMICONS CORE MOCK SCENARIOS
// ============================================================================

export interface ConfigurationScenarioOptions {
    key: string
    value?: any
    shouldSucceed?: boolean
    errorMessage?: string
}

export interface FileSystemScenarioOptions {
    filePath: string
    content?: string
    shouldExist?: boolean
    shouldSucceed?: boolean
    errorMessage?: string
}

export interface IconThemeScenarioOptions {
    themePath: string
    iconPath: string
    shouldSucceed?: boolean
    errorMessage?: string
}

export interface IconDiscoveryScenarioOptions {
    directoryPath: string
    iconFiles?: string[]
    shouldSucceed?: boolean
    errorMessage?: string
}

export interface IconAssignmentScenarioOptions {
    fileExtension: string
    iconName: string
    shouldSucceed?: boolean
    errorMessage?: string
}

// ============================================================================
// CONFIGURATION SERVICE SCENARIOS
// ============================================================================

export function setupConfigurationSuccessScenario(mocks: DynamiconsTestMocks, options: ConfigurationScenarioOptions): void {
    const { key, value } = options
    
    mocks.workspace.getConfiguration.mockReturnValue({
        get: vi.fn().mockReturnValue(value),
        update: vi.fn().mockResolvedValue(undefined),
    } as any)
}

export function setupConfigurationErrorScenario(mocks: DynamiconsTestMocks, options: ConfigurationScenarioOptions): void {
    const { errorMessage = 'Configuration error' } = options
    
    mocks.workspace.getConfiguration.mockReturnValue({
        get: vi.fn().mockImplementation(() => {
            throw new Error(errorMessage)
        }),
        update: vi.fn().mockRejectedValue(new Error(errorMessage)),
    } as any)
}

// ============================================================================
// FILE SYSTEM SCENARIOS
// ============================================================================

export function setupFileSystemSuccessScenario(mocks: DynamiconsTestMocks, options: FileSystemScenarioOptions): void {
    const { filePath, content = 'file content' } = options
    
    mocks.fileSystem.readFile.mockResolvedValue(content)
    mocks.fileSystem.writeFile.mockResolvedValue(undefined)
    mocks.fileSystem.stat.mockResolvedValue({ type: 'file' } as any)
    mocks.fileSystem.access.mockResolvedValue(undefined)
    mocks.fileSystem.readdir.mockResolvedValue([])
    mocks.fileSystem.mkdir.mockResolvedValue(undefined)
    mocks.fileSystem.copyFile.mockResolvedValue(undefined)
}

export function setupFileSystemErrorScenario(mocks: DynamiconsTestMocks, options: FileSystemScenarioOptions): void {
    const { errorMessage = 'File system error' } = options
    
    mocks.fileSystem.readFile.mockRejectedValue(new Error(errorMessage))
    mocks.fileSystem.writeFile.mockRejectedValue(new Error(errorMessage))
    mocks.fileSystem.stat.mockRejectedValue(new Error(errorMessage))
    mocks.fileSystem.access.mockRejectedValue(new Error(errorMessage))
    mocks.fileSystem.readdir.mockRejectedValue(new Error(errorMessage))
    mocks.fileSystem.mkdir.mockRejectedValue(new Error(errorMessage))
    mocks.fileSystem.copyFile.mockRejectedValue(new Error(errorMessage))
}

export function setupFileNotFoundScenario(mocks: DynamiconsTestMocks, options: FileSystemScenarioOptions): void {
    const { filePath } = options
    
    mocks.fileSystem.readFile.mockRejectedValue(new Error('ENOENT: no such file or directory'))
    mocks.fileSystem.stat.mockRejectedValue(new Error('ENOENT: no such file or directory'))
    mocks.fileSystem.access.mockRejectedValue(new Error('ENOENT: no such file or directory'))
}

// ============================================================================
// ICON THEME GENERATOR SCENARIOS
// ============================================================================

export function setupIconThemeSuccessScenario(mocks: DynamiconsTestMocks, options: IconThemeScenarioOptions): void {
    const { themePath, iconPath } = options
    
    const mockThemeContent = JSON.stringify({
        iconDefinitions: {
            [iconPath]: {
                iconPath: iconPath
            }
        },
        fileExtensions: {
            '.ts': iconPath
        }
    })
    
    mocks.fileSystem.readFile.mockResolvedValue(mockThemeContent)
    mocks.fileSystem.writeFile.mockResolvedValue(undefined)
    mocks.path.basename.mockReturnValue('theme.json')
    mocks.path.dirname.mockReturnValue('/themes')
    mocks.path.join.mockReturnValue(themePath)
}

export function setupIconThemeErrorScenario(mocks: DynamiconsTestMocks, options: IconThemeScenarioOptions): void {
    const { errorMessage = 'Theme generation error' } = options
    
    mocks.fileSystem.readFile.mockRejectedValue(new Error(errorMessage))
    mocks.fileSystem.writeFile.mockRejectedValue(new Error(errorMessage))
}

// ============================================================================
// ICON DISCOVERY SCENARIOS
// ============================================================================

export function setupIconDiscoverySuccessScenario(mocks: DynamiconsTestMocks, options: IconDiscoveryScenarioOptions): void {
    const { directoryPath, iconFiles = ['icon1.svg', 'icon2.svg'] } = options
    
    mocks.fileSystem.readdir.mockResolvedValue(iconFiles)
    mocks.fileSystem.stat.mockResolvedValue({ type: 'file' } as any)
    mocks.path.basename.mockImplementation((path: string) => path.split('/').pop() || '')
    mocks.path.join.mockImplementation((...paths: string[]) => paths.join('/'))
}

export function setupIconDiscoveryErrorScenario(mocks: DynamiconsTestMocks, options: IconDiscoveryScenarioOptions): void {
    const { errorMessage = 'Icon discovery error' } = options
    
    mocks.fileSystem.readdir.mockRejectedValue(new Error(errorMessage))
    mocks.fileSystem.stat.mockRejectedValue(new Error(errorMessage))
}

// ============================================================================
// ICON ASSIGNMENT SCENARIOS
// ============================================================================

export function setupIconAssignmentSuccessScenario(mocks: DynamiconsTestMocks, options: IconAssignmentScenarioOptions): void {
    const { fileExtension, iconName } = options
    
    mocks.window.showInformationMessage.mockResolvedValue('Assign')
    mocks.commands.executeCommand.mockResolvedValue(undefined)
}

export function setupIconAssignmentErrorScenario(mocks: DynamiconsTestMocks, options: IconAssignmentScenarioOptions): void {
    const { errorMessage = 'Icon assignment error' } = options
    
    mocks.window.showErrorMessage.mockResolvedValue(undefined)
    mocks.commands.executeCommand.mockRejectedValue(new Error(errorMessage))
}

// ============================================================================
// DYNAMICONS CORE MOCK BUILDER PATTERN
// ============================================================================

export class DynamiconsMockBuilder {
    constructor(private mocks: DynamiconsTestMocks) {}

    configuration(options: ConfigurationScenarioOptions): DynamiconsMockBuilder {
        if (options.shouldSucceed !== false) {
            setupConfigurationSuccessScenario(this.mocks, options)
        } else {
            setupConfigurationErrorScenario(this.mocks, options)
        }
        return this
    }

    fileSystem(options: FileSystemScenarioOptions): DynamiconsMockBuilder {
        if (options.shouldSucceed !== false) {
            setupFileSystemSuccessScenario(this.mocks, options)
        } else {
            setupFileSystemErrorScenario(this.mocks, options)
        }
        return this
    }

    fileNotFound(options: FileSystemScenarioOptions): DynamiconsMockBuilder {
        setupFileNotFoundScenario(this.mocks, options)
        return this
    }

    iconTheme(options: IconThemeScenarioOptions): DynamiconsMockBuilder {
        if (options.shouldSucceed !== false) {
            setupIconThemeSuccessScenario(this.mocks, options)
        } else {
            setupIconThemeErrorScenario(this.mocks, options)
        }
        return this
    }

    iconDiscovery(options: IconDiscoveryScenarioOptions): DynamiconsMockBuilder {
        if (options.shouldSucceed !== false) {
            setupIconDiscoverySuccessScenario(this.mocks, options)
        } else {
            setupIconDiscoveryErrorScenario(this.mocks, options)
        }
        return this
    }

    iconAssignment(options: IconAssignmentScenarioOptions): DynamiconsMockBuilder {
        if (options.shouldSucceed !== false) {
            setupIconAssignmentSuccessScenario(this.mocks, options)
        } else {
            setupIconAssignmentErrorScenario(this.mocks, options)
        }
        return this
    }

    error(errorType: 'configuration' | 'fileSystem' | 'iconTheme' | 'iconDiscovery' | 'iconAssignment', errorMessage: string): DynamiconsMockBuilder {
        switch (errorType) {
            case 'configuration':
                setupConfigurationErrorScenario(this.mocks, { errorMessage })
                break
            case 'fileSystem':
                setupFileSystemErrorScenario(this.mocks, { errorMessage })
                break
            case 'iconTheme':
                setupIconThemeErrorScenario(this.mocks, { errorMessage })
                break
            case 'iconDiscovery':
                setupIconDiscoveryErrorScenario(this.mocks, { errorMessage })
                break
            case 'iconAssignment':
                setupIconAssignmentErrorScenario(this.mocks, { errorMessage })
                break
        }
        return this
    }

    build(): DynamiconsTestMocks {
        return this.mocks
    }
}

export function createDynamiconsMockBuilder(mocks: DynamiconsTestMocks): DynamiconsMockBuilder {
    return new DynamiconsMockBuilder(mocks)
}

