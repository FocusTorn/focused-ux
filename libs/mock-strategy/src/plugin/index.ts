// Plugin Package Mock Strategy Library
// Provides standardized mock interfaces and helpers for Nx plugin packages

import { vi } from 'vitest'

export interface PluginTestMocks {
    fileSystem: {
        readFile: ReturnType<typeof vi.fn>
        writeFile: ReturnType<typeof vi.fn>
        stat: ReturnType<typeof vi.fn>
        copyFile: ReturnType<typeof vi.fn>
        access: ReturnType<typeof vi.fn>
        readdir: ReturnType<typeof vi.fn>
        mkdir: ReturnType<typeof vi.fn>
        rmdir: ReturnType<typeof vi.fn>
        unlink: ReturnType<typeof vi.fn>
    }
    path: {
        dirname: ReturnType<typeof vi.fn>
        basename: ReturnType<typeof vi.fn>
        join: ReturnType<typeof vi.fn>
        resolve: ReturnType<typeof vi.fn>
        extname: ReturnType<typeof vi.fn>
        sep: string
    }
    process: {
        argv: string[]
        exit: ReturnType<typeof vi.fn>
        env: Record<string, string>
        cwd: ReturnType<typeof vi.fn>
        platform: string
    }
    childProcess: {
        spawn: ReturnType<typeof vi.fn>
        spawnSync: ReturnType<typeof vi.fn>
        exec: ReturnType<typeof vi.fn>
        execSync: ReturnType<typeof vi.fn>
    }
    nx: {
        workspaceRoot: string
        projectGraph: any
        projects: Record<string, any>
        runCommand: ReturnType<typeof vi.fn>
        generateFiles: ReturnType<typeof vi.fn>
        readProjectConfiguration: ReturnType<typeof vi.fn>
        updateProjectConfiguration: ReturnType<typeof vi.fn>
        addProjectConfiguration: ReturnType<typeof vi.fn>
        removeProjectConfiguration: ReturnType<typeof vi.fn>
        getProjects: ReturnType<typeof vi.fn>
        getProjectGraph: ReturnType<typeof vi.fn>
        readNxJson: ReturnType<typeof vi.fn>
        updateNxJson: ReturnType<typeof vi.fn>
        readWorkspaceConfiguration: ReturnType<typeof vi.fn>
        updateWorkspaceConfiguration: ReturnType<typeof vi.fn>
    }
    logger: {
        info: ReturnType<typeof vi.fn>
        warn: ReturnType<typeof vi.fn>
        error: ReturnType<typeof vi.fn>
        debug: ReturnType<typeof vi.fn>
        log: ReturnType<typeof vi.fn>
    }
    tree: {
        read: ReturnType<typeof vi.fn>
        write: ReturnType<typeof vi.fn>
        exists: ReturnType<typeof vi.fn>
        delete: ReturnType<typeof vi.fn>
        rename: ReturnType<typeof vi.fn>
        children: ReturnType<typeof vi.fn>
        listChanges: ReturnType<typeof vi.fn>
        applyChanges: ReturnType<typeof vi.fn>
    }
    workspace: {
        readWorkspaceConfiguration: ReturnType<typeof vi.fn>
        updateWorkspaceConfiguration: ReturnType<typeof vi.fn>
        readNxJson: ReturnType<typeof vi.fn>
        updateNxJson: ReturnType<typeof vi.fn>
    }
}

export function setupPluginTestEnvironment(): PluginTestMocks {
    return {
        fileSystem: {
            readFile: vi.fn(),
            writeFile: vi.fn(),
            stat: vi.fn(),
            copyFile: vi.fn(),
            access: vi.fn(),
            readdir: vi.fn(),
            mkdir: vi.fn(),
            rmdir: vi.fn(),
            unlink: vi.fn(),
        },
        path: {
            dirname: vi.fn(),
            basename: vi.fn(),
            join: vi.fn(),
            resolve: vi.fn(),
            extname: vi.fn(),
            sep: '/',
        },
        process: {
            argv: ['nx', 'generate', 'plugin:generator'],
            exit: vi.fn(),
            env: {},
            cwd: vi.fn(),
            platform: 'linux',
        },
        childProcess: {
            spawn: vi.fn(),
            spawnSync: vi.fn(),
            exec: vi.fn(),
            execSync: vi.fn(),
        },
        nx: {
            workspaceRoot: '/test/workspace',
            projectGraph: {},
            projects: {},
            runCommand: vi.fn(),
            generateFiles: vi.fn(),
            readProjectConfiguration: vi.fn(),
            updateProjectConfiguration: vi.fn(),
            addProjectConfiguration: vi.fn(),
            removeProjectConfiguration: vi.fn(),
            getProjects: vi.fn(),
            getProjectGraph: vi.fn(),
            readNxJson: vi.fn(),
            updateNxJson: vi.fn(),
            readWorkspaceConfiguration: vi.fn(),
            updateWorkspaceConfiguration: vi.fn(),
        },
        logger: {
            info: vi.fn(),
            warn: vi.fn(),
            error: vi.fn(),
            debug: vi.fn(),
            log: vi.fn(),
        },
        tree: {
            read: vi.fn(),
            write: vi.fn(),
            exists: vi.fn(),
            delete: vi.fn(),
            rename: vi.fn(),
            children: vi.fn(),
            listChanges: vi.fn(),
            applyChanges: vi.fn(),
        },
        workspace: {
            readWorkspaceConfiguration: vi.fn(),
            updateWorkspaceConfiguration: vi.fn(),
            readNxJson: vi.fn(),
            updateNxJson: vi.fn(),
        },
    }
}

export function setupPluginFileSystemMocks(mocks: PluginTestMocks): void {
    mocks.fileSystem.readFile.mockResolvedValue('file content')
    mocks.fileSystem.writeFile.mockResolvedValue(undefined)
    mocks.fileSystem.stat.mockResolvedValue({ type: 'file' as const })
    mocks.fileSystem.copyFile.mockResolvedValue(undefined)
    mocks.fileSystem.access.mockResolvedValue(undefined)
    mocks.fileSystem.readdir.mockResolvedValue([])
    mocks.fileSystem.mkdir.mockResolvedValue(undefined)
    mocks.fileSystem.rmdir.mockResolvedValue(undefined)
    mocks.fileSystem.unlink.mockResolvedValue(undefined)
}

export function setupPluginNxMocks(mocks: PluginTestMocks): void {
    // Mock Nx workspace operations
    mocks.nx.readProjectConfiguration.mockReturnValue({
        name: 'test-project',
        root: 'test-project',
        sourceRoot: 'test-project/src',
        projectType: 'library',
        targets: {
            build: {
                executor: '@nx/esbuild:esbuild',
                options: {},
            },
        },
    })
    
    mocks.nx.updateProjectConfiguration.mockReturnValue(undefined)
    mocks.nx.addProjectConfiguration.mockReturnValue(undefined)
    mocks.nx.removeProjectConfiguration.mockReturnValue(undefined)
    
    mocks.nx.getProjects.mockReturnValue(new Map([
        ['test-project', {
            name: 'test-project',
            root: 'test-project',
            sourceRoot: 'test-project/src',
            projectType: 'library',
        }],
    ]))
    
    mocks.nx.getProjectGraph.mockReturnValue({
        nodes: {},
        dependencies: {},
        externalNodes: {},
    })
    
    mocks.nx.readNxJson.mockReturnValue({
        version: 2,
        projects: {},
    })
    
    mocks.nx.updateNxJson.mockReturnValue(undefined)
    
    mocks.nx.readWorkspaceConfiguration.mockReturnValue({
        version: 2,
        projects: {},
    })
    
    mocks.nx.updateWorkspaceConfiguration.mockReturnValue(undefined)
    
    mocks.nx.runCommand.mockResolvedValue({ success: true })
    mocks.nx.generateFiles.mockReturnValue(undefined)
}

export function setupPluginTreeMocks(mocks: PluginTestMocks): void {
    mocks.tree.read.mockReturnValue('file content')
    mocks.tree.write.mockReturnValue(undefined)
    mocks.tree.exists.mockReturnValue(true)
    mocks.tree.delete.mockReturnValue(undefined)
    mocks.tree.rename.mockReturnValue(undefined)
    mocks.tree.children.mockReturnValue(['file1.ts', 'file2.ts'])
    mocks.tree.listChanges.mockReturnValue([])
    mocks.tree.applyChanges.mockReturnValue(undefined)
}

export function setupPluginLoggerMocks(mocks: PluginTestMocks): void {
    mocks.logger.info.mockImplementation((message) => console.log(`INFO: ${message}`))
    mocks.logger.warn.mockImplementation((message) => console.warn(`WARN: ${message}`))
    mocks.logger.error.mockImplementation((message) => console.error(`ERROR: ${message}`))
    mocks.logger.debug.mockImplementation((message) => console.debug(`DEBUG: ${message}`))
    mocks.logger.log.mockImplementation((message) => console.log(`LOG: ${message}`))
}

export function resetPluginMocks(mocks: PluginTestMocks): void {
    Object.values(mocks.fileSystem).forEach((mock) => mock.mockReset())
    Object.values(mocks.path).forEach((mock) => {
        if (typeof mock === 'function') {
            mock.mockReset()
        }
    })
    Object.values(mocks.process).forEach((mock) => {
        if (typeof mock === 'function') {
            mock.mockReset()
        }
    })
    Object.values(mocks.childProcess).forEach((mock) => mock.mockReset())
    Object.values(mocks.nx).forEach((mock) => {
        if (typeof mock === 'function') {
            mock.mockReset()
        }
    })
    Object.values(mocks.logger).forEach((mock) => mock.mockReset())
    Object.values(mocks.tree).forEach((mock) => mock.mockReset())
    Object.values(mocks.workspace).forEach((mock) => mock.mockReset())
}

// Generator Scenarios
export interface GeneratorScenarioOptions {
    projectName?: string
    options?: Record<string, any>
    shouldSucceed?: boolean
    errorMessage?: string
}

export function setupGeneratorSuccessScenario(
    mocks: PluginTestMocks,
    options: GeneratorScenarioOptions = {}
): void {
    const { projectName = 'test-project', options: generatorOptions = {} } = options

    // Mock successful file generation
    mocks.tree.write.mockReturnValue(undefined)
    mocks.tree.exists.mockReturnValue(false)
    mocks.tree.children.mockReturnValue([])
    
    // Mock successful project configuration
    mocks.nx.readProjectConfiguration.mockReturnValue({
        name: projectName,
        root: projectName,
        sourceRoot: `${projectName}/src`,
        projectType: 'library',
        targets: {},
    })
    
    mocks.nx.updateProjectConfiguration.mockReturnValue(undefined)
    
    // Mock successful logging
    mocks.logger.info.mockImplementation(() => {})
}

export function setupGeneratorErrorScenario(
    mocks: PluginTestMocks,
    options: GeneratorScenarioOptions = {}
): void {
    const { errorMessage = 'Generator failed' } = options

    // Mock file system errors
    mocks.tree.write.mockImplementation(() => {
        throw new Error(errorMessage)
    })
    
    // Mock project configuration errors
    mocks.nx.readProjectConfiguration.mockImplementation(() => {
        throw new Error(errorMessage)
    })
    
    // Mock error logging
    mocks.logger.error.mockImplementation((message) => {
        throw new Error(message)
    })
}

// Executor Scenarios
export interface ExecutorScenarioOptions {
    projectName?: string
    target?: string
    options?: Record<string, any>
    shouldSucceed?: boolean
    exitCode?: number
    output?: string
    error?: string
}

export function setupExecutorSuccessScenario(
    mocks: PluginTestMocks,
    options: ExecutorScenarioOptions = {}
): void {
    const { projectName = 'test-project', target = 'build', output = 'Build successful' } = options

    // Mock successful command execution
    mocks.nx.runCommand.mockResolvedValue({
        success: true,
        output,
    })
    
    // Mock successful project configuration
    mocks.nx.readProjectConfiguration.mockReturnValue({
        name: projectName,
        root: projectName,
        sourceRoot: `${projectName}/src`,
        projectType: 'library',
        targets: {
            [target]: {
                executor: '@nx/esbuild:esbuild',
                options: {},
            },
        },
    })
    
    // Mock successful logging
    mocks.logger.info.mockImplementation(() => {})
}

export function setupExecutorErrorScenario(
    mocks: PluginTestMocks,
    options: ExecutorScenarioOptions = {}
): void {
    const { projectName = 'test-project', target = 'build', error = 'Executor failed', exitCode = 1 } = options

    // Mock failed command execution
    mocks.nx.runCommand.mockResolvedValue({
        success: false,
        error,
        exitCode,
    })
    
    // Mock project configuration errors
    mocks.nx.readProjectConfiguration.mockImplementation(() => {
        throw new Error(error)
    })
    
    // Mock error logging
    mocks.logger.error.mockImplementation((message) => {
        throw new Error(message)
    })
}

// Fluent Builder Pattern
export class PluginMockBuilder {

    constructor(private mocks: PluginTestMocks) {}

    generatorSuccess(options: GeneratorScenarioOptions = {}): PluginMockBuilder {
        setupGeneratorSuccessScenario(this.mocks, options)
        return this
    }

    generatorError(options: GeneratorScenarioOptions = {}): PluginMockBuilder {
        setupGeneratorErrorScenario(this.mocks, options)
        return this
    }

    executorSuccess(options: ExecutorScenarioOptions = {}): PluginMockBuilder {
        setupExecutorSuccessScenario(this.mocks, options)
        return this
    }

    executorError(options: ExecutorScenarioOptions = {}): PluginMockBuilder {
        setupExecutorErrorScenario(this.mocks, options)
        return this
    }

    windowsPath(): PluginMockBuilder {
        this.mocks.path.sep = '\\'
        this.mocks.path.join.mockImplementation((...paths: string[]) => paths.join('\\'))
        this.mocks.path.dirname.mockImplementation(
            (path: string) => path.split('\\').slice(0, -1).join('\\') || '.'
        )
        this.mocks.process.platform = 'win32'
        return this
    }

    unixPath(): PluginMockBuilder {
        this.mocks.path.sep = '/'
        this.mocks.path.join.mockImplementation((...paths: string[]) => paths.join('/'))
        this.mocks.path.dirname.mockImplementation(
            (path: string) => path.split('/').slice(0, -1).join('/') || '.'
        )
        this.mocks.process.platform = 'linux'
        return this
    }

    build(): PluginTestMocks {
        return this.mocks
    }

}

export function createPluginMockBuilder(mocks: PluginTestMocks): PluginMockBuilder {
    return new PluginMockBuilder(mocks)
}
