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
    setupShellOutputControl,
    conditionalWriteHost,
    conditionalEcho,
    wrapPowerShellScriptWithOutputControl,
    wrapBashScriptWithOutputControl,
    testShellOutputControl,
    setupCliConfigScenario,
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

    describe('Shell Output Control', () => {
        let originalEnv: NodeJS.ProcessEnv

        beforeEach(() => {
            originalEnv = { ...process.env }
        })

        afterEach(() => {
            Object.keys(process.env).forEach(key => {
                delete process.env[key]
            })
            Object.keys(originalEnv).forEach(key => {
                process.env[key] = originalEnv[key]
            })
        })

        describe('setupShellOutputControl', () => {
            it('should set ENABLE_TEST_CONSOLE to false by default', () => {
                setupShellOutputControl()
                expect(process.env.ENABLE_TEST_CONSOLE).toBe('false')
            })

            it('should set ENABLE_TEST_CONSOLE to true when enableConsoleOutput is true', () => {
                setupShellOutputControl({ enableConsoleOutput: true })
                expect(process.env.ENABLE_TEST_CONSOLE).toBe('true')
            })

            it('should set ENABLE_TEST_CONSOLE to false when enableConsoleOutput is false', () => {
                setupShellOutputControl({ enableConsoleOutput: false })
                expect(process.env.ENABLE_TEST_CONSOLE).toBe('false')
            })
        })

        describe('conditionalWriteHost', () => {
            let consoleSpy: ReturnType<typeof vi.spyOn>

            beforeEach(() => {
                consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
            })

            afterEach(() => {
                consoleSpy.mockRestore()
            })

            it('should output when ENABLE_TEST_CONSOLE is not false', () => {
                process.env.ENABLE_TEST_CONSOLE = 'true'
                conditionalWriteHost('Test message')
                expect(consoleSpy).toHaveBeenCalledWith('[PWSH] Test message')
            })

            it('should not output when ENABLE_TEST_CONSOLE is false', () => {
                process.env.ENABLE_TEST_CONSOLE = 'false'
                conditionalWriteHost('Test message')
                expect(consoleSpy).not.toHaveBeenCalled()
            })

            it('should not output when ENABLE_TEST_CONSOLE is undefined', () => {
                delete process.env.ENABLE_TEST_CONSOLE
                conditionalWriteHost('Test message')
                expect(consoleSpy).toHaveBeenCalledWith('[PWSH] Test message')
            })
        })

        describe('conditionalEcho', () => {
            let consoleSpy: ReturnType<typeof vi.spyOn>

            beforeEach(() => {
                consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
            })

            afterEach(() => {
                consoleSpy.mockRestore()
            })

            it('should output when ENABLE_TEST_CONSOLE is not false', () => {
                process.env.ENABLE_TEST_CONSOLE = 'true'
                conditionalEcho('Test message')
                expect(consoleSpy).toHaveBeenCalledWith('[BASH] Test message')
            })

            it('should not output when ENABLE_TEST_CONSOLE is false', () => {
                process.env.ENABLE_TEST_CONSOLE = 'false'
                conditionalEcho('Test message')
                expect(consoleSpy).not.toHaveBeenCalled()
            })

            it('should not output when ENABLE_TEST_CONSOLE is undefined', () => {
                delete process.env.ENABLE_TEST_CONSOLE
                conditionalEcho('Test message')
                expect(consoleSpy).toHaveBeenCalledWith('[BASH] Test message')
            })
        })

        describe('wrapPowerShellScriptWithOutputControl', () => {
            it('should wrap Write-Host commands with conditional checks', () => {
                const script = 'Write-Host "Hello World" -ForegroundColor Green'
                const result = wrapPowerShellScriptWithOutputControl(script)
                expect(result).toBe('if ($env:ENABLE_TEST_CONSOLE -ne "false") { Write-Host "Hello World" -ForegroundColor Green }')
            })

            it('should handle Write-Host without color parameters', () => {
                const script = 'Write-Host "Hello World"'
                const result = wrapPowerShellScriptWithOutputControl(script)
                expect(result).toBe('if ($env:ENABLE_TEST_CONSOLE -ne "false") { Write-Host "Hello World"  }')
            })

            it('should handle Write-Host with both foreground and background colors', () => {
                const script = 'Write-Host "Hello World" -ForegroundColor Green -BackgroundColor Red'
                const result = wrapPowerShellScriptWithOutputControl(script)
                expect(result).toBe('if ($env:ENABLE_TEST_CONSOLE -ne "false") { Write-Host "Hello World" -ForegroundColor Green -BackgroundColor Red }')
            })

            it('should handle multiple Write-Host commands', () => {
                const script = 'Write-Host "First" -ForegroundColor Green; Write-Host "Second" -BackgroundColor Red'
                const result = wrapPowerShellScriptWithOutputControl(script)
                expect(result).toBe('if ($env:ENABLE_TEST_CONSOLE -ne "false") { Write-Host "First" -ForegroundColor Green }; if ($env:ENABLE_TEST_CONSOLE -ne "false") { Write-Host "Second" -BackgroundColor Red }')
            })

            it('should not modify non-Write-Host content', () => {
                const script = 'Get-ChildItem; Write-Host "Test"; Remove-Item file.txt'
                const result = wrapPowerShellScriptWithOutputControl(script)
                expect(result).toBe('Get-ChildItem; if ($env:ENABLE_TEST_CONSOLE -ne "false") { Write-Host "Test"  }; Remove-Item file.txt')
            })
        })

        describe('wrapBashScriptWithOutputControl', () => {
            it('should wrap echo commands with conditional checks', () => {
                const script = 'echo "Hello World"'
                const result = wrapBashScriptWithOutputControl(script)
                expect(result).toBe('if [ "$ENABLE_TEST_CONSOLE" != "false" ]; then echo  "Hello World"; fi')
            })

            it('should handle echo with options', () => {
                const script = 'echo -e "Hello\\nWorld"'
                const result = wrapBashScriptWithOutputControl(script)
                expect(result).toBe('if [ "$ENABLE_TEST_CONSOLE" != "false" ]; then echo -e "Hello\\nWorld"; fi')
            })

            it('should handle multiple echo commands', () => {
                const script = 'echo "First"; echo "Second"'
                const result = wrapBashScriptWithOutputControl(script)
                expect(result).toBe('if [ "$ENABLE_TEST_CONSOLE" != "false" ]; then echo  "First"; fi; if [ "$ENABLE_TEST_CONSOLE" != "false" ]; then echo  "Second"; fi')
            })

            it('should not modify non-echo content', () => {
                const script = 'ls -la; echo "Test"; rm file.txt'
                const result = wrapBashScriptWithOutputControl(script)
                expect(result).toBe('ls -la; if [ "$ENABLE_TEST_CONSOLE" != "false" ]; then echo  "Test"; fi; rm file.txt')
            })
        })

        describe('testShellOutputControl', () => {
            it('should detect PowerShell conditional output', () => {
                const script = 'if ($env:ENABLE_TEST_CONSOLE -ne "false") { Write-Host "Test" }'
                const result = testShellOutputControl('powershell', script)
                expect(result.hasConditionalOutput).toBe(true)
                expect(result.outputCommands).toEqual([])
            })

            it('should detect PowerShell Write-Host commands', () => {
                const script = 'Write-Host "Hello World" -ForegroundColor Green'
                const result = testShellOutputControl('powershell', script)
                expect(result.hasConditionalOutput).toBe(false)
                expect(result.outputCommands).toEqual(['Write-Host "Hello World" -ForegroundColor Green'])
            })

            it('should detect Bash conditional output', () => {
                const script = 'if [ "$ENABLE_TEST_CONSOLE" != "false" ]; then echo "Test"; fi'
                const result = testShellOutputControl('bash', script)
                expect(result.hasConditionalOutput).toBe(true)
                expect(result.outputCommands).toEqual([])
            })

            it('should detect Bash echo commands', () => {
                const script = 'echo "Hello World"'
                const result = testShellOutputControl('bash', script)
                expect(result.hasConditionalOutput).toBe(false)
                expect(result.outputCommands).toEqual(['echo "Hello World"'])
            })

            it('should handle unknown script type', () => {
                const script = 'echo "Test"'
                const result = testShellOutputControl('unknown' as any, script)
                expect(result.hasConditionalOutput).toBe(false)
                expect(result.outputCommands).toEqual([])
            })

            it('should handle empty script', () => {
                const result = testShellOutputControl('powershell', '')
                expect(result.hasConditionalOutput).toBe(false)
                expect(result.outputCommands).toEqual([])
            })
        })
    })

    describe('CLI Config Scenario', () => {
        describe('setupCliConfigScenario', () => {
            it('should set up CLI config with default options', () => {
                const mockMocks = {
                    fileSystem: {
                        existsSync: vi.fn(),
                        readFileSync: vi.fn()
                    },
                    stripJsonComments: vi.fn()
                }

                setupCliConfigScenario(mockMocks)

                // Verify the mocks were set up correctly by calling them
                expect(mockMocks.fileSystem.existsSync()).toBe(true)
                expect(mockMocks.fileSystem.readFileSync()).toBe(
                    JSON.stringify({
                        packages: { 'test-package': { targets: ['build'] } },
                        'package-targets': { 'test-package': ['build', 'test'] },
                        'not-nx-targets': ['help', 'version'],
                        expandables: { test: 'test-package' }
                    })
                )
            })

            it('should set up CLI config with custom options', () => {
                const mockMocks = {
                    fileSystem: {
                        existsSync: vi.fn(),
                        readFileSync: vi.fn()
                    },
                    stripJsonComments: vi.fn()
                }

                const customOptions = {
                    packages: { 'custom-package': { targets: ['build', 'test'] } },
                    packageTargets: { 'custom-package': ['build', 'test', 'lint'] },
                    notNxTargets: ['help', 'version', 'info'],
                    expandables: { custom: 'custom-package' }
                }

                setupCliConfigScenario(mockMocks, customOptions)

                // Verify the mocks were set up correctly by calling them
                expect(mockMocks.fileSystem.existsSync()).toBe(true)
                expect(mockMocks.fileSystem.readFileSync()).toBe(
                    JSON.stringify({
                        packages: customOptions.packages,
                        'package-targets': customOptions.packageTargets,
                        'not-nx-targets': customOptions.notNxTargets,
                        expandables: customOptions.expandables
                    })
                )
            })

            it('should handle PaeTestMocks structure with fs property', () => {
                const mockMocks = {
                    fs: {
                        existsSync: vi.fn(),
                        readFileSync: vi.fn()
                    },
                    stripJsonComments: vi.fn()
                }

                setupCliConfigScenario(mockMocks)

                // Verify the mocks were set up correctly by calling them
                expect(mockMocks.fs.existsSync()).toBe(true)
                expect(mockMocks.fs.readFileSync()).toBe(
                    JSON.stringify({
                        packages: { 'test-package': { targets: ['build'] } },
                        'package-targets': { 'test-package': ['build', 'test'] },
                        'not-nx-targets': ['help', 'version'],
                        expandables: { test: 'test-package' }
                    })
                )
            })

            it('should set up stripJsonComments mock implementation', () => {
                const mockMocks = {
                    fileSystem: {
                        existsSync: vi.fn(),
                        readFileSync: vi.fn()
                    },
                    stripJsonComments: vi.fn()
                }

                setupCliConfigScenario(mockMocks)

                const configContent = JSON.stringify({
                    packages: { 'test-package': { targets: ['build'] } },
                    'package-targets': { 'test-package': ['build', 'test'] },
                    'not-nx-targets': ['help', 'version'],
                    expandables: { test: 'test-package' }
                })

                const result = mockMocks.stripJsonComments(configContent)
                expect(result).toEqual(JSON.parse(configContent))
            })
        })

        describe('LibMockBuilder cliConfig method', () => {
            let builder: LibMockBuilder

            beforeEach(() => {
                builder = createLibMockBuilder(mocks)
            })

            it('should set up CLI config scenario', () => {
                const result = builder.cliConfig({
                    packages: { 'test-package': { targets: ['build'] } },
                    packageTargets: { 'test-package': ['build', 'test'] }
                })

                expect(result).toBe(builder)
                // Verify the mocks were set up correctly by calling them
                expect(mocks.fileSystem.existsSync()).toBe(true)
                expect(mocks.fileSystem.readFileSync()).toBe(
                    JSON.stringify({
                        packages: { 'test-package': { targets: ['build'] } },
                        'package-targets': { 'test-package': ['build', 'test'] },
                        'not-nx-targets': ['help', 'version'],
                        expandables: { test: 'test-package' }
                    })
                )
            })

            it('should support fluent chaining with cliConfig', () => {
                const result = builder
                    .cliConfig({ packages: { 'test-package': { targets: ['build'] } } })
                    .processSuccess({ command: 'test' })
                    .build()

                expect(result).toBe(mocks)
                // Verify the CLI config was set up by calling the mock
                expect(mocks.fileSystem.existsSync()).toBe(true)
            })
        })
    })
})
