import { vi } from 'vitest'
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
export function setupPaeConfigExistsScenario(
    mocks: PaeTestMocks,
    options: PaeConfigScenarioOptions
): void {
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

export function setupPaeConfigNotExistsScenario(
    mocks: PaeTestMocks,
    _options: PaeConfigScenarioOptions
): void {
    mocks.fs.existsSync.mockReturnValue(false)
}

export function setupPaeCommandSuccessScenario(
    mocks: PaeTestMocks,
    options: PaeCommandScenarioOptions
): void {
    mocks.childProcess.spawnSync.mockReturnValue({
        status: options.exitCode || 0,
        signal: null,
        output: [''],
        pid: 123,
        stdout: Buffer.from(options.stdout || 'success'),
        stderr: Buffer.from(options.stderr || ''),
        error: undefined
    })
    mocks.childProcess.execSync.mockReturnValue(Buffer.from(options.stdout || 'success'))
}

export function setupPaeCommandFailureScenario(
    mocks: PaeTestMocks,
    options: PaeCommandScenarioOptions
): void {
    mocks.childProcess.spawnSync.mockReturnValue({
        status: options.exitCode || 1,
        signal: null,
        output: [''],
        pid: 123,
        stdout: Buffer.from(options.stdout || ''),
        stderr: Buffer.from(options.stderr || 'error'),
        error: new Error(options.error || 'Command failed')
    })
    mocks.childProcess.execSync.mockImplementation(() => {
        throw new Error(options.error || 'Command failed')
    })
}

export function setupPaeAliasResolutionScenario(
    mocks: PaeTestMocks,
    options: PaeAliasScenarioOptions
): void {
    const configContent = JSON.stringify({
        'nxPackages': {
            [options.alias]: options.isFull
                ? { name: options.project.replace('@fux/', ''), full: true }
                : options.project
        }
    })
    
    setupPaeConfigExistsScenario(mocks, {
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
    constructor(private mocks: PaeTestMocks) {}

    configExists(options: PaeConfigScenarioOptions): PaeMockBuilder {
        setupPaeConfigExistsScenario(this.mocks, options)
        return this
    }

    configNotExists(options: PaeConfigScenarioOptions): PaeMockBuilder {
        setupPaeConfigNotExistsScenario(this.mocks, options)
        return this
    }

    commandSuccess(options: PaeCommandScenarioOptions): PaeMockBuilder {
        setupPaeCommandSuccessScenario(this.mocks, options)
        return this
    }

    commandFailure(options: PaeCommandScenarioOptions): PaeMockBuilder {
        setupPaeCommandFailureScenario(this.mocks, options)
        return this
    }

    aliasResolution(options: PaeAliasScenarioOptions): PaeMockBuilder {
        setupPaeAliasResolutionScenario(this.mocks, options)
        return this
    }

    cliConfig(options: PaeCliConfigScenarioOptions = {}): PaeMockBuilder {
        setupPaeCliConfigScenario(this.mocks, options)
        return this
    }

    // File system scenarios
    fileExists(path: string, exists: boolean = true): PaeMockBuilder {
        this.mocks.fs.existsSync.mockImplementation((p: string) => p === path ? exists : false)
        return this
    }

    fileContent(path: string, content: string): PaeMockBuilder {
        this.mocks.fs.readFileSync.mockImplementation((p: string) => p === path ? content : '{}')
        return this
    }

    // Path scenarios
    pathJoin(...paths: string[]): PaeMockBuilder {
        this.mocks.path.join.mockImplementation((...args: string[]) => args.join('/'))
        return this
    }

    pathResolve(...paths: string[]): PaeMockBuilder {
        this.mocks.path.resolve.mockImplementation((...args: string[]) => '/' + args.join('/'))
        return this
    }

    // Process scenarios
    processArgv(argv: string[]): PaeMockBuilder {
        this.mocks.process.argv = argv
        return this
    }

    processEnv(env: Record<string, string>): PaeMockBuilder {
        this.mocks.process.env = env
        return this
    }

    // Shell scenarios
    shellType(type: 'pwsh' | 'linux' | 'cmd'): PaeMockBuilder {
        this.mocks.os.platform.mockReturnValue(type === 'linux' ? 'linux' : 'win32')
        return this
    }

    build(): PaeTestMocks {
        return this.mocks
    }
}

export function createPaeMockBuilder(mocks?: PaeTestMocks): PaeMockBuilder {
    const testMocks = mocks || setupPaeTestEnvironment()
    return new PaeMockBuilder(testMocks)
}

