import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
    PluginTestMocks,
    setupPluginTestEnvironment,
    setupPluginFileSystemMocks,
    setupPluginNxMocks,
    setupPluginTreeMocks,
    setupPluginLoggerMocks,
    resetPluginMocks,
    setupGeneratorSuccessScenario,
    setupGeneratorErrorScenario,
    setupExecutorSuccessScenario,
    setupExecutorErrorScenario,
    PluginMockBuilder,
    createPluginMockBuilder,
} from '../../src/plugin/index.js'

describe('Plugin Package Mock Strategy', () => {
    let mocks: PluginTestMocks

    beforeEach(() => {
        mocks = setupPluginTestEnvironment()
    })

    describe('setupPluginTestEnvironment', () => {
        it('should create all required mock functions', () => {
            // File System
            expect(mocks.fileSystem.readFile).toBeDefined()
            expect(mocks.fileSystem.writeFile).toBeDefined()
            expect(mocks.fileSystem.stat).toBeDefined()
            expect(mocks.fileSystem.copyFile).toBeDefined()
            expect(mocks.fileSystem.access).toBeDefined()
            expect(mocks.fileSystem.readdir).toBeDefined()
            expect(mocks.fileSystem.mkdir).toBeDefined()
            expect(mocks.fileSystem.rmdir).toBeDefined()
            expect(mocks.fileSystem.unlink).toBeDefined()

            // Path
            expect(mocks.path.dirname).toBeDefined()
            expect(mocks.path.basename).toBeDefined()
            expect(mocks.path.join).toBeDefined()
            expect(mocks.path.resolve).toBeDefined()
            expect(mocks.path.extname).toBeDefined()
            expect(mocks.path.sep).toBeDefined()

            // Process
            expect(mocks.process.argv).toBeDefined()
            expect(mocks.process.exit).toBeDefined()
            expect(mocks.process.env).toBeDefined()
            expect(mocks.process.cwd).toBeDefined()
            expect(mocks.process.platform).toBeDefined()

            // Child Process
            expect(mocks.childProcess.spawn).toBeDefined()
            expect(mocks.childProcess.spawnSync).toBeDefined()
            expect(mocks.childProcess.exec).toBeDefined()
            expect(mocks.childProcess.execSync).toBeDefined()

            // Nx
            expect(mocks.nx.workspaceRoot).toBeDefined()
            expect(mocks.nx.projectGraph).toBeDefined()
            expect(mocks.nx.projects).toBeDefined()
            expect(mocks.nx.runCommand).toBeDefined()
            expect(mocks.nx.generateFiles).toBeDefined()
            expect(mocks.nx.readProjectConfiguration).toBeDefined()
            expect(mocks.nx.updateProjectConfiguration).toBeDefined()
            expect(mocks.nx.addProjectConfiguration).toBeDefined()
            expect(mocks.nx.removeProjectConfiguration).toBeDefined()
            expect(mocks.nx.getProjects).toBeDefined()
            expect(mocks.nx.getProjectGraph).toBeDefined()
            expect(mocks.nx.readNxJson).toBeDefined()
            expect(mocks.nx.updateNxJson).toBeDefined()
            expect(mocks.nx.readWorkspaceConfiguration).toBeDefined()
            expect(mocks.nx.updateWorkspaceConfiguration).toBeDefined()

            // Logger
            expect(mocks.logger.info).toBeDefined()
            expect(mocks.logger.warn).toBeDefined()
            expect(mocks.logger.error).toBeDefined()
            expect(mocks.logger.debug).toBeDefined()
            expect(mocks.logger.log).toBeDefined()

            // Tree
            expect(mocks.tree.read).toBeDefined()
            expect(mocks.tree.write).toBeDefined()
            expect(mocks.tree.exists).toBeDefined()
            expect(mocks.tree.delete).toBeDefined()
            expect(mocks.tree.rename).toBeDefined()
            expect(mocks.tree.children).toBeDefined()
            expect(mocks.tree.listChanges).toBeDefined()
            expect(mocks.tree.applyChanges).toBeDefined()

            // Workspace
            expect(mocks.workspace.readWorkspaceConfiguration).toBeDefined()
            expect(mocks.workspace.updateWorkspaceConfiguration).toBeDefined()
            expect(mocks.workspace.readNxJson).toBeDefined()
            expect(mocks.workspace.updateNxJson).toBeDefined()
        })

        it('should create vi.fn() instances', () => {
            expect(vi.isMockFunction(mocks.fileSystem.readFile)).toBe(true)
            expect(vi.isMockFunction(mocks.path.join)).toBe(true)
            expect(vi.isMockFunction(mocks.process.exit)).toBe(true)
            expect(vi.isMockFunction(mocks.childProcess.spawn)).toBe(true)
            expect(vi.isMockFunction(mocks.nx.runCommand)).toBe(true)
            expect(vi.isMockFunction(mocks.logger.info)).toBe(true)
            expect(vi.isMockFunction(mocks.tree.read)).toBe(true)
            expect(vi.isMockFunction(mocks.workspace.readWorkspaceConfiguration)).toBe(true)
        })

        it('should set up default values', () => {
            expect(mocks.path.sep).toBe('/')
            expect(mocks.process.argv).toEqual(['nx', 'generate', 'plugin:generator'])
            expect(mocks.process.env).toEqual({})
            expect(mocks.process.platform).toBe('linux')
            expect(mocks.nx.workspaceRoot).toBe('/test/workspace')
            expect(mocks.nx.projectGraph).toEqual({})
            expect(mocks.nx.projects).toEqual({})
        })
    })

    describe('setupPluginFileSystemMocks', () => {
        beforeEach(() => {
            setupPluginFileSystemMocks(mocks)
        })

        it('should set up file system mock implementations', async () => {
            const content = await mocks.fileSystem.readFile('test.txt')
            expect(content).toBe('file content')

            await expect(mocks.fileSystem.writeFile('test.txt', 'content')).resolves.toBeUndefined()

            const stat = await mocks.fileSystem.stat('test.txt')
            expect(stat).toEqual({ type: 'file' })

            await expect(mocks.fileSystem.copyFile('src.txt', 'dest.txt')).resolves.toBeUndefined()
            await expect(mocks.fileSystem.access('test.txt')).resolves.toBeUndefined()
            await expect(mocks.fileSystem.readdir('dir')).resolves.toEqual([])
            await expect(mocks.fileSystem.mkdir('dir')).resolves.toBeUndefined()
            await expect(mocks.fileSystem.rmdir('dir')).resolves.toBeUndefined()
            await expect(mocks.fileSystem.unlink('file.txt')).resolves.toBeUndefined()
        })
    })

    describe('setupPluginNxMocks', () => {
        beforeEach(() => {
            setupPluginNxMocks(mocks)
        })

        it('should set up Nx workspace operations', () => {
            const config = mocks.nx.readProjectConfiguration('test-project')
            expect(config).toEqual({
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

            expect(mocks.nx.updateProjectConfiguration('test-project', config)).toBeUndefined()
            expect(mocks.nx.addProjectConfiguration('test-project', config)).toBeUndefined()
            expect(mocks.nx.removeProjectConfiguration('test-project')).toBeUndefined()
        })

        it('should set up projects map', () => {
            const projects = mocks.nx.getProjects()
            expect(projects).toBeInstanceOf(Map)
            expect(projects.has('test-project')).toBe(true)
            expect(projects.get('test-project')).toEqual({
                name: 'test-project',
                root: 'test-project',
                sourceRoot: 'test-project/src',
                projectType: 'library',
            })
        })

        it('should set up project graph', () => {
            const graph = mocks.nx.getProjectGraph()
            expect(graph).toEqual({
                nodes: {},
                dependencies: {},
                externalNodes: {},
            })
        })

        it('should set up Nx configuration', () => {
            const nxJson = mocks.nx.readNxJson()
            expect(nxJson).toEqual({
                version: 2,
                projects: {},
            })

            expect(mocks.nx.updateNxJson(nxJson)).toBeUndefined()
        })

        it('should set up workspace configuration', () => {
            const workspaceConfig = mocks.nx.readWorkspaceConfiguration()
            expect(workspaceConfig).toEqual({
                version: 2,
                projects: {},
            })

            expect(mocks.nx.updateWorkspaceConfiguration(workspaceConfig)).toBeUndefined()
        })

        it('should set up command execution', async () => {
            const result = await mocks.nx.runCommand('build')
            expect(result).toEqual({ success: true })

            expect(mocks.nx.generateFiles({}, 'test-project', {})).toBeUndefined()
        })
    })

    describe('setupPluginTreeMocks', () => {
        beforeEach(() => {
            setupPluginTreeMocks(mocks)
        })

        it('should set up tree mock implementations', () => {
            expect(mocks.tree.read('file.txt')).toBe('file content')
            expect(mocks.tree.write('file.txt', 'content')).toBeUndefined()
            expect(mocks.tree.exists('file.txt')).toBe(true)
            expect(mocks.tree.delete('file.txt')).toBeUndefined()
            expect(mocks.tree.rename('old.txt', 'new.txt')).toBeUndefined()
            expect(mocks.tree.children('dir')).toEqual(['file1.ts', 'file2.ts'])
            expect(mocks.tree.listChanges()).toEqual([])
            expect(mocks.tree.applyChanges([])).toBeUndefined()
        })
    })

    describe('setupPluginLoggerMocks', () => {
        beforeEach(() => {
            setupPluginLoggerMocks(mocks)
        })

        it('should set up logger mock implementations', () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
            const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
            const consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {})

            mocks.logger.info('test message')
            expect(consoleSpy).toHaveBeenCalledWith('INFO: test message')

            mocks.logger.warn('test warning')
            expect(consoleWarnSpy).toHaveBeenCalledWith('WARN: test warning')

            mocks.logger.error('test error')
            expect(consoleErrorSpy).toHaveBeenCalledWith('ERROR: test error')

            mocks.logger.debug('test debug')
            expect(consoleDebugSpy).toHaveBeenCalledWith('DEBUG: test debug')

            mocks.logger.log('test log')
            expect(consoleSpy).toHaveBeenCalledWith('LOG: test log')

            consoleSpy.mockRestore()
            consoleWarnSpy.mockRestore()
            consoleErrorSpy.mockRestore()
            consoleDebugSpy.mockRestore()
        })
    })

    describe('resetPluginMocks', () => {
        beforeEach(() => {
            setupPluginFileSystemMocks(mocks)
            setupPluginNxMocks(mocks)
            setupPluginTreeMocks(mocks)
            setupPluginLoggerMocks(mocks)
        })

        it('should reset all mock functions', () => {
            // Call some mocks first
            mocks.fileSystem.readFile('test.txt')
            mocks.nx.readProjectConfiguration('test-project')
            mocks.tree.read('file.txt')
            mocks.logger.info('test')

            // Reset mocks
            resetPluginMocks(mocks)

            // Verify mocks were reset
            expect(mocks.fileSystem.readFile).toHaveBeenCalledTimes(0)
            expect(mocks.nx.readProjectConfiguration).toHaveBeenCalledTimes(0)
            expect(mocks.tree.read).toHaveBeenCalledTimes(0)
            expect(mocks.logger.info).toHaveBeenCalledTimes(0)
        })
    })

    describe('Generator Scenarios', () => {
        describe('setupGeneratorSuccessScenario', () => {
            it('should set up successful generator execution', () => {
                setupGeneratorSuccessScenario(mocks, {
                    projectName: 'my-project',
                    options: { name: 'test-component' },
                })

                expect(mocks.tree.write('file.txt', 'content')).toBeUndefined()
                expect(mocks.tree.exists('file.txt')).toBe(false)
                expect(mocks.tree.children('dir')).toEqual([])

                const config = mocks.nx.readProjectConfiguration('my-project')
                expect(config).toEqual({
                    name: 'my-project',
                    root: 'my-project',
                    sourceRoot: 'my-project/src',
                    projectType: 'library',
                    targets: {},
                })

                expect(mocks.nx.updateProjectConfiguration('my-project', config)).toBeUndefined()
            })

            it('should use default values when not provided', () => {
                setupGeneratorSuccessScenario(mocks)

                const config = mocks.nx.readProjectConfiguration('test-project')
                expect(config.name).toBe('test-project')
            })
        })

        describe('setupGeneratorErrorScenario', () => {
            it('should set up failed generator execution', () => {
                setupGeneratorErrorScenario(mocks, {
                    errorMessage: 'Generator failed',
                })

                expect(() => mocks.tree.write('file.txt', 'content')).toThrow('Generator failed')
                expect(() => mocks.nx.readProjectConfiguration('test-project')).toThrow('Generator failed')
                expect(() => mocks.logger.error('test')).toThrow('test')
            })

            it('should use default error message when not provided', () => {
                setupGeneratorErrorScenario(mocks)

                expect(() => mocks.tree.write('file.txt', 'content')).toThrow('Generator failed')
            })
        })
    })

    describe('Executor Scenarios', () => {
        describe('setupExecutorSuccessScenario', () => {
            it('should set up successful executor execution', async () => {
                setupExecutorSuccessScenario(mocks, {
                    projectName: 'my-project',
                    target: 'build',
                    output: 'Build successful',
                })

                const result = await mocks.nx.runCommand('build')
                expect(result).toEqual({
                    success: true,
                    output: 'Build successful',
                })

                const config = mocks.nx.readProjectConfiguration('my-project')
                expect(config).toEqual({
                    name: 'my-project',
                    root: 'my-project',
                    sourceRoot: 'my-project/src',
                    projectType: 'library',
                    targets: {
                        build: {
                            executor: '@nx/esbuild:esbuild',
                            options: {},
                        },
                    },
                })
            })

            it('should use default values when not provided', async () => {
                setupExecutorSuccessScenario(mocks)

                const result = await mocks.nx.runCommand('build')
                expect(result.success).toBe(true)
                expect(result.output).toBe('Build successful')
            })
        })

        describe('setupExecutorErrorScenario', () => {
            it('should set up failed executor execution', async () => {
                setupExecutorErrorScenario(mocks, {
                    projectName: 'my-project',
                    target: 'build',
                    error: 'Executor failed',
                    exitCode: 1,
                })

                const result = await mocks.nx.runCommand('build')
                expect(result).toEqual({
                    success: false,
                    error: 'Executor failed',
                    exitCode: 1,
                })

                expect(() => mocks.nx.readProjectConfiguration('my-project')).toThrow('Executor failed')
                expect(() => mocks.logger.error('test')).toThrow('test')
            })

            it('should use default values when not provided', async () => {
                setupExecutorErrorScenario(mocks)

                const result = await mocks.nx.runCommand('build')
                expect(result.success).toBe(false)
                expect(result.error).toBe('Executor failed')
                expect(result.exitCode).toBe(1)
            })
        })
    })

    describe('PluginMockBuilder', () => {
        let builder: PluginMockBuilder

        beforeEach(() => {
            builder = createPluginMockBuilder(mocks)
        })

        it('should create builder instance', () => {
            expect(builder).toBeInstanceOf(PluginMockBuilder)
        })

        it('should support fluent chaining', () => {
            const result = builder
                .generatorSuccess({ projectName: 'test' })
                .executorSuccess({ projectName: 'test' })
                .windowsPath()
                .build()

            expect(result).toBe(mocks)
        })

        it('should set up generator success scenario', () => {
            builder.generatorSuccess({
                projectName: 'my-project',
                options: { name: 'test-component' },
            })

            expect(mocks.tree.write('file.txt', 'content')).toBeUndefined()
            const config = mocks.nx.readProjectConfiguration('my-project')
            expect(config.name).toBe('my-project')
        })

        it('should set up generator error scenario', () => {
            builder.generatorError({
                errorMessage: 'Generator failed',
            })

            expect(() => mocks.tree.write('file.txt', 'content')).toThrow('Generator failed')
        })

        it('should set up executor success scenario', async () => {
            builder.executorSuccess({
                projectName: 'my-project',
                target: 'build',
                output: 'Build successful',
            })

            const result = await mocks.nx.runCommand('build')
            expect(result.success).toBe(true)
            expect(result.output).toBe('Build successful')
        })

        it('should set up executor error scenario', async () => {
            builder.executorError({
                projectName: 'my-project',
                target: 'build',
                error: 'Executor failed',
                exitCode: 1,
            })

            const result = await mocks.nx.runCommand('build')
            expect(result.success).toBe(false)
            expect(result.error).toBe('Executor failed')
        })

        it('should set up Windows path scenario', () => {
            builder.windowsPath()

            expect(mocks.path.sep).toBe('\\')
            expect(mocks.path.join('a', 'b', 'c')).toBe('a\\b\\c')
            expect(mocks.path.dirname('C:\\test\\file.txt')).toBe('C:\\test')
            expect(mocks.process.platform).toBe('win32')
        })

        it('should set up Unix path scenario', () => {
            builder.unixPath()

            expect(mocks.path.sep).toBe('/')
            expect(mocks.path.join('a', 'b', 'c')).toBe('a/b/c')
            expect(mocks.path.dirname('/test/file.txt')).toBe('/test')
            expect(mocks.process.platform).toBe('linux')
        })

        it('should build and return mocks', () => {
            const result = builder.build()
            expect(result).toBe(mocks)
        })
    })

    describe('createPluginMockBuilder', () => {
        it('should create PluginMockBuilder instance', () => {
            const builder = createPluginMockBuilder(mocks)
            expect(builder).toBeInstanceOf(PluginMockBuilder)
        })
    })
})
