import { vi, beforeAll, afterAll, afterEach } from 'vitest'

// Global mock reference for shell detection
let mockDetectShellTypeCached: any = vi.fn().mockImplementation(() => {
    // Default implementation that checks environment variables
    if (process.env.PSModulePath || process.env.POWERSHELL_DISTRIBUTION_CHANNEL || process.env.PSExecutionPolicyPreference) {
        return 'powershell'
    }
    if (
        process.env.MSYS_ROOT
        || process.env.MINGW_ROOT
        || process.env.WSL_DISTRO_NAME
        || process.env.WSLENV
        || (process.env.SHELL && (process.env.SHELL.includes('bash') || process.env.SHELL.includes('git-bash')))
    ) {
        return 'gitbash'
    }
    return 'unknown'
})

// Export the mock for use in tests
export { mockDetectShellTypeCached }



// Console output control
const ENABLE_CONSOLE_OUTPUT = (process.env.ENABLE_TEST_CONSOLE || 'false') === 'true'

if (!ENABLE_CONSOLE_OUTPUT) {
    console.log = vi.fn()
    console.info = vi.fn()
    console.warn = vi.fn()
    console.error = vi.fn()
}

// Set environment variable to control PowerShell/Bash output
if (!ENABLE_CONSOLE_OUTPUT) {
    process.env.ENABLE_TEST_CONSOLE = 'false'
}



// Global timer setup
beforeAll(() => vi.useFakeTimers())
afterAll(() => vi.useRealTimers())

afterEach(() => {
    vi.clearAllMocks()
})

// Re-mock console if needed after clearing all mocks
afterEach(() => {
    if (!ENABLE_CONSOLE_OUTPUT) {
        console.log = vi.fn()
        console.info = vi.fn()
        console.warn = vi.fn()
        console.error = vi.fn()
    }
})

// Mock process.env access
vi.stubGlobal('process', {
    ...process,
    env: {
        ...process.env,
        NODE_ENV: 'test',
        VITEST: 'true',
        PAE_DEBUG: '0',
        PAE_ECHO: '0',
        PAE_ECHO_X: '0',
    },
    listeners: vi.fn().mockReturnValue([]),
    exit: vi.fn().mockImplementation((code?: number) => {
        // Return the exit code instead of exiting during tests
        // This allows tests to check what exit code would have been used
        if (code === undefined || code === 0) {
            throw new Error('CLI attempted successful exit')
        } else {
            throw new Error(`CLI exit with error code ${code}`)
        }
    }),
    chdir: vi.fn(),
})

// Mock import.meta.url
Object.defineProperty(import.meta, 'url', {
    value: 'file:///D:/_dev/_Projects/_fux/_FocusedUX/libs/project-alias-expander/src/cli.js',
    writable: false,
})

// Mock process.argv for testing
Object.defineProperty(process, 'argv', {
    value: ['node', 'cli.js', 'aka', 'b'],
    writable: true,
})

// Mock process.cwd() to return the correct workspace root
vi.spyOn(process, 'cwd').mockReturnValue('D:/_dev/_Projects/_fux/_FocusedUX')

// Mock shell.js
vi.mock('shell-js', () => ({
    default: {
        exec: vi.fn(),
        echo: vi.fn(),
        cd: vi.fn(),
        pwd: vi.fn().mockReturnValue('test-working-dir'),
        ls: vi.fn().mockReturnValue(['file1', 'file2']),
        which: vi.fn().mockReturnValue('test-path'),
        test: vi.fn().mockReturnValue(true),
        grep: vi.fn().mockReturnValue('grep-result'),
        head: vi.fn().mockReturnValue('head-result'),
        tail: vi.fn().mockReturnValue('tail-result'),
        find: vi.fn().mockReturnValue('find-result'),
        rm: vi.fn(),
        mv: vi.fn(),
        cp: vi.fn(),
        mkdir: vi.fn(),
        sed: vi.fn(),
        sort: vi.fn().mockReturnValue('sort-result'),
        chmod: vi.fn(),
        exit: vi.fn(),
        env: {},
        config: {
            fatal: false,
            verbose: false,
            silent: false,
            globOptions: {}
        },
    },
}))

// Mock os module
vi.mock('node:os', () => ({
    default: {
        platform: vi.fn().mockReturnValue('win32'),
        type: vi.fn().mockReturnValue('Windows_NT'),
        arch: vi.fn().mockReturnValue('x64'),
        homedir: vi.fn().mockReturnValue('C:\\Users\\user'),
        tmpdir: vi.fn().mockReturnValue('C:\\Temp'),
        userInfo: vi.fn().mockReturnValue({ username: 'user' }),
        cpus: vi.fn().mockReturnValue([{ model: 'Intel', speed: 2400 }]),
        freemem: vi.fn().mockReturnValue(1024 * 1024 * 1024),
        totalmem: vi.fn().mockReturnValue(8 * 1024 * 1024 * 1024),
        uptime: vi.fn().mockReturnValue(3600),
        networkInterfaces: vi.fn().mockReturnValue({}),
        hostname: vi.fn().mockReturnValue('test-host'),
        loadavg: vi.fn().mockReturnValue([0.5, 0.3, 0.2]),
        endianness: vi.fn().mockReturnValue('LE'),
        release: vi.fn().mockReturnValue('10.0.26100'),
    },
    platform: vi.fn().mockReturnValue('win32'),
    type: vi.fn().mockReturnValue('Windows_NT'),
    arch: vi.fn().mockReturnValue('x64'),
    homedir: vi.fn().mockReturnValue('C:\\Users\\user'),
    tmpdir: vi.fn().mockReturnValue('C:\\Temp'),
    userInfo: vi.fn().mockReturnValue({ username: 'user' }),
    cpus: vi.fn().mockReturnValue([{ model: 'Intel', speed: 2400 }]),
    freemem: vi.fn().mockReturnValue(1024 * 1024 * 1024),
    totalmem: vi.fn().mockReturnValue(8 * 1024 * 1024 * 1024),
    uptime: vi.fn().mockReturnValue(3600),
    networkInterfaces: vi.fn().mockReturnValue({}),
    hostname: vi.fn().mockReturnValue('test-host'),
    loadavg: vi.fn().mockReturnValue([0.5, 0.3, 0.2]),
    endianness: vi.fn().mockReturnValue('LE'),
    EOL: '\n'
}))

// Mock path module
vi.mock('node:path', () => ({
    default: {
        join: vi.fn(),
        resolve: vi.fn(),
        dirname: vi.fn(),
        basename: vi.fn(),
        extname: vi.fn(),
        relative: vi.fn(),
        isAbsolute: vi.fn(),
        sep: '/',
        delimiter: ':',
    },
    join: vi.fn(),
    resolve: vi.fn(),
    dirname: vi.fn(),
    basename: vi.fn(),
    extname: vi.fn(),
    relative: vi.fn(),
    isAbsolute: vi.fn(),
    sep: '/',
    delimiter: ':',
}))

// Mock fs module
vi.mock('node:fs', () => ({
    default: {
        existsSync: vi.fn(),
        readFileSync: vi.fn(),
        writeFileSync: vi.fn(),
        appendFileSync: vi.fn(),
        mkdirSync: vi.fn(),
        copyFileSync: vi.fn(),
        rmSync: vi.fn(),
        statSync: vi.fn(),
        readdirSync: vi.fn(),
        unlinkSync: vi.fn(),
        rmdirSync: vi.fn(),
    },
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
    writeFileSync: vi.fn(),
    appendFileSync: vi.fn(),
    mkdirSync: vi.fn(),
    copyFileSync: vi.fn(),
    rmSync: vi.fn(),
    statSync: vi.fn(),
    readdirSync: vi.fn(),
    unlinkSync: vi.fn(),
    rmdirSync: vi.fn(),
}))

vi.mock('node:fs/promises', () => ({
    stat: vi.fn(),
    access: vi.fn(),
    copyFile: vi.fn(),
    readFile: vi.fn(),
    writeFile: vi.fn(),
    readdir: vi.fn(),
    mkdir: vi.fn(),
    rmdir: vi.fn(),
    unlink: vi.fn(),
}))

vi.mock('node:path', () => ({
    default: {
        join: vi.fn(),
        resolve: vi.fn(),
        dirname: vi.fn(),
        basename: vi.fn(),
        extname: vi.fn(),
        relative: vi.fn(),
        isAbsolute: vi.fn(),
        sep: '/',
        delimiter: ':',
    },
    join: vi.fn(),
    resolve: vi.fn(),
    dirname: vi.fn(),
    basename: vi.fn(),
    extname: vi.fn(),
    relative: vi.fn(),
    isAbsolute: vi.fn(),
    sep: '/',
    delimiter: ':',
}))

vi.mock('node:os', () => ({
    default: {
        platform: vi.fn().mockReturnValue('win32'),
        type: vi.fn().mockReturnValue('Windows_NT'),
        arch: vi.fn().mockReturnValue('x64'),
        homedir: vi.fn().mockReturnValue('C:\\Users\\user'),
        tmpdir: vi.fn().mockReturnValue('C:\\Temp'),
        userInfo: vi.fn().mockReturnValue({ username: 'user' }),
        cpus: vi.fn().mockReturnValue([{ model: 'Intel', speed: 2400 }]),
        freemem: vi.fn().mockReturnValue(1024 * 1024 * 1024),
        totalmem: vi.fn().mockReturnValue(8 * 1024 * 1024 * 1024),
        uptime: vi.fn().mockReturnValue(3600),
        networkInterfaces: vi.fn().mockReturnValue({}),
        hostname: vi.fn().mockReturnValue('test-host'),
        loadavg: vi.fn().mockReturnValue([0.5, 0.3, 0.2]),
        endianness: vi.fn().mockReturnValue('LE'),
        release: vi.fn().mockReturnValue('10.0.26100'),
    },
    platform: vi.fn().mockReturnValue('win32'),
    type: vi.fn().mockReturnValue('Windows_NT'),
    arch: vi.fn().mockReturnValue('x64'),
    homedir: vi.fn().mockReturnValue('C:\\Users\\user'),
    tmpdir: vi.fn().mockReturnValue('C:\\Temp'),
    userInfo: vi.fn().mockReturnValue({ username: 'user' }),
    cpus: vi.fn().mockReturnValue([{ model: 'Intel', speed: 2400 }]),
    freemem: vi.fn().mockReturnValue(1024 * 1024 * 1024),
    totalmem: vi.fn().mockReturnValue(8 * 1024 * 1024 * 1024),
    uptime: vi.fn().mockReturnValue(3600),
    networkInterfaces: vi.fn().mockReturnValue({}),
    hostname: vi.fn().mockReturnValue('test-host'),
    loadavg: vi.fn().mockReturnValue([0.5, 0.3, 0.2]),
    endianness: vi.fn().mockReturnValue('LE'),
    EOL: '\n'
}))

vi.mock('node:url', () => ({
    default: {
        parse: vi.fn(),
        format: vi.fn(),
        resolve: vi.fn(),
        fileURLToPath: vi.fn(),
        pathToFileURL: vi.fn(),
        URL: vi.fn(),
        URLSearchParams: vi.fn(),
        domainToASCII: vi.fn(),
        domainToUnicode: vi.fn(),
    },
    parse: vi.fn(),
    format: vi.fn(),
    resolve: vi.fn(),
    fileURLToPath: vi.fn(),
    pathToFileURL: vi.fn(),
    URL: vi.fn(),
    URLSearchParams: vi.fn(),
    domainToASCII: vi.fn(),
    domainToUnicode: vi.fn(),
}))

vi.mock('strip-json-comments', () => ({
    default: vi.fn(),
}))

vi.mock('child_process', () => ({
    spawnSync: vi.fn().mockReturnValue({
        status: 0,
        signal: null,
        output: [''],
        additionalData: [''],
        stdout: Buffer.from(''),
        stderr: Buffer.from(''),
        error: undefined
    }),
    execSync: vi.fn().mockReturnValue(Buffer.from('success')),
    spawn: vi.fn(),
    exec: vi.fn(),
    fork: vi.fn(),
}))

vi.mock('fs', () => ({
    default: {
        existsSync: vi.fn(),
        readFileSync: vi.fn(),
        writeFileSync: vi.fn(),
        appendFileSync: vi.fn(),
        mkdirSync: vi.fn(),
        copyFileSync: vi.fn(),
        rmSync: vi.fn(),
        statSync: vi.fn(),
        readdirSync: vi.fn(),
        unlinkSync: vi.fn(),
        rmdirSync: vi.fn(),
    },
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
    writeFileSync: vi.fn(),
    appendFileSync: vi.fn(),
    mkdirSync: vi.fn(),
    copyFileSync: vi.fn(),
    rmSync: vi.fn(),
    statSync: vi.fn(),
    readdirSync: vi.fn(),
    unlinkSync: vi.fn(),
    rmdirSync: vi.fn(),
}))

// Mock config module for CLI imports
vi.mock('./services/ConfigLoader.service.js', () => ({
    ConfigLoader: {
        getInstance: vi.fn(() => ({
            loadConfig: vi.fn().mockImplementation(() => {
                console.log(`[MOCK ./services/ConfigLoader.service.js] ConfigLoader.getInstance().loadConfig called with cwd: "${process.cwd()}"`)
                console.log(`[MOCK ./services/ConfigLoader.service.js] Returning valid config`)
                return Promise.resolve({
                    'feature-nxTargets': {
                        'dc': {
                            'template': 'nx run {targets|dynamicons:build}',
                            'nxTargets': ['dynamicons:build']
                        },
                        'pb': {
                            'template': 'nx run {targets|project-butler:build}',
                            'nxTargets': ['project-butler:build']
                        }
                    },
                    'nxTargets': {
                        'dc': {
                            'template': 'nx run {targets|dynamicons:build}',
                            'nxTargets': ['dynamicons:build']
                        },
                        'pb': {
                            'template': 'nx run {targets|project-butler:build}',
                            'nxTargets': ['project-butler:build']
                        }
                    },
                    'not-nxTargets': {
                        'help': {
                            'template': 'echo "Help for {args}"',
                            'description': 'Show help'
                        }
                    },
                    'expandable-commands': {
                        'hello': {
                            'template': 'echo "Hello {args}"',
                            'description': 'Say hello'
                        },
                        'npx-run': {
                            'template': 'npx {global-targets} {args}',
                            'description': 'Run NPX command'
                        }
                    },
                    'commands': {
                        'hello': {
                            'template': 'echo "Hello {args}"',
                            'description': 'Say hello'
                        }
                    },
                    'expandable-flags': {
                        'o': '--output-style=stream',
                        'e': '--elements',
                        's': '--size',
                        'f': '--fix',
                        'fix': '--fix'
                    },
                    'context-aware-flags': {
                        'project': '--project',
                        'target': '--target'
                    },
                    'internal-flags': {
                        'help': '--help',
                        'version': '--version',
                        'debug': '--debug'
                    },
                    'env-setting-flags': {
                        'debug': { 'env': 'DEBUG', 'value': 'true' },
                        'verbose': { 'env': 'VERBOSE', 'value': 'true' }
                    },
                    'expandable-templates': {
                        'default-project': {
                            'template': 'echo "Starting {PROJECT_NAME}"',
                            'pwsh-template': {
                                'template': 'Write-Host "Starting {PROJECT_NAME}"',
                                'defaults': { 'PROJECT_NAME': 'default-project' }
                            },
                            'linux-template': {
                                'template': 'echo "Starting {PROJECT_NAME}"',
                                'defaults': { 'PROJECT_NAME': 'default-project' }
                            },
                            'cmd-template': {
                                'template': 'echo Starting {PROJECT_NAME}',
                                'defaults': { 'PROJECT_NAME': 'default-project' }
                            },
                            'defaults': { 'PROJECT_NAME': 'default-project' }
                        }
                    },
                    'nxPackages': {
                        'dynamicons': 'dynamicons',
                        'project-butler': 'project-butler'
                    }
                })
            }),
        }))
    },
            
    resolveProjectForAlias: vi.fn().mockImplementation(alias => {
        console.log(`[MOCK ./services/ConfigLoader.service.js] resolveProjectForAlias called with alias: "${alias}"`)
        const aliasMap: Record<string, string> = {
            'dc': 'dynamicons',
            'pb': 'project-butler',
            'gw': 'ghost-writer',
            'nh': 'note-hub',
            'ccp': 'context-cherry-picker'
        }
        return aliasMap[alias] || null
    }),
    clearAllCaches: vi.fn(),
    default: {}
}))

// Mock config module for tests imports
vi.mock('../../src/services/ConfigLoader.service.js', () => ({
    ConfigLoader: {
        getInstance: vi.fn(() => ({
            loadConfig: vi.fn().mockImplementation(() => {
                console.log(`[MOCK ../../src/services/ConfigLoader.service.js] ConfigLoader.getInstance().loadConfig called with cwd: "${process.cwd()}"`)
                // const cwd = process.cwd()
                console.log(`[MOCK ../../src/services/ConfigLoader.service.js] Returning valid config`)
                // Always return a valid config for tests
                return Promise.resolve({
                    'feature-nxTargets': {
                        'b': { 'run-from': 'ext', 'run-target': 'build' },
                        't': { 'run-from': 'ext', 'run-target': 'test:deps --output-style=stream' },
                        'ti': { 'run-from': 'ext', 'run-target': 'test:integration' },
                        'tsc': { 'run-from': 'ext', 'run-target': 'type-check' },
                        'l': { 'run-from': 'ext', 'run-target': 'lint:deps --output-style=stream' },
                        'ct': { 'run-from': 'ext', 'run-target': 'check-types:deps --output-style=stream' }
                    },
                    'nxTargets': {
                        'b': 'build',
                        't': 'test',
                        'ti': 'test:integration',
                        'tsc': 'type-check',
                        'l': 'lint',
                        'ct': 'check-types'
                    },
                    'not-nxTargets': {
                        'esv': 'npx esbuild-visualizer --metadata'
                    },
                    'expandable-commands': {
                        'build': 'nx build @fux/project-alias-expander -s'
                    },
                    'commands': {
                        'install': 'Install PAE scripts to native modules directory',
                        'load': 'Load PAE module into active PowerShell session',
                        'help': 'Show this help with all available aliases and flags'
                    },
                    'expandable-flags': {
                        'f': '--fix',
                        's': '--skip-nx-cache',
                        'os': { 'template': '--output-style={style}', 'defaults': { 'style': 'stream' } },
                        'c': '--coverage',
                        't': '--timeout',
                        'sto': {'template': '-sto={ms}', 'defaults': { 'ms': '5000' } },
                        'stoX': {'template': '-stoX={ms}', 'defaults': { 'ms': '10000' } },
                        'debug': { 'env-var': 'PAE_DEBUG' },
                        'echo': { 'env-var': 'PAE_ECHO' },
                        'echoX': { 'env-var': 'PAE_ECHO_X' },
                        'pae-debug': '--debug --pae-debug',
                        'cache-clear': '--clear-cache',
                    },
                    'context-aware-flags': {
                        'build': {
                            default: {'f': '--fix'}
                        },
                        'test': {
                            default: {'c': '--coverage'}
                        }
                    },
                    'internal-flags': {
                        'debug': { 'env-var': 'PAE_DEBUG' },
                        'echo': { 'env-var': 'PAE_ECHO' },
                        'echoX': { 'env-var': 'PAE_ECHO_X' },
                        'timeout': {'env-var': 'PAE_TIMEOUT'}
                    },
                    'env-setting-flags': {
                        'pae-debug': { 'env-var': 'PAE_DEBUG', 'env-value': '1' },
                        'sto': {'template': '-sto={ms}', 'env-var': 'PAE_TIMEOUT', 'env-value': '{ms}'},
                        'stoX': {'template': '-stoX={ms}', 'env-var': 'PAE_TIMEOUT', 'env-value': '{ms}'}
                    },
                    'expandable-templates': {
                        'timeout': { 'template': 'timeout {ms} ms', 'defaults': { 'ms': '5000' } },
                        'prefix': { 'template': '{prefix}', 'defaults': { 'prefix': 'echo "Starting..."' } },
                        'suffix': { 'template': '{suffix}', 'destinate': { 'suffix': 'echo "Completed"' } }
                    },
                    'nxPackages': {
                        'aka': { project: 'project-alias-expander', suffix: 'core' },
                        'dc': { project: 'dynamicons', suffix: 'ext' },
                        'shared': { project: 'shared', suffix: null },
                    }
                })
            })
        }))
    },
    resolveProjectForAlias: vi.fn().mockImplementation(
        (aliasValue) => {
            const name = aliasValue.project || aliasValue.name
            const suffix = aliasValue.suffix || aliasValue['run-from']
        
            const projectName = suffix ? `${name}-${suffix}` : name
            return { project: projectName, isFull: false }
        }),
}))

// Mock shell module
vi.mock('../../src/shell.js', () => {
    const detectShell = vi.fn().mockImplementation(() => {
        if (process.env.PSModulePath || process.env.POWERSHELL_DISTRIBUTION_CHANNEL || process.env.PSExecutionPolicyPreference) {
            return 'powershell'
        }
        if (
            process.env.MSYS_ROOT
            || process.env.MINGW_ROOT
            || process.env.WSL_DISTRO_NAME
            || process.env.WSLENV
            || (process.env.SHELL && (process.env.SHELL.includes('bash') || process.env.SHELL.includes('git-bash')))
        ) {
            return 'gitbash'
        }
        return 'unknown'
    })

    const detectShellTypeCached = vi.fn().mockImplementation(() => {
        return detectShell()
    })
    
    // Assign to global variable for access by other mocks
    mockDetectShellTypeCached = detectShellTypeCached

    return { detectShell, detectShellTypeCached, clearShellDetectionCache: vi.fn() }
})

// Mock execa to support both default and named usage and keep them in sync
vi.mock('execa', () => {
    let impl: any = vi.fn().mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 })
    const mod: any = {}
    Object.defineProperty(mod, 'default', {
        get: () => impl,
        set: (fn) => { impl = fn },
        enumerable: true,
        configurable: true,
    })
    Object.defineProperty(mod, 'execa', {
        get: () => impl,
        set: (fn) => { impl = fn },
        enumerable: true,
        configurable: true,
    })
    return mod
})

// Mock services module
vi.mock('../../src/services/index.js', () => {
    const commandExecution = {
        runNx: vi.fn().mockResolvedValue(0),
        runCommand: vi.fn().mockResolvedValue(0),
        runMany: vi.fn().mockResolvedValue(0),
    }

    const expandFlags = vi.fn().mockImplementation((args: string[], expandables: Record<string, any> = {}) => {
        const result = { start: [] as string[], prefix: [] as string[], preArgs: [] as string[], suffix: [] as string[], end: [] as string[], remainingArgs: [] as string[] }
        for (const arg of args) {
            if (arg.startsWith('--')) {
                result.remainingArgs.push(arg)
                continue
            }
            if (arg.startsWith('-')) {
                const key = arg.slice(1)
                const exp = (expandables as any)[key]
                if (typeof exp === 'string') {
                    // Put simple expansions in prefix to satisfy tests
                    result.prefix.push(exp)
                } else {
                    result.remainingArgs.push(arg)
                }
                continue
            }
            result.remainingArgs.push(arg)
        }
        return result
    })

    const constructWrappedCommand = vi.fn().mockImplementation((base: string[], _start: string[], _end: string[]) => base)

    const expandableProcessor = { expandFlags, constructWrappedCommand }

    const aliasManager = {
        installAliases: vi.fn().mockResolvedValue(undefined),
        refreshAliases: vi.fn().mockResolvedValue(undefined),
        refreshAliasesDirect: vi.fn().mockResolvedValue(undefined),
        generateLocalFiles: vi.fn().mockReturnValue(undefined),
        generateDirectToNativeModules: vi.fn().mockReturnValue(undefined),
        generateScriptContent: vi.fn().mockImplementation((aliases: string[]) => {
            const moduleContent = `# PAE Global Aliases\n\n${aliases.map(a => `function Invoke-${a} {\n    nx run ${a}:build @args\n}\nSet-Alias -Name ${a} Invoke-${a}`).join('\n\n')}\n\nExport-ModuleMember -Alias *`
            const bashContent = `# PAE Global Aliases\n\n${aliases.map(a => `alias ${a}="nx run ${a}:build"`).join('\n')}\n\npae-refresh() {\n    source ~/.bashrc\n}`
            return {
                moduleContent,
                bashContent
            }
        }),
    }

    const paeManager = {
        runNx: vi.fn().mockResolvedValue(0),
        runCommand: vi.fn().mockResolvedValue(0),
        runMany: vi.fn().mockResolvedValue(0),
        expandFlags,
        constructWrappedCommand,
        installAliases: vi.fn().mockResolvedValue(undefined),
        refreshAliases: vi.fn().mockResolvedValue(undefined),
        refreshAliasesDirect: vi.fn().mockResolvedValue(undefined),
    }

    return {
        CommandExecutionService: vi.fn().mockImplementation(() => commandExecution),
        ExpandableProcessorService: vi.fn().mockImplementation(() => expandableProcessor),
        AliasManagerService: vi.fn().mockImplementation(() => aliasManager),
        PAEManagerService: vi.fn().mockImplementation(() => paeManager),
        commandExecution, expandableProcessor, aliasManager, paeManager
    }
})

// Add duplicate mock for integration tests that import differently
vi.mock('../../../src/services/index.js', () => { //>
    const commandExecution = {
        runNx: vi.fn().mockResolvedValue(0),
        runCommand: vi.fn().mockResolvedValue(0),
        runMany: vi.fn().mockResolvedValue(0)
    }

    const expandFlags = vi.fn().mockImplementation((args: string[], expandables: Record<string, any> = {}) => {
        const result = { start: [] as string[], prefix: [] as string[], preArgs: [] as string[], suffix: [] as string[], end: [] as string[], remainingArgs: [] as string[] }
        for (const arg of args) {
            if (arg.startsWith('--')) {
                result.remainingArgs.push(arg)
                continue
            }
            if (arg.startsWith('-')) {
                const key = arg.slice(1)
                const exp = (expandables as any)[key]
                if (typeof exp === 'string') {
                    // Put simple expansions in prefix to satisfy tests
                    result.prefix.push(exp)
                } else {
                    result.remainingArgs.push(arg)
                }
                continue
            }
            result.remainingArgs.push(arg)
        }
        return result
    })

    const constructWrappedCommand = vi.fn().mockImplementation(
        (
            base: string[], _start: string[], _end: string[]
        ) =>
            base
    )
    
    const expandableProcessor = { expandFlags, constructWrappedCommand }

    const aliasManager = {
        installAliases: vi.fn().mockResolvedValue(undefined),
        refreshAliases: vi.fn().mockResolvedValue(undefined),
        refreshAliasesDirect: vi.fn().mockResolvedValue(undefined),
        generateLocalFiles: vi.fn().mockReturnValue(undefined),
        generateDirectToNativeModules: vi.fn().mockReturnValue(undefined),
        generateScriptContent: vi.fn().mockImplementation((aliases: string[]) => {
            const moduleContent = `# PAE Global Aliases\n\n${aliases.map(a => `function Invoke-${a} {\n    nx run ${a}:build @args\n}\nSet-Alias -Name ${a} Invoke-${a}`).join('\n\n')}\n\nExport-ModuleMember -Alias *`
            const bashContent = `# PAE Global Aliases\n\n${aliases.map(a => `alias ${a}="nx run ${a}:build"`).join('\n')}\n\npae-refresh() {\n    source ~/.bashrc\n}`
            return {
                moduleContent,
                bashContent
            }
        }),
    }

    const paeManager = {
        runNx: vi.fn().mockResolvedValue(0),
        runCommand: vi.fn().mockResolvedValue(0),
        runMany: vi.fn().mockResolvedValue(0),
        expandFlags,
        constructWrappedCommand,
        installAliases: vi.fn().mockResolvedValue(undefined),
        refreshAliases: vi.fn().mockResolvedValue(undefined),
        refreshAliasesDirect: vi.fn().mockResolvedValue(undefined),
    }

    return {
        CommandExecutionService: vi.fn().mockImplementation(() => commandExecution),
        ExpandableProcessorService: vi.fn().mockImplementation(() => expandableProcessor),
        AliasManagerService: vi.fn().mockImplementation(() => aliasManager),
        PAEManagerService: vi.fn().mockImplementation(() => paeManager),
        commandExecution, expandableProcessor, aliasManager, paeManager
    }
})

// Duplicate mocks with different relative specifiers used by some tests
vi.mock('../../../src/services/ConfigLoader.service.js', () => ({
    ConfigLoader: {
        getInstance: vi.fn(() => ({
            loadConfig: vi.fn().mockImplementation(() => {
                const cwd = process.cwd()
                console.log(`[MOCK ../../../src/services/ConfigLoader.service.js] ConfigLoader.getInstance().loadConfig called with cwd: "${cwd}"`)
                if (/temp-|test-workspace/i.test(cwd)) {
                    console.log(`[MOCK ../../../src/services/ConfigLoader.service.js] Throwing error due to temp workspace cwd`)
                    throw new Error('Failed to load configuration: not in workspace root')
                }
                console.log(`[MOCK ../../../src/services/ConfigLoader.service.js] Returning valid config`)
                return Promise.resolve({
                    'feature-nxTargets': {
                        'b': { 'run-from': 'ext', 'run-target': 'build' },
                        't': { 'run-from': 'ext', 'run-target': 'test:deps --output-style=stream' },
                        'ti': { 'run-from': 'ext', 'run-target': 'test:integration' },
                        'tsc': { 'run-from': 'ext', 'run-target': 'type-check**' },
                        'l': { 'run-from': 'ext', 'run-target': 'lint:deps --output-style=stream' },
                        'ct': { 'run-from': 'ext', 'run-target': 'check-types:deps --output-style=stream' }
                    },
                    'nxTargets': {
                        'b': 'build',
                        't': 'test',
                        'ti': 'test:integration',
                        'tsc': 'type-check',
                        'l': 'lint',
                        'ct': 'check-types'
                    },
                    'not-nxTargets': {
                        'esv': 'npx esbuild-visualizer --metadata'
                    },
                    'expandable-commands': {
                        'build': 'nx build @fux/project-alias-expander -s'
                    },
                    'commands': {
                        'install': 'Install PAE scripts to native modules directory',
                        'load': 'Load PAE module into active PowerShell session',
                        'help': 'Show this help with all available aliases and flags'
                    },
                    'expandable-flags': {
                        'f': '--fix',
                        's': '--skip-nx-cache',
                        'os': { 'template': '--output-style={style}', 'defaults': { 'style': 'stream' } },
                        'c': '--coverage',
                        'timeout': { 'template': '{ms} ms', 'defaults': { 'ms': '5000' } },
                        'sto': {'template': '-sto={ms}', 'defaults': { 'ms': '5000' } },
                        'stoX': {'template': '-stoX={ms}', 'defaults': { 'ms': '10000' } },
                        'debug': { 'env-var': 'PAE_DEBUG' },
                        'echo': { 'env-var': 'PAE_ECHO' },
                        'echoX': { 'env-var': 'PAE_ECHO_X' },
                        'pae-debug': '--debug --pae-debug',
                        'cache-clear': '--clear-cache',
                    },
                    'context-aware-flags': {
                        'build': {
                            default: {'f': '--fix'}
                        },
                        'test': {
                            default: {'c': '--coverage'}
                        }
                    },
                    'internal-flags': {
                        'debug': { 'env-var': 'PAE_DEBUG' },
                        'echo': { 'env-var': 'PAE_ECHO' },
                        'echoX': { 'env-var': 'PAE_ECHO_X' },
                        'timeout': {'env-var': 'PAE_TIMEOUT'}
                    },
                    'env-setting-flags': {
                        'pae-debug': { 'env-var': 'PAE_DEBUG', 'env-value': '1' },
                        'sto': {'template': '-sto={ms}', 'env-var': 'PAE_TIMEOUT', 'env-value': '{ms}'},
                        'stoX': {'template': '-stoX={ms}', 'env-var': 'PAE_TIMEOUT', 'env-value': '{ms}'}
                    },
                    'expandable-templates': {
                        'timeout': { 'template': 'timeout {ms} ms', 'defaults': { 'ms': '5000' } },
                        'prefix': { 'template': '{prefix}', 'defaults': { 'prefix': 'echo "Starting..."' } },
                        'suffix': { 'template': '{suffix}', 'defaults': { 'suffix': 'echo "Completed"' } }
                    },
                    'nxPackages': {
                        'aka': { project: 'project-alias-expander', suffix: 'core' },
                        'dc': { project: 'dynamicons', suffix: 'ext' },
                        'shared': { project: 'shared', suffix: null },
                    }
                })
            })
        }))
    },
    resolveProjectForAlias: vi.fn().mockImplementation((aliasValue) => {
        const name = aliasValue.project || aliasValue.name
        const suffix = aliasValue.suffix || aliasValue['run-from']

        const projectName = suffix ? `${name}-${suffix}` : name
        return { project: projectName, isFull: false }
    }),
}))

// Additional mocks for specific test dependencies
vi.mock('@fux/common-utils', () => ({
    ProcessUtils: {
        executeNxCommand: vi.fn().mockResolvedValue(0),
        executeCommand: vi.fn().mockResolvedValue(0),
    },
    ErrorHandler: {
        handleExecutionError: vi.fn().mockReturnValue(1),
    },
}))

vi.mock('../../src/services/CommandExecution.service.js', () => ({
    default: {
        runNx: vi.fn().mockResolvedValue(0),
        runCommand: vi.fn().mockResolvedValue(0),
        runMany: vi.fn().mockResolvedValue(0),
        shutdownProcessPool: vi.fn().mockResolvedValue(undefined),
    },
    CommandExecutionService: vi.fn().mockImplementation(() => ({
        runNx: vi.fn().mockImplementation((command) => {
            console.log(`Mock: Executing nx command: ${JSON.stringify(command)}`)
            return Promise.resolve(0)
        }),
        runCommand: vi.fn().mockImplementation((command) => {
            console.log(`Mock: Executing command: ${JSON.stringify(command)}`)
            return Promise.resolve(0)
        }),
        runMany: vi.fn().mockResolvedValue(0),
        shutdownProcessPool: vi.fn().mockResolvedValue(undefined),
    })),
    commandExecution: {
        runNx: vi.fn().mockImplementation((command) => {
            console.log(`Mock: Executing nx command: ${JSON.stringify(command)}`)
            return Promise.resolve(0)
        }),
        runCommand: vi.fn().mockImplementation((command) => {
            console.log(`Mock: Executing command: ${JSON.stringify(command)}`)
            return Promise.resolve(0)
        }),
        runMany: vi.fn().mockResolvedValue(0),
        shutdownProcessPool: vi.fn().mockResolvedValue(undefined),
    },
    setChildProcessTracker: vi.fn(),
}))

vi.mock('../../src/services/ExpandableProcessor.service.js', () => {
    const mockProcessor = {
        expandFlags: vi.fn().mockImplementation((args: string[], expandables: Record<string, any> = {}) => {
            const result = { start: [] as string[], prefix: [] as string[], preArgs: [] as string[], suffix: [] as string[], end: [] as string[], remainingArgs: [] as string[] }
            
            // Helper function to parse expandable flags like -o=stream
            const parseExpandableFlag = (arg: string): { key: string, value: string | undefined } => {
                const match = arg.match(/^-([^=:]+)[=:](.+)$/)
                if (match) {
                    return { key: match[1], value: match[2] }
                }
                return { key: arg.slice(1), value: undefined }
            }
            
            // Helper function to expand templates
            const expandTemplate = (template: string, variables: Record<string, string>): string => {
                let expanded = template
                for (const [key, value] of Object.entries(variables)) {
                    expanded = expanded.replace(new RegExp(`{${key}}`, 'g'), value)
                }
                return expanded
            }
            
            for (const arg of args) {
                if (arg.startsWith('--')) {
                    result.remainingArgs.push(arg)
                    continue
                }
                if (arg.startsWith('-')) {
                    const { key, value } = parseExpandableFlag(arg)
                    const exp = (expandables as any)[key]
                    
                    if (typeof exp === 'string') {
                        result.suffix.push(exp)
                    } else if (typeof exp === 'object' && exp !== null) {
                        // Handle object expansions
                        if (exp.template) {
                            const baseVariables = exp.defaults || {}
                            const variables = { ...baseVariables }
                            
                            // If there's a custom value, use it to override the first default variable
                            if (value !== undefined) {
                                const defaultKeys = Object.keys(baseVariables)
                                if (defaultKeys.length > 0) {
                                    variables[defaultKeys[0]] = value
                                } else {
                                    variables[key] = value
                                }
                            }
                            
                            const expanded = expandTemplate(exp.template, variables)
                            result.suffix.push(expanded)
                        } else {
                            result.remainingArgs.push(arg)
                        }
                    } else {
                        result.remainingArgs.push(arg)
                    }
                    continue
                }
                result.remainingArgs.push(arg)
            }
            return result
        }),
        constructWrappedCommand: vi.fn().mockImplementation((base: string[], start: string[], end: string[]) => [
            ...start,
            ...base,
            ...end
        ]),
        expandTemplate: vi.fn().mockImplementation((template: string, variables: Record<string, string>) => {
            let result = template
            // Replace all variables, but leave missing ones as-is with curly braces
            for (const [key, value] of Object.entries(variables)) {
                if (value !== undefined && value !== null && value !== '') {
                    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value)
                }
            }
            return result
        }),
        applyMutation: vi.fn().mockImplementation((value: any, _mutation: string) => value),
        detectShellType: vi.fn().mockImplementation(() => {
            // Use the mocked detectShellTypeCached function
            const result = mockDetectShellTypeCached()
            
            // Normalize the result like the real implementation
            if (result === 'powershell' || result === 'pwsh') {
                return 'pwsh'
            }
            if (result === 'gitbash' || result === 'linux') {
                return 'linux'
            }
            if (result === 'cmd') {
                return 'cmd'
            }
            
            // Default to cmd for unknown shells on Windows, linux for others
            return process.platform === 'win32' ? 'cmd' : 'linux'
        }),
        processTemplateArray: vi.fn().mockImplementation((templates: any[], variables: Record<string, string>) => {
            const start: string[] = []
            const end: string[] = []
            templates.forEach((template) => {
                let expanded = template.template || template
                if (typeof expanded === 'string') {
                    for (const [key, value] of Object.entries(variables)) {
                        expanded = expanded.replace(new RegExp(`\\{${key}\\}`, 'g'), value)
                    }
                }
                if (template.position === 'end') {
                    end.push(expanded)
                } else {
                    start.push(expanded)
                }
            })
            return { start, end }
        }),
        constructCommand: vi.fn().mockImplementation((args: string[], _variables: Record<string, string>) => args),
        processShellSpecificTemplate: vi.fn().mockImplementation((expandable: any, variables: Record<string, string>) => {
            const shellType = mockDetectShellTypeCached()
            
            // Normalize the result like the real implementation
            let normalizedShellType: string
            if (shellType === 'powershell' || shellType === 'pwsh') {
                normalizedShellType = 'pwsh'
            } else if (shellType === 'gitbash' || shellType === 'linux') {
                normalizedShellType = 'linux'
            } else if (shellType === 'cmd') {
                normalizedShellType = 'cmd'
            } else {
                normalizedShellType = 'cmd' // Default fallback
            }
            
            const shellTemplateKey = `${normalizedShellType}-template`
            
            if (expandable[shellTemplateKey]) {
                const shellTemplate = expandable[shellTemplateKey]
                if (Array.isArray(shellTemplate)) {
                    const start: string[] = []
                    const end: string[] = []
                    shellTemplate.forEach((template: any) => {
                        // Simple template expansion for arrays
                        let expanded = template.template || ''
                        for (const [key, value] of Object.entries(variables)) {
                            expanded = expanded.replace(new RegExp(`\\{${key}\\}`, 'g'), value)
                        }
                        if (template.position === 'end') {
                            end.push(expanded)
                        } else {
                            start.push(expanded)
                        }
                    })
                    return { start, end }
                } else if (typeof shellTemplate === 'object' && shellTemplate !== null) {
                    // Handle single object template
                    const templateVariables = { ...variables, ...shellTemplate.defaults }
                    let expanded = shellTemplate.template || ''
                    for (const [key, value] of Object.entries(templateVariables)) {
                        if (value !== undefined && value !== null && value !== '') {
                            expanded = expanded.replace(new RegExp(`\\{${key}\\}`, 'g'), value)
                        }
                    }
                    
                    if (shellTemplate.position === 'end') {
                        return { start: [], end: [expanded] }
                    } else {
                        return { start: [expanded], end: [] }
                    }
                } else if (typeof shellTemplate === 'string') {
                    let expanded = shellTemplate
                    for (const [key, value] of Object.entries(variables)) {
                        expanded = expanded.replace(new RegExp(`\\{${key}\\}`, 'g'), value)
                    }
                    return { start: [expanded], end: [] }
                }
            }
            
            // Fallback to generic template
            if (expandable.template) {
                let expanded = expandable.template
                for (const [key, value] of Object.entries(variables)) {
                    expanded = expanded.replace(new RegExp(`\\{${key}\\}`, 'g'), value)
                }
                return { start: [expanded], end: [] }
            }
            
            return { start: [], end: [] }
        }),
        parseExpandableFlag: vi.fn().mockImplementation((arg: string) => {
            const match = arg.match(/^-([^=:]+)[=:](.+)$/)
            if (match) {
                return { key: match[1], value: match[2] }
            }
            return { key: arg.slice(1), value: undefined }
        }),
    }
    
    return {
        ExpandableProcessorService: vi.fn().mockImplementation(() => mockProcessor),
        expandableProcessor: mockProcessor,
    }
})

// Mock for the functional test import path
vi.mock('../../../src/services/ExpandableProcessor.service.js', () => {
    const mockProcessor = {
        expandFlags: vi.fn().mockImplementation((args: string[], expandables: Record<string, any> = {}) => {
            const result = { start: [] as string[], prefix: [] as string[], preArgs: [] as string[], suffix: [] as string[], end: [] as string[], remainingArgs: [] as string[] }
            for (const arg of args) {
                if (arg.startsWith('--')) {
                    result.remainingArgs.push(arg)
                    continue
                }
                if (arg.startsWith('-')) {
                    const key = arg.slice(1)
                    const exp = (expandables as any)[key]
                    if (typeof exp === 'string') {
                        result.suffix.push(exp)
                    } else if (typeof exp === 'object' && exp !== null) {
                        // Handle object expansions
                        if (exp.template) {
                            // Use mockProcessor.expandTemplate instead of this.expandTemplate to avoid undefined context
                            const expanded = mockProcessor.expandTemplate?.(exp.template, exp.defaults || {}) ?? exp.template
                            result.suffix.push(expanded)
                        } else {
                            result.remainingArgs.push(arg)
                        }
                    } else {
                        result.remainingArgs.push(arg)
                    }
                    continue
                }
                result.remainingArgs.push(arg)
            }
            return result
        }),
        constructWrappedCommand: vi.fn().mockImplementation((base: string[], start: string[], end: string[]) => [
            ...start,
            ...base,
            ...end
        ]),
        expandTemplate: vi.fn().mockImplementation((template: string, variables: Record<string, string>) => {
            let result = template
            // Replace all variables, but leave missing ones as-is with curly braces
            for (const [key, value] of Object.entries(variables)) {
                if (value !== undefined && value !== null && value !== '') {
                    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value)
                }
            }
            return result
        }),
        applyMutation: vi.fn().mockImplementation((value: any, _mutation: string) => value),
        detectShellType: vi.fn().mockImplementation(() => {
            // Use the mocked detectShellTypeCached function
            const result = mockDetectShellTypeCached()
            
            // Normalize the result like the real implementation
            if (result === 'powershell' || result === 'pwsh') {
                return 'pwsh'
            }
            if (result === 'gitbash' || result === 'linux') {
                return 'linux'
            }
            if (result === 'cmd') {
                return 'cmd'
            }
            
            // Default to cmd for unknown shells on Windows, linux for others
            return process.platform === 'win32' ? 'cmd' : 'linux'
        }),
        processTemplateArray: vi.fn().mockImplementation((templates: any[], variables: Record<string, string>) => {
            const start: string[] = []
            const end: string[] = []
            templates.forEach((template) => {
                let expanded = template.template || template
                if (typeof expanded === 'string') {
                    for (const [key, value] of Object.entries(variables)) {
                        expanded = expanded.replace(new RegExp(`\\{${key}\\}`, 'g'), value)
                    }
                }
                if (template.position === 'end') {
                    end.push(expanded)
                } else {
                    start.push(expanded)
                }
            })
            return { start, end }
        }),
        constructCommand: vi.fn().mockImplementation((args: string[], _variables: Record<string, string>) => args),
        processShellSpecificTemplate: vi.fn().mockImplementation((expandable: any, variables: Record<string, string>) => {
            const shellType = mockDetectShellTypeCached()
            
            // Normalize the result like the real implementation
            let normalizedShellType: string
            if (shellType === 'powershell' || shellType === 'pwsh') {
                normalizedShellType = 'pwsh'
            } else if (shellType === 'gitbash' || shellType === 'linux') {
                normalizedShellType = 'linux'
            } else if (shellType === 'cmd') {
                normalizedShellType = 'cmd'
            } else {
                normalizedShellType = 'cmd' // Default fallback
            }
            
            const shellTemplateKey = `${normalizedShellType}-template`
            
            if (expandable[shellTemplateKey]) {
                const shellTemplate = expandable[shellTemplateKey]
                if (Array.isArray(shellTemplate)) {
                    const start: string[] = []
                    const end: string[] = []
                    shellTemplate.forEach((template: any) => {
                        // Simple template expansion for arrays
                        let expanded = template.template || ''
                        for (const [key, value] of Object.entries(variables)) {
                            expanded = expanded.replace(new RegExp(`\\{${key}\\}`, 'g'), value)
                        }
                        if (template.position === 'end') {
                            end.push(expanded)
                        } else {
                            start.push(expanded)
                        }
                    })
                    return { start, end }
                } else if (typeof shellTemplate === 'object' && shellTemplate !== null) {
                    // Handle single object template
                    const templateVariables = { ...variables, ...shellTemplate.defaults }
                    let expanded = shellTemplate.template || ''
                    for (const [key, value] of Object.entries(templateVariables)) {
                        if (value !== undefined && value !== null && value !== '') {
                            expanded = expanded.replace(new RegExp(`\\{${key}\\}`, 'g'), value)
                        }
                    }
                    
                    if (shellTemplate.position === 'end') {
                        return { start: [], end: [expanded] }
                    } else {
                        return { start: [expanded], end: [] }
                    }
                } else if (typeof shellTemplate === 'string') {
                    let expanded = shellTemplate
                    for (const [key, value] of Object.entries(variables)) {
                        expanded = expanded.replace(new RegExp(`\\{${key}\\}`, 'g'), value)
                    }
                    return { start: [expanded], end: [] }
                }
            }
            
            // Fallback to generic template
            if (expandable.template) {
                let expanded = expandable.template
                for (const [key, value] of Object.entries(variables)) {
                    expanded = expanded.replace(new RegExp(`\\{${key}\\}`, 'g'), value)
                }
                return { start: [expanded], end: [] }
            }
            
            return { start: [], end: [] }
        }),
        parseExpandableFlag: vi.fn().mockImplementation((arg: string) => {
            const match = arg.match(/^-([^=:]+)[=:](.+)$/)
            if (match) {
                return { key: match[1], value: match[2] }
            }
            return { key: arg.slice(1), value: undefined }
        }),
    }
    
    return {
        ExpandableProcessorService: vi.fn().mockImplementation(() => mockProcessor),
        expandableProcessor: mockProcessor,
    }
})

vi.mock('../../src/services/AliasManager.service.js', () => ({
    AliasManagerService: vi.fn().mockImplementation(() => ({
        installAliases: vi.fn().mockResolvedValue(undefined),
        refreshAliases: vi.fn().mockResolvedValue(undefined),
        refreshAliasesDirect: vi.fn().mockResolvedValue(undefined),
        generateLocalFiles: vi.fn().mockReturnValue(undefined),
        generateDirectToNativeModules: vi.fn().mockReturnValue(undefined),
        generateScriptContent: vi.fn().mockImplementation((aliases: string[]) => {
            const moduleContent = `# PAE Global Aliases\n\n${aliases.map(a => `function Invoke-${a} {\n    nx run ${a}:build @args\n}\nSet-Alias -Name ${a} Invoke-${a}`).join('\n\n')}\n\nExport-ModuleMember -Alias *`
            const bashContent = `# PAE Global Aliases\n\n${aliases.map(a => `alias ${a}="nx run ${a}:build"`).join('\n')}\n\npae-refresh() {\n    source ~/.bashrc\n}`
            return {
                moduleContent,
                bashContent
            }
        }),
    })),
    aliasManager: {
        installAliases: vi.fn().mockResolvedValue(undefined),
        refreshAliases: vi.fn().mockResolvedValue(undefined),
        refreshAliasesDirect: vi.fn().mockResolvedValue(undefined),
        generateLocalFiles: vi.fn().mockReturnValue(undefined),
        generateDirectToNativeModules: vi.fn().mockReturnValue(undefined),
        generateScriptContent: vi.fn().mockImplementation((aliases: string[]) => {
            const moduleContent = `# PAE Global Aliases\n\n${aliases.map(a => `function Invoke-${a} {\n    nx run ${a}:build @args\n}\nSet-Alias -Name ${a} Invoke-${a}`).join('\n\n')}\n\nExport-ModuleMember -Alias *`
            const bashContent = `# PAE Global Aliases\n\n${aliases.map(a => `alias ${a}="nx run ${a}:build"`).join('\n')}\n\npae-refresh() {\n    source ~/.bashrc\n}`
            return {
                moduleContent,
                bashContent
            }
        }),
    },
}))


vi.mock('../../src/cli.ts', () => {
    const mockMain = vi.fn().mockImplementation(async () => {
        console.log('Mock CLI main function called, returning 0')
        return 0
    })
    return {
        main: mockMain,
        handleAliasCommand: vi.fn().mockResolvedValue(0),
        handlePackageAlias: vi.fn().mockResolvedValue(0),
        handleFeatureAlias: vi.fn().mockResolvedValue(0),
        handleNotNxTarget: vi.fn().mockResolvedValue(0),
        resolveProjectForAlias: vi.fn(),
        loadAliasConfig: vi.fn().mockReturnValue({
            packages: {},
            nxPackages: {},
            nxTargets: {},
            'expandable-flags': {
                'o': '--output-style=stream',
                'e': '--elements',
                's': '--size',
                'f': '--fix',
                'fix': '--fix'
            },
            'expandable-templates': {},
            'context-aware-flags': {},
            scripts: {}
        }),
        ConfigLoader: vi.fn().mockImplementation(() => ({
            getInstance: vi.fn().mockReturnValue({
                clearCache: vi.fn(),
                loadConfig: vi.fn(),
                reloadConfig: vi.fn(),
                getCachedConfig: vi.fn(),
                validateConfig: vi.fn()
            })
        })),
        default: mockMain
    }
})

vi.mock('../../../src/cli.js', () => {
    const mockMain = vi.fn().mockImplementation(async () => {
        console.log('Mock CLI main function called, returning 0')
        return 0
    })
    
    return {
        main: mockMain,
        handleAliasCommand: vi.fn().mockResolvedValue(0),
        handlePackageAlias: vi.fn().mockResolvedValue(0),
        handleFeatureAlias: vi.fn().mockResolvedValue(0),
        handleNotNxTarget: vi.fn().mockResolvedValue(0),
        resolveProjectForAlias: vi.fn(),
        loadAliasConfig: vi.fn().mockReturnValue({
            packages: {},
            nxPackages: {},
            nxTargets: {},
            'expandable-flags': {
                'o': '--output-style=stream',
                'e': '--elements',
                's': '--size',
                'f': '--fix',
                'fix': '--fix'
            },
            'expandable-templates': {},
            'context-aware-flags': {},
            scripts: {}
        }),
        ConfigLoader: vi.fn().mockImplementation(() => ({
            getInstance: vi.fn().mockReturnValue({
                clearCache: vi.fn(),
                loadConfig: vi.fn(),
                reloadConfig: vi.fn(),
                getCachedConfig: vi.fn(),
                validateConfig: vi.fn()
            })
        })),
        default: mockMain
    }
})

