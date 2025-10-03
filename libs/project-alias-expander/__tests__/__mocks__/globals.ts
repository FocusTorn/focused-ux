import { vi, beforeAll, afterAll, afterEach } from 'vitest'

// Console output control
const ENABLE_CONSOLE_OUTPUT = process.env.ENABLE_TEST_CONSOLE === 'true'
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
    },
    platform: vi.fn().mockReturnValue('win32'),
    type: vi.fn().mockReturnValue('Windows_NT'),
    arch: vi.fn().mockReturnValue('x64'),
    homedir: vi.fn().mockReturnValue('C:\\Users\\user'),
    tmpdir: vi.fn().mockReturnValue('C:\\Temp'),
    userInfo: vi.fn().mockReturnValue({ username: 'user' }),
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
    unlinkSync: vi_fn(),
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
    },
    platform: vi.fn().mockReturnValue('win32'),
    type: vi.fn().mockReturnValue('Windows_NT'),
    arch: vi.fn().mockReturnValue('x64'),
    homedir: vi.fn().mockReturnValue('C:\\Users\\user'),
    tmpdir: vi.fn().mockReturnValue('C:\\Temp'),
    userInfo: vi.fn().mockReturnValue({ username: 'user' }),
}))

vi.mock('node:url', () => ({
    default: {
        fileURLToPath: vi.fn(),
        pathToFileURL: vi.fn(),
        URL: vi.fn(),
    },
    fileURLToPath: vi.fn(),
    pathToFileURL: vi.fn(),
    URL: vi.fn(),
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

// Mock config module
vi.mock('../../src/config.js', () => ({
    loadAliasConfig: vi.fn().mockImplementation(() => {
        const cwd = process.cwd()
        // Simulate config load failure only for known temp dirs used in tests
        if (/temp-|test-workspace/i.test(cwd)) {
            throw new Error('Failed to load configuration: not in workspace root')
        }
        return {
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
        }
    }),
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
            process.env.MSYS_ROOT ||
            process.env.MINGW_ROOT ||
            process.env.WSL_DISTRO_NAME ||
            process.env.WSLENV ||
            (process.env.SHELL && (process.env.SHELL.includes('bash') || process.env.SHELL.includes('git-bash')))
        ) {
            return 'gitbash'
        }
        return 'unknown'
    })

    const detectShellTypeCached = vi.fn().mockImplementation(() => detectShell())

    return { detectShell, detectShellTypeCached }
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

    return { commandExecution, expandableProcessor, aliasManager, paeManager }
})

// Add duplicate mock for integration tests that import differently
vi.mock('../../../src/services/index.js', () => {
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
    }

    const constructWrappedCommand = vi.fn().mockImplementation((base: string[], _start: string[], _end: string[]) => base)

    const expandableProcessor = { expandFlags, constructWrappedCommand }

    const aliasManager = {
        installAliases: vi.fn().mockResolvedValue(undefined),
        refreshAliases: vi.fn().mockResolvedValue(undefined),
        refreshAliasesDirect: vi.fn().mockResolvedValue(undefined),
        generateLocalFiles: vi.fn().mockReturnValue(undefined),
        generateDirectToNativeModules: vi.fn().mockReturnValue(undefined),
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

    return { commandExecution, expandableProcessor, aliasManager, paeManager }
})

// Duplicate mocks with different relative specifiers used by some tests
vi.mock('../../../src/config.js', () => ({
    loadAliasConfig: vi.fn().mockImplementation(() => {
        const cwd = process.cwd()
        if (/temp-|test-workspace/i.test(cwd)) {
            throw new Error('Failed to load configuration: not in workspace root')
        }
        return {
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
        }
    }),
    resolveProjectForAlias: vi.fn().mockImplementation(
        (aliasValue) => {
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
    commandExecution: {
        runNx: vi.fn().mockResolvedValue(0),
        runCommand: vi.fn().mockResolvedValue(0),
        runMany: vi.fn().mockResolvedValue(0),
        shutdownProcessPool: vi.fn().mockResolvedValue(undefined),
    },
    setChildProcessTracker: vi.fn(),
}))

vi.mock('../../src/services/ExpandableProcessor.service.js', () => ({
    expandableProcessor: {
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
                        result.prefix.push(exp)
                    } else {
                        result.remainingArgs.push(arg)
                    }
                    continue
                }
                result.remainingArgs.push(arg)
            }
            return result
        }),
        constructWrappedCommand: vi.fn().mockImplementation((base: string[], _start: string[], _end: string[]) => base),
    },
}))

vi.mock('../../src/services/AliasManager.service.js', () => ({
    aliasManager: {
        installAliases: vi.fn().mockResolvedValue(undefined),
        refreshAliases: vi.fn().mockResolvedValue(undefined),
        refreshAliasesDirect: vi.fn().mockResolvedValue(undefined),
        generateLocalFiles: vi.fn().mockReturnValue(undefined),
        generateDirectToNativeModules: vi.fn().mockReturnValue(undefined),
    },
}))