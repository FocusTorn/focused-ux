// Shared Library Mock Strategy Library
// Provides standardized mock interfaces and helpers for shared utility packages

import { vi } from 'vitest'

export interface LibTestMocks {
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
        existsSync: ReturnType<typeof vi.fn>
        readFileSync: ReturnType<typeof vi.fn>
        writeFileSync: ReturnType<typeof vi.fn>
        mkdirSync: ReturnType<typeof vi.fn>
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
    util: {
        promisify: ReturnType<typeof vi.fn>
        inspect: ReturnType<typeof vi.fn>
    }
    os: {
        platform: ReturnType<typeof vi.fn>
        arch: ReturnType<typeof vi.fn>
        homedir: ReturnType<typeof vi.fn>
        tmpdir: ReturnType<typeof vi.fn>
    }
    stripJsonComments: ReturnType<typeof vi.fn>
}

export function setupLibTestEnvironment(): LibTestMocks {
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
            existsSync: vi.fn(),
            readFileSync: vi.fn(),
            writeFileSync: vi.fn(),
            mkdirSync: vi.fn(),
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
            argv: ['node', 'script.js'],
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
        util: {
            promisify: vi.fn(),
            inspect: vi.fn(),
        },
        os: {
            platform: vi.fn(),
            arch: vi.fn(),
            homedir: vi.fn(),
            tmpdir: vi.fn(),
        },
        stripJsonComments: vi.fn(),
    }
}

export function setupLibFileSystemMocks(mocks: LibTestMocks): void {
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

export function setupLibPathMocks(mocks: LibTestMocks): void {
    mocks.path.dirname.mockImplementation(
        (path: string) => path.split('/').slice(0, -1).join('/') || '.'
    )
    mocks.path.basename.mockImplementation((path: string) => path.split('/').pop() || '')
    mocks.path.join.mockImplementation((...paths: string[]) => paths.join('/'))
    mocks.path.resolve.mockImplementation((path: string) => path)
    mocks.path.extname.mockImplementation((path: string) => {
        const lastDot = path.lastIndexOf('.')

        return lastDot === -1 ? '' : path.slice(lastDot)
    })
}

export function setupLibProcessMocks(mocks: LibTestMocks): void {
    mocks.process.cwd.mockReturnValue('/test/workspace')
    mocks.process.exit.mockImplementation((code?: number) => {
        throw new Error(`process.exit called with code: ${code}`)
    })
    mocks.process.env = { NODE_ENV: 'test' }
}

export function setupLibChildProcessMocks(mocks: LibTestMocks): void {
    mocks.childProcess.spawn.mockReturnValue({
        pid: 12345,
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn(),
        kill: vi.fn(),
    } as unknown as ReturnType<typeof mocks.childProcess.spawn>)
    
    mocks.childProcess.spawnSync.mockReturnValue({
        status: 0,
        stdout: Buffer.from(''),
        stderr: Buffer.from(''),
        error: undefined,
    })
    
    mocks.childProcess.exec.mockImplementation((_command, callback) => {
        if (callback) {
            callback(null, 'output', '')
        }
        return { pid: 12345 } as unknown as ReturnType<typeof mocks.childProcess.exec>
    })
    
    mocks.childProcess.execSync.mockReturnValue(Buffer.from('output'))
}

export function resetLibMocks(mocks: LibTestMocks): void {
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
    Object.values(mocks.util).forEach((mock) => mock.mockReset())
    Object.values(mocks.os).forEach((mock) => mock.mockReset())
}

// Process Execution Scenarios
export interface ProcessExecutionScenarioOptions {
    command: string
    args?: string[]
    shouldSucceed?: boolean
    exitCode?: number
    stdout?: string
    stderr?: string
    error?: string
}

export function setupProcessSuccessScenario(
    mocks: LibTestMocks,
    options: ProcessExecutionScenarioOptions
): void {
    const {
        command: _command,
        args: _args = [],
        exitCode = 0,
        stdout = 'success output',
        stderr = '',
    } = options

    mocks.childProcess.spawnSync.mockReturnValue({
        status: exitCode,
        stdout: Buffer.from(stdout),
        stderr: Buffer.from(stderr),
        error: undefined,
    })
}

export function setupProcessErrorScenario(
    mocks: LibTestMocks,
    options: ProcessExecutionScenarioOptions
): void {
    const {
        command: _command,
        args: _args = [],
        exitCode = 1,
        stdout = '',
        stderr = 'error output',
        error = 'Process failed',
    } = options

    mocks.childProcess.spawnSync.mockReturnValue({
        status: exitCode,
        stdout: Buffer.from(stdout),
        stderr: Buffer.from(stderr),
        error: new Error(error),
    })
}

// File System Scenarios
export interface LibFileSystemScenarioOptions {
    sourcePath: string
    targetPath?: string
    content?: string
    shouldExist?: boolean
    fileType?: 'file' | 'directory'
}

export function setupLibFileReadScenario(
    mocks: LibTestMocks,
    options: LibFileSystemScenarioOptions
): void {
    const { sourcePath: _sourcePath, content = 'file content' } = options

    mocks.fileSystem.readFile.mockResolvedValue(content)
    mocks.fileSystem.stat.mockResolvedValue({ type: 'file' as const })
}

export function setupLibFileWriteScenario(
    mocks: LibTestMocks,
    options: LibFileSystemScenarioOptions
): void {
    const { targetPath: _targetPath } = options

    mocks.fileSystem.writeFile.mockResolvedValue(undefined)
    mocks.fileSystem.stat.mockResolvedValue({ type: 'file' as const })
}

// Fluent Builder Pattern
export class LibMockBuilder {

    constructor(private mocks: LibTestMocks) {}

    processSuccess(options: ProcessExecutionScenarioOptions): LibMockBuilder {
        setupProcessSuccessScenario(this.mocks, options)
        return this
    }

    processError(options: ProcessExecutionScenarioOptions): LibMockBuilder {
        setupProcessErrorScenario(this.mocks, options)
        return this
    }

    fileRead(options: LibFileSystemScenarioOptions): LibMockBuilder {
        setupLibFileReadScenario(this.mocks, options)
        return this
    }

    fileWrite(options: LibFileSystemScenarioOptions): LibMockBuilder {
        setupLibFileWriteScenario(this.mocks, options)
        return this
    }

    windowsPath(): LibMockBuilder {
        this.mocks.path.sep = '\\'
        this.mocks.path.join.mockImplementation((...paths: string[]) => paths.join('\\'))
        this.mocks.path.dirname.mockImplementation(
            (path: string) => path.split('\\').slice(0, -1).join('\\') || '.'
        )
        return this
    }

    unixPath(): LibMockBuilder {
        this.mocks.path.sep = '/'
        this.mocks.path.join.mockImplementation((...paths: string[]) => paths.join('/'))
        this.mocks.path.dirname.mockImplementation(
            (path: string) => path.split('/').slice(0, -1).join('/') || '.'
        )
        return this
    }

    cliConfig(options: CliConfigScenarioOptions = {}): LibMockBuilder {
        setupCliConfigScenario(this.mocks, options)
        return this
    }

    build(): LibTestMocks {
        return this.mocks
    }

}

export function createLibMockBuilder(mocks: LibTestMocks): LibMockBuilder {
    return new LibMockBuilder(mocks)
}

// Shell Output Control for Test Environments
export interface ShellOutputControlOptions {
    enableConsoleOutput?: boolean
    suppressPowerShellOutput?: boolean
    suppressBashOutput?: boolean
}

export interface CliConfigScenarioOptions {
    packages?: Record<string, { targets: string[] }>
    packageTargets?: Record<string, string[]>
    notNxTargets?: string[]
    expandables?: Record<string, string>
    configPath?: string
}

/**
 * Sets up environment variable control for shell script output during tests.
 * This allows PowerShell and Bash scripts to conditionally suppress output
 * based on the ENABLE_TEST_CONSOLE environment variable.
 * 
 * @param options Configuration options for shell output control
 */
export function setupShellOutputControl(options: ShellOutputControlOptions = {}): void {
    const {
        enableConsoleOutput = false,
        suppressPowerShellOutput: _suppressPowerShellOutput = true,
        suppressBashOutput: _suppressBashOutput = true,
    } = options

    // Set the environment variable to control shell script output
    if (!enableConsoleOutput) {
        process.env.ENABLE_TEST_CONSOLE = 'false'
    } else {
        process.env.ENABLE_TEST_CONSOLE = 'true'
    }
}

/**
 * Wraps PowerShell Write-Host commands with conditional output control.
 * Use this in PowerShell scripts to respect the ENABLE_TEST_CONSOLE environment variable.
 * 
 * @param message The message to output
 * @param foregroundColor Optional foreground color
 * @param backgroundColor Optional background color
 */
export function conditionalWriteHost(
    message: string,
    _foregroundColor?: string,
    _backgroundColor?: string
): void {
    if (process.env.ENABLE_TEST_CONSOLE !== 'false') {
        // In PowerShell, this would be: Write-Host $message -ForegroundColor $foregroundColor
        console.log(`[PWSH] ${message}`)
    }
}

/**
 * Wraps Bash echo commands with conditional output control.
 * Use this in Bash scripts to respect the ENABLE_TEST_CONSOLE environment variable.
 * 
 * @param message The message to output
 * @param options Optional echo options (like -e for escape sequences)
 */
export function conditionalEcho(message: string, _options?: string): void {
    if (process.env.ENABLE_TEST_CONSOLE !== 'false') {
        // In Bash, this would be: echo $options "$message"
        console.log(`[BASH] ${message}`)
    }
}

/**
 * Generates PowerShell script content with conditional output control.
 * This creates PowerShell scripts that respect the ENABLE_TEST_CONSOLE environment variable.
 * 
 * @param scriptContent The PowerShell script content
 * @returns Modified script content with conditional output control
 */
export function wrapPowerShellScriptWithOutputControl(scriptContent: string): string {
    // Wrap Write-Host commands with conditional checks
    const wrappedContent = scriptContent.replace(
        /Write-Host\s+[^;]+/g,
        (match) => {
            // Extract the message part and color parameters separately
            const writeHostMatch = match.match(/Write-Host\s+(.+?)(?=\s+-|$)/)
            const foregroundMatch = match.match(/-ForegroundColor\s+(\w+)/)
            const backgroundMatch = match.match(/-BackgroundColor\s+(\w+)/)
            
            const message = writeHostMatch ? writeHostMatch[1] : ''
            const colorParams: string[] = []
            if (foregroundMatch) colorParams.push(`-ForegroundColor ${foregroundMatch[1]}`)
            if (backgroundMatch) colorParams.push(`-BackgroundColor ${backgroundMatch[1]}`)
            
            return `if ($env:ENABLE_TEST_CONSOLE -ne "false") { Write-Host ${message} ${colorParams.join(' ')} }`
        }
    )

    return wrappedContent
}

/**
 * Generates Bash script content with conditional output control.
 * This creates Bash scripts that respect the ENABLE_TEST_CONSOLE environment variable.
 * 
 * @param scriptContent The Bash script content
 * @returns Modified script content with conditional output control
 */
export function wrapBashScriptWithOutputControl(scriptContent: string): string {
    // Wrap echo commands with conditional checks
    const wrappedContent = scriptContent.replace(
        /echo\s+(-[a-zA-Z]*\s+)?([^;]+)/g,
        (match, options, message) => {
            const echoOptions = options ? options.trim() : ''

            return `if [ "$ENABLE_TEST_CONSOLE" != "false" ]; then echo ${echoOptions} ${message}; fi`
        }
    )

    return wrappedContent
}

/**
 * Test helper to verify shell output control is working correctly.
 * This can be used in tests to ensure the output control is functioning.
 * 
 * @param scriptType The type of script ('powershell' | 'bash')
 * @param scriptContent The script content to test
 * @returns Object with test results
 */
export function testShellOutputControl(
    scriptType: 'powershell' | 'bash',
    scriptContent: string
): { hasConditionalOutput: boolean; outputCommands: string[] } {
    const outputCommands: string[] = []
    
    if (scriptType === 'powershell') {
        const conditionalMatches = scriptContent.match(/if\s+\(\$env:ENABLE_TEST_CONSOLE\s+-ne\s+"false"\)/g) || []
        
        // Only match Write-Host commands that are NOT inside conditional blocks
        const writeHostMatches = scriptContent.match(/Write-Host\s+[^;]+/g) || []
        
        // Filter out Write-Host commands that are inside conditional blocks
        const standaloneWriteHostMatches = writeHostMatches.filter(match => {
            // Find the position of this match in the script
            const matchIndex = scriptContent.indexOf(match)
            const beforeMatch = scriptContent.substring(0, matchIndex)
            
            // Check if there's an unclosed conditional block before this match
            const conditionalStart = beforeMatch.lastIndexOf('if ($env:ENABLE_TEST_CONSOLE -ne "false")')
            if (conditionalStart === -1) return true // No conditional before this match
            
            // Check if there's a closing brace between the conditional and this match
            const betweenConditionalAndMatch = scriptContent.substring(conditionalStart, matchIndex)
            const hasClosingBrace = betweenConditionalAndMatch.includes('}')
            
            return hasClosingBrace // If there's a closing brace, this match is not in the conditional block
        })
        
        outputCommands.push(...standaloneWriteHostMatches)
        
        return {
            hasConditionalOutput: conditionalMatches.length > 0,
            outputCommands
        }
    } else if (scriptType === 'bash') {
        const conditionalMatches = scriptContent.match(/if\s+\[\s*"\$ENABLE_TEST_CONSOLE"\s*!=\s*"false"\s*\]/g) || []
        
        // Only match echo commands that are NOT inside conditional blocks
        const echoMatches = scriptContent.match(/echo\s+[^;]+/g) || []
        const conditionalEchoMatches = scriptContent.match(/if\s+\[\s*"\$ENABLE_TEST_CONSOLE"\s*!=\s*"false"\s*\]\s*;\s*then\s+echo\s+[^;]+/g) || []
        
        // Filter out echo commands that are inside conditional blocks
        const standaloneEchoMatches = echoMatches.filter(match => 
            !conditionalEchoMatches.some(conditional => conditional.includes(match))
        )
        
        outputCommands.push(...standaloneEchoMatches)
        
        return {
            hasConditionalOutput: conditionalMatches.length > 0,
            outputCommands
        }
    }
    
    return { hasConditionalOutput: false, outputCommands: [] }
}

/**
 * Sets up a complete CLI configuration scenario for testing CLI applications.
 * This prevents "Cannot read properties of undefined" errors by providing
 * a complete mock configuration structure.
 * 
 * @param mocks The test mocks object (LibTestMocks or compatible)
 * @param options Configuration options for the CLI config
 */
export function setupCliConfigScenario(
    mocks: LibTestMocks | { fileSystem?: LibTestMocks['fileSystem']; fs?: LibTestMocks['fileSystem']; stripJsonComments?: ReturnType<typeof vi.fn> },
    options: CliConfigScenarioOptions = {}
): void {
    const {
        packages = { 'test-package': { targets: ['build'] } },
        packageTargets = { 'test-package': ['build', 'test'] },
        notNxTargets = ['help', 'version'],
        expandables = { test: 'test-package' },
        configPath: _configPath = '/config.json'
    } = options

    const mockConfig = {
        packages,
        'package-targets': packageTargets,
        'not-nx-targets': notNxTargets,
        expandables,
    }

    const configContent = JSON.stringify(mockConfig)
    
    // Handle both LibTestMocks (fileSystem) and PaeTestMocks (fs) structures
    const fileSystem = (mocks as any).fileSystem || (mocks as any).fs

    if (fileSystem) {
        if (fileSystem.existsSync) fileSystem.existsSync.mockReturnValue(true)
        if (fileSystem.readFileSync) fileSystem.readFileSync.mockReturnValue(configContent)
    }
    
    if ((mocks as any).stripJsonComments) {
        (mocks as any).stripJsonComments.mockImplementation(() => {
            try {
                return JSON.parse(configContent)
            } catch {
                throw new Error('Invalid JSON')
            }
        })
    }
}