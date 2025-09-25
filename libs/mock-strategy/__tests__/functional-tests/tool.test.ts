import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
    ToolTestMocks,
    setupToolTestEnvironment,
    setupToolFileSystemMocks,
    setupToolProcessMocks,
    setupToolChildProcessMocks,
    setupToolReadlineMocks,
    setupToolFileStreamMocks,
    resetToolMocks,
    setupCliSuccessScenario,
    setupCliErrorScenario,
    setupToolFileProcessingScenario,
    ToolMockBuilder,
    createToolMockBuilder,
} from '../../src/tool/index.js'

describe('Tool Package Mock Strategy', () => {
    let mocks: ToolTestMocks

    beforeEach(() => {
        mocks = setupToolTestEnvironment()
    })

    describe('setupToolTestEnvironment', () => {
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
            expect(mocks.process.stdin).toBeDefined()
            expect(mocks.process.stdout).toBeDefined()
            expect(mocks.process.stderr).toBeDefined()

            // Child Process
            expect(mocks.childProcess.spawn).toBeDefined()
            expect(mocks.childProcess.spawnSync).toBeDefined()
            expect(mocks.childProcess.exec).toBeDefined()
            expect(mocks.childProcess.execSync).toBeDefined()

            // Readline
            expect(mocks.readline.createInterface).toBeDefined()

            // File Streams
            expect(mocks.fs.createReadStream).toBeDefined()
            expect(mocks.fs.createWriteStream).toBeDefined()
            expect(mocks.fs.watch).toBeDefined()
            expect(mocks.fs.watchFile).toBeDefined()
            expect(mocks.fs.unwatchFile).toBeDefined()

            // OS
            expect(mocks.os.platform).toBeDefined()
            expect(mocks.os.arch).toBeDefined()
            expect(mocks.os.homedir).toBeDefined()
            expect(mocks.os.tmpdir).toBeDefined()
            expect(mocks.os.cpus).toBeDefined()
            expect(mocks.os.freemem).toBeDefined()
            expect(mocks.os.totalmem).toBeDefined()
        })

        it('should create vi.fn() instances', () => {
            expect(vi.isMockFunction(mocks.fileSystem.readFile)).toBe(true)
            expect(vi.isMockFunction(mocks.path.join)).toBe(true)
            expect(vi.isMockFunction(mocks.process.exit)).toBe(true)
            expect(vi.isMockFunction(mocks.childProcess.spawn)).toBe(true)
            expect(vi.isMockFunction(mocks.readline.createInterface)).toBe(true)
            expect(vi.isMockFunction(mocks.fs.createReadStream)).toBe(true)
            expect(vi.isMockFunction(mocks.os.platform)).toBe(true)
        })

        it('should set up default values', () => {
            expect(mocks.path.sep).toBe('/')
            expect(mocks.process.argv).toEqual(['node', 'tool.js'])
            expect(mocks.process.env).toEqual({})
            expect(mocks.process.platform).toBe('linux')
        })

        it('should set up process streams', () => {
            expect(mocks.process.stdin.on).toBeDefined()
            expect(mocks.process.stdin.read).toBeDefined()
            expect(mocks.process.stdout.write).toBeDefined()
            expect(mocks.process.stdout.end).toBeDefined()
            expect(mocks.process.stderr.write).toBeDefined()
            expect(mocks.process.stderr.end).toBeDefined()
        })
    })

    describe('setupToolFileSystemMocks', () => {
        beforeEach(() => {
            setupToolFileSystemMocks(mocks)
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

    describe('setupToolProcessMocks', () => {
        beforeEach(() => {
            setupToolProcessMocks(mocks)
        })

        it('should set up process mock implementations', () => {
            expect(mocks.process.cwd()).toBe('/test/workspace')
            expect(mocks.process.env).toEqual({ NODE_ENV: 'test' })
            expect(mocks.process.stdout.write('test')).toBe(true)
            expect(mocks.process.stderr.write('error')).toBe(true)
        })

        it('should set up process.exit to throw error', () => {
            expect(() => mocks.process.exit(1)).toThrow('process.exit called with code: 1')
            expect(() => mocks.process.exit()).toThrow('process.exit called with code: undefined')
        })
    })

    describe('setupToolChildProcessMocks', () => {
        beforeEach(() => {
            setupToolChildProcessMocks(mocks)
        })

        it('should set up spawn mock', () => {
            const child = mocks.childProcess.spawn('command', ['arg1', 'arg2'])
            expect(child).toEqual({
                pid: 12345,
                stdout: { on: expect.any(Function) },
                stderr: { on: expect.any(Function) },
                on: expect.any(Function),
                kill: expect.any(Function),
            })
        })

        it('should set up spawnSync mock', () => {
            const result = mocks.childProcess.spawnSync('command', ['arg1', 'arg2'])
            expect(result).toEqual({
                status: 0,
                stdout: Buffer.from(''),
                stderr: Buffer.from(''),
                error: undefined,
            })
        })

        it('should set up exec mock', () => {
            const callback = vi.fn()
            const child = mocks.childProcess.exec('command', callback)
            expect(child).toEqual({ pid: 12345 })
            expect(callback).toHaveBeenCalledWith(null, 'output', '')
        })

        it('should set up execSync mock', () => {
            const result = mocks.childProcess.execSync('command')
            expect(result).toEqual(Buffer.from('output'))
        })
    })

    describe('setupToolReadlineMocks', () => {
        beforeEach(() => {
            setupToolReadlineMocks(mocks)
        })

        it('should set up readline interface mock', () => {
            const readlineInterface = mocks.readline.createInterface({
                input: process.stdin,
                output: process.stdout,
            })

            expect(readlineInterface.question).toBeDefined()
            expect(readlineInterface.close).toBeDefined()
            expect(readlineInterface.on).toBeDefined()
            expect(readlineInterface.write).toBeDefined()

            expect(vi.isMockFunction(readlineInterface.question)).toBe(true)
            expect(vi.isMockFunction(readlineInterface.close)).toBe(true)
            expect(vi.isMockFunction(readlineInterface.on)).toBe(true)
            expect(vi.isMockFunction(readlineInterface.write)).toBe(true)
        })
    })

    describe('setupToolFileStreamMocks', () => {
        beforeEach(() => {
            setupToolFileStreamMocks(mocks)
        })

        it('should set up read stream mock', () => {
            const readStream = mocks.fs.createReadStream('file.txt')
            expect(readStream).toEqual({
                on: expect.any(Function),
                pipe: expect.any(Function),
                close: expect.any(Function),
                destroy: expect.any(Function),
            })
        })

        it('should set up write stream mock', () => {
            const writeStream = mocks.fs.createWriteStream('file.txt')
            expect(writeStream).toEqual({
                write: expect.any(Function),
                end: expect.any(Function),
                close: expect.any(Function),
                destroy: expect.any(Function),
                on: expect.any(Function),
            })
        })

        it('should set up file watcher mock', () => {
            const watcher = mocks.fs.watch('file.txt')
            expect(watcher).toEqual({
                close: expect.any(Function),
            })
        })

        it('should set up file watching mocks', () => {
            expect(mocks.fs.watchFile('file.txt', () => {})).toBeUndefined()
            expect(mocks.fs.unwatchFile('file.txt')).toBeUndefined()
        })
    })

    describe('resetToolMocks', () => {
        beforeEach(() => {
            setupToolFileSystemMocks(mocks)
            setupToolProcessMocks(mocks)
            setupToolChildProcessMocks(mocks)
            setupToolReadlineMocks(mocks)
            setupToolFileStreamMocks(mocks)
        })

        it('should reset all mock functions', () => {
            // Call some mocks first
            mocks.fileSystem.readFile('test.txt')
            mocks.path.join('a', 'b')
            mocks.process.cwd()
            mocks.childProcess.spawn('command')
            mocks.readline.createInterface({})
            mocks.fs.createReadStream('file.txt')

            // Reset mocks
            resetToolMocks(mocks)

            // Verify mocks were reset
            expect(mocks.fileSystem.readFile).toHaveBeenCalledTimes(0)
            expect(mocks.path.join).toHaveBeenCalledTimes(0)
            expect(mocks.process.cwd).toHaveBeenCalledTimes(0)
            expect(mocks.childProcess.spawn).toHaveBeenCalledTimes(0)
            expect(mocks.readline.createInterface).toHaveBeenCalledTimes(0)
            expect(mocks.fs.createReadStream).toHaveBeenCalledTimes(0)
        })
    })

    describe('CLI Interaction Scenarios', () => {
        describe('setupCliSuccessScenario', () => {
            it('should set up successful CLI interaction', () => {
                setupCliSuccessScenario(mocks, {
                    input: 'user input',
                    output: 'tool output',
                    exitCode: 0,
                })

                const readlineInterface = mocks.readline.createInterface({})
                const callback = vi.fn()
                readlineInterface.question('prompt', callback)
                expect(callback).toHaveBeenCalledWith('user input')

                expect(mocks.process.stdout.write('test')).toBe(true)
            })

            it('should use default values when not provided', () => {
                setupCliSuccessScenario(mocks)

                const readlineInterface = mocks.readline.createInterface({})
                const callback = vi.fn()
                readlineInterface.question('prompt', callback)
                expect(callback).toHaveBeenCalledWith('test input')
            })

            it('should set up process exit behavior', () => {
                setupCliSuccessScenario(mocks, { exitCode: 0 })
                expect(() => mocks.process.exit(0)).toThrow('process.exit called with code: 0')
            })
        })

        describe('setupCliErrorScenario', () => {
            it('should set up failed CLI interaction', () => {
                setupCliErrorScenario(mocks, {
                    error: 'CLI error',
                    exitCode: 1,
                })

                expect(mocks.process.stderr.write('error')).toBe(true)
                expect(() => mocks.process.exit(1)).toThrow('process.exit called with code: 1')
            })

            it('should use default values when not provided', () => {
                setupCliErrorScenario(mocks)

                expect(mocks.process.stderr.write('error')).toBe(true)
                expect(() => mocks.process.exit(1)).toThrow('process.exit called with code: 1')
            })
        })
    })

    describe('File Processing Scenarios', () => {
        describe('setupToolFileProcessingScenario', () => {
            it('should set up file processing scenario', async () => {
                setupToolFileProcessingScenario(mocks, {
                    sourcePath: '/input/file.txt',
                    targetPath: '/output/file.txt',
                    content: 'processed content',
                })

                const content = await mocks.fileSystem.readFile('/input/file.txt')
                expect(content).toBe('processed content')

                await expect(mocks.fileSystem.writeFile('/output/file.txt', 'content')).resolves.toBeUndefined()

                const stat = await mocks.fileSystem.stat('/output/file.txt')
                expect(stat).toEqual({ type: 'file' })
            })

            it('should use default content when not provided', async () => {
                setupToolFileProcessingScenario(mocks, {
                    sourcePath: '/input/file.txt',
                    targetPath: '/output/file.txt',
                })

                const content = await mocks.fileSystem.readFile('/input/file.txt')
                expect(content).toBe('processed content')
            })
        })
    })

    describe('ToolMockBuilder', () => {
        let builder: ToolMockBuilder

        beforeEach(() => {
            builder = createToolMockBuilder(mocks)
        })

        it('should create builder instance', () => {
            expect(builder).toBeInstanceOf(ToolMockBuilder)
        })

        it('should support fluent chaining', () => {
            const result = builder
                .cliSuccess({ input: 'test' })
                .fileProcessing({ sourcePath: '/test/file.txt' })
                .windowsPath()
                .build()

            expect(result).toBe(mocks)
        })

        it('should set up CLI success scenario', () => {
            builder.cliSuccess({
                input: 'user input',
                output: 'tool output',
                exitCode: 0,
            })

            const readlineInterface = mocks.readline.createInterface({})
            const callback = vi.fn()
            readlineInterface.question('prompt', callback)
            expect(callback).toHaveBeenCalledWith('user input')
        })

        it('should set up CLI error scenario', () => {
            builder.cliError({
                error: 'CLI error',
                exitCode: 1,
            })

            expect(mocks.process.stderr.write('error')).toBe(true)
        })

        it('should set up file processing scenario', async () => {
            builder.fileProcessing({
                sourcePath: '/input/file.txt',
                targetPath: '/output/file.txt',
                content: 'test content',
            })

            const content = await mocks.fileSystem.readFile('/input/file.txt')
            expect(content).toBe('test content')
        })

        it('should set up Windows path scenario', () => {
            builder.windowsPath()

            expect(mocks.path.sep).toBe('\\')
            expect(mocks.path.join('a', 'b', 'c')).toBe('a\\b\\c')
            expect(mocks.path.dirname('C:\\test\\file.txt')).toBe('C:\\test')
            expect(mocks.os.platform()).toBe('win32')
        })

        it('should set up Unix path scenario', () => {
            builder.unixPath()

            expect(mocks.path.sep).toBe('/')
            expect(mocks.path.join('a', 'b', 'c')).toBe('a/b/c')
            expect(mocks.path.dirname('/test/file.txt')).toBe('/test')
            expect(mocks.os.platform()).toBe('linux')
        })

        it('should build and return mocks', () => {
            const result = builder.build()
            expect(result).toBe(mocks)
        })
    })

    describe('createToolMockBuilder', () => {
        it('should create ToolMockBuilder instance', () => {
            const builder = createToolMockBuilder(mocks)
            expect(builder).toBeInstanceOf(ToolMockBuilder)
        })
    })
})
