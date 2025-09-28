import { vi } from 'vitest'

// Conditional import for testing only
let mockStrategy: any = null

async function getMockStrategy() {
    if (!mockStrategy) {
        try {
            mockStrategy = await import('../../../mock-strategy/dist/index.js')
        } catch (_error) {
            console.log('\x1b[31m❌ Import failed. mock-strategy/dist/index.js\x1b[0m')
        }
        // } catch {
        //     // Fallback to a mock implementation for testing
        //     mockStrategy = {
        //         setupProcessSuccessScenario: vi.fn(),
        //         setupProcessErrorScenario: vi.fn(),
        //         setupLibFileReadScenario: vi.fn(),
        //         setupLibFileWriteScenario: vi.fn(),
        //         createLibMockBuilder: vi.fn()
        //     }
        // }
    }
    return mockStrategy
}

import { PaeTestMocks, setupPaeTestEnvironment } from './helpers'

// PAE-specific scenario interfaces
export interface PaeConfigScenarioOptions {
    configPath: string
    configContent: string
    shouldExist?: boolean
}

export interface PaeCommandScenarioOptions {
    command: string
    args?: string[]
    exitCode?: number
    stdout?: string
    stderr?: string
    error?: string
}

export interface PaeAliasScenarioOptions {
    alias: string
    project: string
    target: string
    isFull?: boolean
}

export interface PaeCliConfigScenarioOptions {
    nxPackages?: Record<string, { targets: string[] }>
    nxTargets?: Record<string, string[]>
    notNxTargets?: string[]
    expandableFlags?: Record<string, string>
    configPath?: string
}

// PAE-specific scenario functions
export async function setupPaeConfigExistsScenario(
    mocks: PaeTestMocks,
    options: PaeConfigScenarioOptions
): Promise<void> {
    mocks.fs.existsSync.mockReturnValue(true)
    mocks.fs.readFileSync.mockReturnValue(options.configContent)
    mocks.stripJsonComments.mockImplementation(() => {
        try {
            return JSON.parse(options.configContent)
        } catch {
            throw new Error('Invalid JSON')
        }
    })
}

export async function setupPaeConfigNotExistsScenario(
    mocks: PaeTestMocks,
    _options: PaeConfigScenarioOptions
): Promise<void> {
    mocks.fs.existsSync.mockReturnValue(false)
}

export async function setupPaeCommandSuccessScenario(
    mocks: PaeTestMocks,
    options: PaeCommandScenarioOptions
): Promise<void> {
    const strategy = await getMockStrategy()
    strategy.setupProcessSuccessScenario(mocks, {
        command: options.command,
        args: options.args || [],
        exitCode: options.exitCode || 0,
        stdout: options.stdout || 'success',
        stderr: options.stderr || '',
    })
}

export async function setupPaeCommandFailureScenario(
    mocks: PaeTestMocks,
    options: PaeCommandScenarioOptions
): Promise<void> {
    const strategy = await getMockStrategy()
    strategy.setupProcessErrorScenario(mocks, {
        command: options.command,
        args: options.args || [],
        exitCode: options.exitCode || 1,
        stdout: options.stdout || '',
        stderr: options.stderr || 'error',
        error: options.error || 'Command failed',
    })
}

export async function setupPaeAliasResolutionScenario(
    mocks: PaeTestMocks,
    options: PaeAliasScenarioOptions
): Promise<void> {
    const configContent = JSON.stringify({
        'nxPackages': {
            [options.alias]: options.isFull
                ? { name: options.project.replace('@fux/', ''), full: true }
                : options.project
        }
    })
    
    await setupPaeConfigExistsScenario(mocks, {
        configPath: '/config.json',
        configContent,
    })
}

export function setupPaeCliConfigScenario(
    mocks: PaeTestMocks,
    options: PaeCliConfigScenarioOptions = {}
): void {
    const {
        nxPackages = { 'test-package': { targets: ['build'] } },
        nxTargets = { 'test-package': ['build', 'test'] },
        notNxTargets = ['help', 'version'],
        expandableFlags = { test: 'test-package' },
        configPath = '/config.json'
    } = options

    const mockConfig = {
        'nxPackages': nxPackages,
        'nxTargets': nxTargets,
        'not-nxTargets': notNxTargets,
        'expandable-flags': expandableFlags,
    }

    const configContent = JSON.stringify(mockConfig)
    
    mocks.fs.existsSync.mockReturnValue(true)
    mocks.fs.readFileSync.mockReturnValue(configContent)
    mocks.stripJsonComments.mockImplementation(() => {
        try {
            return JSON.parse(configContent)
        } catch {
            throw new Error('Invalid JSON')
        }
    })
}

// Enhanced PAE Mock Builder Pattern
export class PaeMockBuilder {

    private libBuilder: any = null

    constructor(private mocks: PaeTestMocks) {}

    private async getLibBuilder() {
        if (!this.libBuilder) {
            const strategy = await getMockStrategy()
            this.libBuilder = strategy.createLibMockBuilder(this.mocks)
        }
        return this.libBuilder
    }

    async configExists(options: PaeConfigScenarioOptions): Promise<PaeMockBuilder> {
        await setupPaeConfigExistsScenario(this.mocks, options)
        return this
    }

    async configNotExists(options: PaeConfigScenarioOptions): Promise<PaeMockBuilder> {
        await setupPaeConfigNotExistsScenario(this.mocks, options)
        return this
    }

    async commandSuccess(options: PaeCommandScenarioOptions): Promise<PaeMockBuilder> {
        await setupPaeCommandSuccessScenario(this.mocks, options)
        return this
    }

    async commandFailure(options: PaeCommandScenarioOptions): Promise<PaeMockBuilder> {
        await setupPaeCommandFailureScenario(this.mocks, options)
        return this
    }

    async aliasResolution(options: PaeAliasScenarioOptions): Promise<PaeMockBuilder> {
        await setupPaeAliasResolutionScenario(this.mocks, options)
        return this
    }

    // Delegate to lib builder for common scenarios
    async processSuccess(options: any): Promise<PaeMockBuilder> {
        const libBuilder = await this.getLibBuilder()
        libBuilder.processSuccess(options)
        return this
    }

    async processError(options: any): Promise<PaeMockBuilder> {
        const libBuilder = await this.getLibBuilder()
        libBuilder.processError(options)
        return this
    }

    async fileRead(options: any): Promise<PaeMockBuilder> {
        const libBuilder = await this.getLibBuilder()
        libBuilder.fileRead(options)
        return this
    }

    async fileWrite(options: any): Promise<PaeMockBuilder> {
        const libBuilder = await this.getLibBuilder()
        libBuilder.fileWrite(options)
        return this
    }

    async windowsPath(): Promise<PaeMockBuilder> {
        const libBuilder = await this.getLibBuilder()
        libBuilder.windowsPath()
        return this
    }

    async unixPath(): Promise<PaeMockBuilder> {
        const libBuilder = await this.getLibBuilder()
        libBuilder.unixPath()
        return this
    }

    cliConfig(options: PaeCliConfigScenarioOptions = {}): PaeMockBuilder {
        setupPaeCliConfigScenario(this.mocks, options)
        return this
    }

    build(): PaeTestMocks {
        return this.mocks
    }

}

export async function createPaeMockBuilder(mocks?: PaeTestMocks): Promise<PaeMockBuilder> {
    const testMocks = mocks || await setupPaeTestEnvironment()
    return new PaeMockBuilder(testMocks)
}

