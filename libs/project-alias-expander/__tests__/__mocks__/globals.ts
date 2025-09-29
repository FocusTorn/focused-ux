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

// Mock process.cwd() globally
Object.defineProperty(process, 'cwd', {
    value: vi.fn().mockReturnValue('/test/workspace'),
    writable: true
})

// Global Node.js module mocks
vi.mock('node:fs', () => ({
    default: {
        existsSync: vi.fn(),
        readFileSync: vi.fn(),
        writeFileSync: vi.fn(),
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
    loadAliasConfig: vi.fn(),
    resolveProjectForAlias: vi.fn().mockImplementation((aliasValue) => {
        if (typeof aliasValue === 'string') {
            const project = aliasValue.startsWith('@fux/') ? aliasValue : `@fux/${aliasValue}`
            return { project, isFull: false }
        }
        
        const { name, suffix, full } = aliasValue

        if (full) {
            // When full is true, we still need to consider the suffix
            const projectName = suffix ? `${name}-${suffix}` : name
            const project = projectName.startsWith('@fux/') ? projectName : `@fux/${projectName}`
            return { project, isFull: true }
        }
        
        const projectName = suffix ? `${name}-${suffix}` : name
        const project = projectName.startsWith('@fux/') ? projectName : `@fux/${projectName}`

        return { project, isFull: false }
    }),
}))

// Mock shell module
vi.mock('../../src/shell.js', () => ({
    detectShell: vi.fn().mockImplementation(() => {
        // Implement actual shell detection logic for tests
        if (process.env.PSModulePath || process.env.POWERSHELL_DISTRIBUTION_CHANNEL || process.env.PSExecutionPolicyPreference) {
            return 'powershell'
        }
        if (process.env.MSYS_ROOT || process.env.MINGW_ROOT || process.env.WSL_DISTRO_NAME || process.env.WSLENV
            || (process.env.SHELL && (process.env.SHELL.includes('bash') || process.env.SHELL.includes('git-bash')))) {
            return 'gitbash'
        }
        return 'unknown'
    }),
}))

// Mock services module
vi.mock('../../src/services/index.js', () => ({
    commandExecution: {
        runNx: vi.fn(),
        runCommand: vi.fn(),
        runMany: vi.fn(),
    },
    expandableProcessor: {
        expandFlags: vi.fn(),
        constructWrappedCommand: vi.fn(),
    },
    aliasManager: {
        installAliases: vi.fn(),
        refreshAliases: vi.fn(),
        refreshAliasesDirect: vi.fn(),
        generateLocalFiles: vi.fn(),
    },
    paeManager: {
        runNx: vi.fn(),
        runCommand: vi.fn(),
        runMany: vi.fn(),
        expandFlags: vi.fn(),
        constructWrappedCommand: vi.fn(),
        installAliases: vi.fn(),
        refreshAliases: vi.fn(),
        refreshAliasesDirect: vi.fn(),
    },
}))