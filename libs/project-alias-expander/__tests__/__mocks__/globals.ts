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
afterEach(() => vi.clearAllMocks())

// Safe cwd/chdir stubs to prevent ENOENT while allowing tests to simulate directory changes
const REAL_CWD = process.cwd()
let MOCK_CWD = REAL_CWD

Object.defineProperty(process, 'cwd', {
    value: vi.fn().mockImplementation(() => MOCK_CWD),
    writable: true
})

// Stub chdir to update MOCK_CWD without touching the real filesystem
// This prevents errors like: ENOENT ... -> '/test/workspace'
// Tests that rely on cwd changes will observe the new value via process.cwd()
// but no actual directory change happens.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - override is intentional for test env
process.chdir = vi.fn().mockImplementation((dir?: string) => {
    MOCK_CWD = typeof dir === 'string' ? dir : REAL_CWD
})

// Global Node.js module mocks
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

vi.mock('node:child_process', () => ({
    spawnSync: vi.fn().mockReturnValue({
        status: 0,
        signal: null,
        output: [''],
        pid: 123,
        stdout: Buffer.from(''),
        stderr: Buffer.from(''),
        error: undefined
    }),
    execSync: vi.fn().mockReturnValue(Buffer.from('success')),
    spawn: vi.fn(),
    exec: vi.fn(),
    fork: vi.fn(),
}))

vi.mock('node:os', () => ({
    default: {
        platform: vi.fn().mockReturnValue('win32'),
        homedir: vi.fn().mockReturnValue('/home/user'),
        tmpdir: vi.fn().mockReturnValue('/tmp'),
        userInfo: vi.fn().mockReturnValue({ username: 'user' }),
    },
    platform: vi.fn().mockReturnValue('win32'),
    homedir: vi.fn().mockReturnValue('/home/user'),
    tmpdir: vi.fn().mockReturnValue('/tmp'),
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
        pid: 123,
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

vi.mock('path', () => ({
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

vi.mock('os', () => ({
    default: {
        platform: vi.fn().mockReturnValue('win32'),
        homedir: vi.fn().mockReturnValue('/home/user'),
        tmpdir: vi.fn().mockReturnValue('/tmp'),
        userInfo: vi.fn().mockReturnValue({ username: 'user' }),
    },
    platform: vi.fn().mockReturnValue('win32'),
    homedir: vi.fn().mockReturnValue('/home/user'),
    tmpdir: vi.fn().mockReturnValue('/tmp'),
    userInfo: vi.fn().mockReturnValue({ username: 'user' }),
}))

vi.mock('url', () => ({
    default: {
        fileURLToPath: vi.fn(),
        pathToFileURL: vi.fn(),
        URL: vi.fn(),
    },
    fileURLToPath: vi.fn(),
    pathToFileURL: vi.fn(),
    URL: vi.fn(),
}))

vi.mock('../../src/config.js', () => ({
    loadAliasConfig: vi.fn().mockImplementation(() => {
        const cwd = process.cwd()
        // Simulate config load failure only for known temp dirs used in tests
        if (/temp-|test-workspace/i.test(cwd)) {
            throw new Error('Failed to load configuration: not in workspace root')
        }
        return {
            nxPackages: {
                dc: 'dynamicons',
                pbc: { name: 'project-butler', suffix: 'core' }
            },
            nxTargets: {
                b: 'build',
                t: 'test'
            },
            'expandable-flags': {
                f: '--fix',
                s: '--skip-nx-cache'
            }
        }
    }),
    resolveProjectForAlias: vi.fn().mockImplementation((aliasValue) => {
        if (typeof aliasValue === 'string') {
            return { project: aliasValue, isFull: false }
        }
        
        const { name, suffix, full } = aliasValue

        if (full) {
            // When full is true, we still need to consider the suffix
            const projectName = suffix ? `${name}-${suffix}` : name
            return { project: projectName, isFull: true }
        }
        
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

// Duplicate mocks with different relative specifiers used by some tests
vi.mock('../../../src/config.js', () => ({
    loadAliasConfig: vi.fn().mockImplementation(() => {
        const cwd = process.cwd()
        if (/temp-|test-workspace/i.test(cwd)) {
            throw new Error('Failed to load configuration: not in workspace root')
        }
        return {
            nxPackages: {
                dc: 'dynamicons',
                pbc: { name: 'project-butler', suffix: 'core' }
            },
            nxTargets: {
                b: 'build',
                t: 'test'
            },
            'expandable-flags': {
                f: '--fix',
                s: '--skip-nx-cache'
            }
        }
    }),
    resolveProjectForAlias: vi.fn().mockImplementation((aliasValue) => {
        if (typeof aliasValue === 'string') {
            return { project: aliasValue, isFull: false }
        }
        const { name, suffix, full } = aliasValue
        if (full) {
            const projectName = suffix ? `${name}-${suffix}` : name
            return { project: projectName, isFull: true }
        }
        const projectName = suffix ? `${name}-${suffix}` : name
        return { project: projectName, isFull: false }
    }),
}))

vi.mock('../../../src/services/index.js', () => {
    const commandExecution = {
        runNx: vi.fn().mockResolvedValue(0),
        runCommand: vi.fn().mockResolvedValue(0),
        runMany: vi.fn().mockResolvedValue(0),
    }

    const expandFlags = vi.fn().mockImplementation((args: string[], expandables: Record<string, any> = {}) => {
        const result = { start: [] as string[], prefix: [] as string[], preArgs: [] as string[], suffix: [] as string[], end: [] as string[], remainingArgs: [] as string[] }
        for (const arg of args) {
            if (arg.startsWith('--')) { result.remainingArgs.push(arg); continue }
            if (arg.startsWith('-')) {
                const key = arg.slice(1)
                const exp = (expandables as any)[key]
                if (typeof exp === 'string') { result.prefix.push(exp) } else { result.remainingArgs.push(arg) }
                continue
            }
            result.remainingArgs.push(arg)
        }
        return result
    })
    const constructWrappedCommand = vi.fn().mockImplementation((base: string[], _s: string[], _e: string[]) => base)
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

vi.mock('../../../src/shell.js', () => {
    const detectShell = vi.fn().mockImplementation(() => {
        if (process.env.PSModulePath || process.env.POWERSHELL_DISTRIBUTION_CHANNEL || process.env.PSExecutionPolicyPreference) return 'powershell'
        if (process.env.MSYS_ROOT || process.env.MINGW_ROOT || process.env.WSL_DISTRO_NAME || process.env.WSLENV || (process.env.SHELL && (process.env.SHELL.includes('bash') || process.env.SHELL.includes('git-bash')))) return 'gitbash'
        return 'unknown'
    })
    const detectShellTypeCached = vi.fn().mockImplementation(() => detectShell())
    return { detectShell, detectShellTypeCached }
})