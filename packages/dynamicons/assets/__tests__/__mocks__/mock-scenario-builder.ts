import { vi } from 'vitest'
import type { DynamiconsAssetsTestMocks } from './helpers.js'

// ============================================================================
// DYNAMICONS ASSETS MOCK SCENARIOS
// ============================================================================

export interface FileSystemScenarioOptions {
    filePath: string
    content?: string | Buffer
    shouldSucceed?: boolean
    errorMessage?: string
    isDirectory?: boolean
    files?: string[]
}

export interface IconProcessingScenarioOptions {
    iconPath: string
    outputPath: string
    shouldSucceed?: boolean
    errorMessage?: string
    optimizedContent?: string
}

export interface AssetGenerationScenarioOptions {
    sourceDir: string
    outputDir: string
    shouldSucceed?: boolean
    errorMessage?: string
    generatedFiles?: string[]
}

export interface ErrorHandlingScenarioOptions {
    errorType: string
    severity: string
    context: string
    shouldSucceed?: boolean
    errorMessage?: string
}

export interface SVGOOptimizationScenarioOptions {
    inputPath: string
    outputPath: string
    shouldSucceed?: boolean
    errorMessage?: string
    optimizedContent?: string
}

export interface ModelValidationScenarioOptions {
    modelPath: string
    modelContent?: any
    shouldSucceed?: boolean
    errorMessage?: string
    isValid?: boolean
}

// ============================================================================
// FILE SYSTEM SCENARIOS
// ============================================================================

export function setupFileSystemReadSuccessScenario(mocks: DynamiconsAssetsTestMocks, options: FileSystemScenarioOptions): void {
    const { filePath, content = 'file content' } = options
    mocks.fileSystem.readFile.mockImplementation((path: string) => 
        path === filePath ? Promise.resolve(content) : Promise.reject(new Error('File not found'))
    )
    mocks.fileSystem.stat.mockImplementation((path: string) => 
        Promise.resolve({ isFile: () => true, isDirectory: () => false } as any)
    )
}

export function setupFileSystemReadErrorScenario(mocks: DynamiconsAssetsTestMocks, options: FileSystemScenarioOptions): void {
    const { filePath, errorMessage = 'File read error' } = options
    mocks.fileSystem.readFile.mockImplementation((path: string) => 
        path === filePath ? Promise.reject(new Error(errorMessage)) : Promise.resolve('')
    )
}

export function setupFileSystemWriteSuccessScenario(mocks: DynamiconsAssetsTestMocks, options: FileSystemScenarioOptions): void {
    const { filePath } = options
    mocks.fileSystem.writeFile.mockImplementation((path: string) => 
        path === filePath ? Promise.resolve(undefined) : Promise.reject(new Error('File write error'))
    )
}

export function setupFileSystemWriteErrorScenario(mocks: DynamiconsAssetsTestMocks, options: FileSystemScenarioOptions): void {
    const { filePath, errorMessage = 'File write error' } = options
    mocks.fileSystem.writeFile.mockImplementation((path: string) => 
        path === filePath ? Promise.reject(new Error(errorMessage)) : Promise.resolve(undefined)
    )
}

export function setupFileSystemDirectoryScenario(mocks: DynamiconsAssetsTestMocks, options: FileSystemScenarioOptions): void {
    const { filePath, files = [] } = options
    mocks.fileSystem.stat.mockImplementation((path: string) => 
        Promise.resolve({ isFile: () => false, isDirectory: () => true } as any)
    )
    mocks.fileSystem.readdir.mockImplementation((path: string) => 
        Promise.resolve(files)
    )
}

export function setupFileSystemAccessErrorScenario(mocks: DynamiconsAssetsTestMocks, options: FileSystemScenarioOptions): void {
    const { filePath, errorMessage = 'Access denied' } = options
    mocks.fileSystem.access.mockImplementation((path: string) => 
        path === filePath ? Promise.reject(new Error(errorMessage)) : Promise.resolve(undefined)
    )
}

// ============================================================================
// ICON PROCESSING SCENARIOS
// ============================================================================

export function setupIconProcessingSuccessScenario(mocks: DynamiconsAssetsTestMocks, options: IconProcessingScenarioOptions): void {
    const { iconPath, outputPath, optimizedContent = '<svg>optimized</svg>' } = options
    mocks.fileSystem.readFile.mockImplementation((path: string) => 
        path === iconPath ? Promise.resolve('<svg>original</svg>') : Promise.resolve('')
    )
    mocks.fileSystem.writeFile.mockImplementation((path: string) => 
        path === outputPath ? Promise.resolve(undefined) : Promise.resolve(undefined)
    )
    mocks.childProcess.exec.mockImplementation((command: string, callback: any) => {
        callback(null, { stdout: optimizedContent, stderr: '' })
    })
}

export function setupIconProcessingErrorScenario(mocks: DynamiconsAssetsTestMocks, options: IconProcessingScenarioOptions): void {
    const { iconPath, errorMessage = 'Icon processing failed' } = options
    mocks.fileSystem.readFile.mockImplementation((path: string) => 
        path === iconPath ? Promise.reject(new Error(errorMessage)) : Promise.resolve('')
    )
}

// ============================================================================
// ASSET GENERATION SCENARIOS
// ============================================================================

export function setupAssetGenerationSuccessScenario(mocks: DynamiconsAssetsTestMocks, options: AssetGenerationScenarioOptions): void {
    const { sourceDir, outputDir, generatedFiles = ['icon1.svg', 'icon2.svg'] } = options
    mocks.fileSystem.readdir.mockImplementation((path: string) => 
        path === sourceDir ? Promise.resolve(generatedFiles) : Promise.resolve([])
    )
    mocks.fileSystem.mkdir.mockImplementation((path: string) => 
        path === outputDir ? Promise.resolve(undefined) : Promise.resolve(undefined)
    )
    mocks.fileSystem.writeFile.mockResolvedValue(undefined)
}

export function setupAssetGenerationErrorScenario(mocks: DynamiconsAssetsTestMocks, options: AssetGenerationScenarioOptions): void {
    const { sourceDir, errorMessage = 'Asset generation failed' } = options
    mocks.fileSystem.readdir.mockImplementation((path: string) => 
        path === sourceDir ? Promise.reject(new Error(errorMessage)) : Promise.resolve([])
    )
}

// ============================================================================
// ERROR HANDLING SCENARIOS
// ============================================================================

export function setupErrorHandlingSuccessScenario(mocks: DynamiconsAssetsTestMocks, options: ErrorHandlingScenarioOptions): void {
    // Error handling scenarios typically don't need file system mocks
    // They focus on error creation and management
}

export function setupErrorHandlingErrorScenario(mocks: DynamiconsAssetsTestMocks, options: ErrorHandlingScenarioOptions): void {
    const { errorMessage = 'Error handling failed' } = options
    // This would be used for scenarios where error handling itself fails
}

// ============================================================================
// SVGO OPTIMIZATION SCENARIOS
// ============================================================================

export function setupSVGOOptimizationSuccessScenario(mocks: DynamiconsAssetsTestMocks, options: SVGOOptimizationScenarioOptions): void {
    const { inputPath, outputPath, optimizedContent = '<svg>optimized</svg>' } = options
    mocks.fileSystem.readFile.mockImplementation((path: string) => 
        path === inputPath ? Promise.resolve('<svg>original</svg>') : Promise.resolve('')
    )
    mocks.fileSystem.writeFile.mockImplementation((path: string) => 
        path === outputPath ? Promise.resolve(undefined) : Promise.resolve(undefined)
    )
    mocks.childProcess.exec.mockImplementation((command: string, callback: any) => {
        callback(null, { stdout: optimizedContent, stderr: '' })
    })
}

export function setupSVGOOptimizationErrorScenario(mocks: DynamiconsAssetsTestMocks, options: SVGOOptimizationScenarioOptions): void {
    const { inputPath, errorMessage = 'SVGO optimization failed' } = options
    mocks.fileSystem.readFile.mockImplementation((path: string) => 
        path === inputPath ? Promise.resolve('<svg>original</svg>') : Promise.resolve('')
    )
    mocks.childProcess.exec.mockImplementation((command: string, callback: any) => {
        callback(new Error(errorMessage), { stdout: '', stderr: errorMessage })
    })
}

// ============================================================================
// MODEL VALIDATION SCENARIOS
// ============================================================================

export function setupModelValidationSuccessScenario(mocks: DynamiconsAssetsTestMocks, options: ModelValidationScenarioOptions): void {
    const { modelPath, modelContent = { icons: [] } } = options
    mocks.fileSystem.readFile.mockImplementation((path: string) => 
        path === modelPath ? Promise.resolve(JSON.stringify(modelContent)) : Promise.resolve('')
    )
}

export function setupModelValidationErrorScenario(mocks: DynamiconsAssetsTestMocks, options: ModelValidationScenarioOptions): void {
    const { modelPath, errorMessage = 'Model validation failed' } = options
    mocks.fileSystem.readFile.mockImplementation((path: string) => 
        path === modelPath ? Promise.reject(new Error(errorMessage)) : Promise.resolve('')
    )
}

export function setupModelValidationInvalidScenario(mocks: DynamiconsAssetsTestMocks, options: ModelValidationScenarioOptions): void {
    const { modelPath, modelContent = 'invalid json' } = options
    mocks.fileSystem.readFile.mockImplementation((path: string) => 
        path === modelPath ? Promise.resolve(modelContent) : Promise.resolve('')
    )
}

// ============================================================================
// DYNAMICONS ASSETS MOCK BUILDER PATTERN
// ============================================================================

export class DynamiconsAssetsMockBuilder {
    constructor(private mocks: DynamiconsAssetsTestMocks) {}

    fileSystem(options: FileSystemScenarioOptions): DynamiconsAssetsMockBuilder {
        if (options.shouldSucceed === false) {
            if (options.isDirectory) {
                setupFileSystemDirectoryScenario(this.mocks, options)
            } else {
                setupFileSystemReadErrorScenario(this.mocks, options)
            }
        } else {
            setupFileSystemReadSuccessScenario(this.mocks, options)
        }
        return this
    }

    iconProcessing(options: IconProcessingScenarioOptions): DynamiconsAssetsMockBuilder {
        if (options.shouldSucceed === false) {
            setupIconProcessingErrorScenario(this.mocks, options)
        } else {
            setupIconProcessingSuccessScenario(this.mocks, options)
        }
        return this
    }

    assetGeneration(options: AssetGenerationScenarioOptions): DynamiconsAssetsMockBuilder {
        if (options.shouldSucceed === false) {
            setupAssetGenerationErrorScenario(this.mocks, options)
        } else {
            setupAssetGenerationSuccessScenario(this.mocks, options)
        }
        return this
    }

    errorHandling(options: ErrorHandlingScenarioOptions): DynamiconsAssetsMockBuilder {
        if (options.shouldSucceed === false) {
            setupErrorHandlingErrorScenario(this.mocks, options)
        } else {
            setupErrorHandlingSuccessScenario(this.mocks, options)
        }
        return this
    }

    svgoOptimization(options: SVGOOptimizationScenarioOptions): DynamiconsAssetsMockBuilder {
        if (options.shouldSucceed === false) {
            setupSVGOOptimizationErrorScenario(this.mocks, options)
        } else {
            setupSVGOOptimizationSuccessScenario(this.mocks, options)
        }
        return this
    }

    modelValidation(options: ModelValidationScenarioOptions): DynamiconsAssetsMockBuilder {
        if (options.shouldSucceed === false) {
            setupModelValidationErrorScenario(this.mocks, options)
        } else if (options.isValid === false) {
            setupModelValidationInvalidScenario(this.mocks, options)
        } else {
            setupModelValidationSuccessScenario(this.mocks, options)
        }
        return this
    }

    error(service: 'fileSystem' | 'iconProcessing' | 'assetGeneration' | 'errorHandling' | 'svgoOptimization' | 'modelValidation', errorMessage: string): DynamiconsAssetsMockBuilder {
        switch (service) {
            case 'fileSystem':
                setupFileSystemReadErrorScenario(this.mocks, { filePath: '', errorMessage })
                break
            case 'iconProcessing':
                setupIconProcessingErrorScenario(this.mocks, { iconPath: '', outputPath: '', errorMessage })
                break
            case 'assetGeneration':
                setupAssetGenerationErrorScenario(this.mocks, { sourceDir: '', outputDir: '', errorMessage })
                break
            case 'errorHandling':
                setupErrorHandlingErrorScenario(this.mocks, { errorType: '', severity: '', context: '', errorMessage })
                break
            case 'svgoOptimization':
                setupSVGOOptimizationErrorScenario(this.mocks, { inputPath: '', outputPath: '', errorMessage })
                break
            case 'modelValidation':
                setupModelValidationErrorScenario(this.mocks, { modelPath: '', errorMessage })
                break
        }
        return this
    }

    build(): DynamiconsAssetsTestMocks {
        return this.mocks
    }
}

export function createDynamiconsAssetsMockBuilder(mocks: DynamiconsAssetsTestMocks): DynamiconsAssetsMockBuilder {
    return new DynamiconsAssetsMockBuilder(mocks)
}
