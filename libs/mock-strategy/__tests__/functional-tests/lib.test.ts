import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
    LibTestMocks,
    setupLibTestEnvironment,
    setupLibFileSystemMocks,
    setupLibPathMocks,
    setupLibProcessMocks,
    setupLibChildProcessMocks,
    resetLibMocks,
    setupProcessSuccessScenario,
    setupProcessErrorScenario,
    setupLibFileReadScenario,
    setupLibFileWriteScenario,
    LibMockBuilder,
    createLibMockBuilder,
} from '../../src/lib/index.js'

describe('Shared Library Package Mock Strategy', () => {
    let mocks: LibTestMocks

    beforeEach(() => {
        mocks = setupLibTestEnvironment()
    })

    describe('setupLibTestEnvironment', () => {
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

            // Util
            expect(mocks.util.promisify).toBeDefined()
            expect(mocks.util.inspect).toBeDefined()

            // OS
            expect(mocks.os.platform).toBeDefined()
            expect(mocks.os.arch).toBeDefined()
            expect(mocks.os.homedir).toBeDefined()
            expect(mocks.os.tmpdir).toBeDefined()
        })

        it('should create vi.fn() instances', () => {
            expect(vi.isMockFunction(mocks.fileSystem.readFile)).toBe(true)
            expect(vi.isMockFunction(mocks.path.join)).toBe(true)
            expect(vi.isMockFunction(mocks.process.exit)).toBe(true)
            expect(vi.isMockFunction(mocks.childProcess.spawn)).toBe(true)
            expect(vi.isMockFunction(mocks.util.promisify)).toBe(true)
            expect(vi.isMockFunction(mocks.os.platform)).toBe(true)
        })

        it('should set up default values', () => {
            expect(mocks.path.sep).toBe('/')
            expect(mocks.process.argv).toEqual(['node', 'script.js'])
            expect(mocks.process.env).toEqual({})
            expect(mocks.process.platform).toBe('linux')
        })
    })

    describe('setupLibFileSystemMocks', () => {
        beforeEach(() => {
            setupLibFileSystemMocks(mocks)
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

    describe('setupLibPathMocks', () => {
        beforeEach(() => {
            setupLibPathMocks(mocks)
        })

        it('should set up path mock implementations', () => {
            expect(mocks.path.dirname('/test/file.txt')).toBe('/test')
            expect(mocks.path.basename('/test/file.txt')).toBe('file.txt')
            expect(mocks.path.join('a', 'b', 'c')).toBe('a/b/c')
            expect(mocks.path.resolve('/test')).toBe('/test')
            expect(mocks.path.extname('file.txt')).toBe('.txt')
        })

        it('should handle edge cases', () => {
            expect(mocks.path.dirname('file.txt')).toBe('.')
            expect(mocks.path.basename('/')).toBe('')
            expect(mocks.path.extname('file')).toBe('')
        })
    })

    describe('setupLibProcessMocks', () => {
        beforeEach(() => {
            setupLibProcessMocks(mocks)
        })

        it('should set up process mock implementations', () => {
            expect(mocks.process.cwd()).toBe('/test/workspace')
            expect(mocks.process.env).toEqual({ NODE_ENV: 'test' })
        })

        it('should set up process.exit to throw error', () => {
            expect(() => mocks.process.exit(1)).toThrow('process.exit called with code: 1')
            expect(() => mocks.process.exit()).toThrow('process.exit called with code: undefined')
        })
    })

    describe('setupLibChildProcessMocks', () => {
        beforeEach(() => {
            setupLibChildProcessMocks(mocks)
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

    describe('resetLibMocks', () => {
        beforeEach(() => {
            setupLibFileSystemMocks(mocks)
            setupLibPathMocks(mocks)
            setupLibProcessMocks(mocks)
            setupLibChildProcessMocks(mocks)
        })

        it('should reset all mock functions', () => {
            // Call some mocks first
            mocks.fileSystem.readFile('test.txt')
            mocks.path.join('a', 'b')
            mocks.process.cwd()
            mocks.childProcess.spawn('command')

            // Reset mocks
            resetLibMocks(mocks)

            // Verify mocks were reset
            expect(mocks.fileSystem.readFile).toHaveBeenCalledTimes(0)
            expect(mocks.path.join).toHaveBeenCalledTimes(0)
            expect(mocks.process.cwd).toHaveBeenCalledTimes(0)
            expect(mocks.childProcess.spawn).toHaveBeenCalledTimes(0)
        })
    })

    describe('Process Execution Scenarios', () => {
        describe('setupProcessSuccessScenario', () => {
            it('should set up successful process execution', () => {
                setupProcessSuccessScenario(mocks, {
                    command: 'npm install',
                    args: ['--save'],
                    exitCode: 0,
                    stdout: 'Installation complete',
                    stderr: '',
                })

                const result = mocks.childProcess.spawnSync('npm install', ['--save'])
                expect(result).toEqual({
                    status: 0,
                    stdout: Buffer.from('Installation complete'),
                    stderr: Buffer.from(''),
                    error: undefined,
                })
            })

            it('should use default values when not provided', () => {
                setupProcessSuccessScenario(mocks, {
                    command: 'test command',
                })

                const result = mocks.childProcess.spawnSync('test command', [])
                expect(result).toEqual({
                    status: 0,
                    stdout: Buffer.from('success output'),
                    stderr: Buffer.from(''),
                    error: undefined,
                })
            })
        })

        describe('setupProcessErrorScenario', () => {
            it('should set up failed process execution', () => {
                setupProcessErrorScenario(mocks, {
                    command: 'npm install',
                    args: ['--save'],
                    exitCode: 1,
                    stdout: '',
                    stderr: 'Permission denied',
                    error: 'Process failed',
                })

                const result = mocks.childProcess.spawnSync('npm install', ['--save'])
                expect(result).toEqual({
                    status: 1,
                    stdout: Buffer.from(''),
                    stderr: Buffer.from('Permission denied'),
                    error: new Error('Process failed'),
                })
            })

            it('should use default values when not provided', () => {
                setupProcessErrorScenario(mocks, {
                    command: 'test command',
                })

                const result = mocks.childProcess.spawnSync('test command', [])
                expect(result).toEqual({
                    status: 1,
                    stdout: Buffer.from(''),
                    stderr: Buffer.from('error output'),
                    error: new Error('Process failed'),
                })
            })
        })
    })

    describe('File System Scenarios', () => {
        describe('setupLibFileReadScenario', () => {
            it('should set up file read scenario', async () => {
                setupLibFileReadScenario(mocks, {
                    sourcePath: '/test/file.txt',
                    content: 'custom content'
                })

                const content = await mocks.fileSystem.readFile('/test/file.txt')
                expect(content).toBe('custom content')

                const stat = await mocks.fileSystem.stat('/test/file.txt')
                expect(stat).toEqual({ type: 'file' })
            })

            it('should use default content when not provided', async () => {
                setupLibFileReadScenario(mocks, {
                    sourcePath: '/test/file.txt'
                })

                const content = await mocks.fileSystem.readFile('/test/file.txt')
                expect(content).toBe('file content')
            })
        })

        describe('setupLibFileWriteScenario', () => {
            it('should set up file write scenario', async () => {
                setupLibFileWriteScenario(mocks, {
                    targetPath: '/test/output.txt'
                })

                await expect(mocks.fileSystem.writeFile('/test/output.txt', 'content')).resolves.toBeUndefined()

                const stat = await mocks.fileSystem.stat('/test/output.txt')
                expect(stat).toEqual({ type: 'file' })
            })
        })
    })

    describe('LibMockBuilder', () => {
        let builder: LibMockBuilder

        beforeEach(() => {
            builder = createLibMockBuilder(mocks)
        })

        it('should create builder instance', () => {
            expect(builder).toBeInstanceOf(LibMockBuilder)
        })

        it('should support fluent chaining', () => {
            const result = builder
                .processSuccess({ command: 'test' })
                .fileRead({ sourcePath: '/test/file.txt' })
                .fileWrite({ targetPath: '/test/output.txt' })
                .build()

            expect(result).toBe(mocks)
        })

        it('should set up process success scenario', () => {
            builder.processSuccess({
                command: 'npm install',
                exitCode: 0,
                stdout: 'Installation complete',
            })

            const result = mocks.childProcess.spawnSync('npm install', [])
            expect(result.status).toBe(0)
            expect(result.stdout.toString()).toBe('Installation complete')
        })

        it('should set up process error scenario', () => {
            builder.processError({
                command: 'npm install',
                exitCode: 1,
                stderr: 'Permission denied',
            })

            const result = mocks.childProcess.spawnSync('npm install', [])
            expect(result.status).toBe(1)
            expect(result.stderr.toString()).toBe('Permission denied')
        })

        it('should set up file read scenario', async () => {
            builder.fileRead({ sourcePath: '/test/file.txt', content: 'test content' })

            const content = await mocks.fileSystem.readFile('/test/file.txt')
            expect(content).toBe('test content')
        })

        it('should set up file write scenario', async () => {
            builder.fileWrite({ targetPath: '/test/output.txt' })

            await expect(mocks.fileSystem.writeFile('/test/output.txt', 'content')).resolves.toBeUndefined()
        })

        it('should set up Windows path scenario', () => {
            builder.windowsPath()

            expect(mocks.path.sep).toBe('\\')
            expect(mocks.path.join('a', 'b', 'c')).toBe('a\\b\\c')
            expect(mocks.path.dirname('C:\\test\\file.txt')).toBe('C:\\test')
        })

        it('should set up Unix path scenario', () => {
            builder.unixPath()

            expect(mocks.path.sep).toBe('/')
            expect(mocks.path.join('a', 'b', 'c')).toBe('a/b/c')
            expect(mocks.path.dirname('/test/file.txt')).toBe('/test')
        })

        it('should build and return mocks', () => {
            const result = builder.build()
            expect(result).toBe(mocks)
        })
    })

    describe('createLibMockBuilder', () => {
        it('should create LibMockBuilder instance', () => {
            const builder = createLibMockBuilder(mocks)
            expect(builder).toBeInstanceOf(LibMockBuilder)
        })
    })
})
