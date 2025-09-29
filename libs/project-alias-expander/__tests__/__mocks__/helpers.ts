import { vi } from 'vitest'

// PAE-specific test mocks interface
export interface PaeTestMocks {
    fs: {
        existsSync: ReturnType<typeof vi.fn>
        readFileSync: ReturnType<typeof vi.fn>
        writeFileSync: ReturnType<typeof vi.fn>
        mkdirSync: ReturnType<typeof vi.fn>
        copyFileSync: ReturnType<typeof vi.fn>
        rmSync: ReturnType<typeof vi.fn>
        statSync: ReturnType<typeof vi.fn>
        readdirSync: ReturnType<typeof vi.fn>
        unlinkSync: ReturnType<typeof vi.fn>
        rmdirSync: ReturnType<typeof vi.fn>
    }
    path: {
        join: ReturnType<typeof vi.fn>
        resolve: ReturnType<typeof vi.fn>
        dirname: ReturnType<typeof vi.fn>
        basename: ReturnType<typeof vi.fn>
        extname: ReturnType<typeof vi.fn>
        relative: ReturnType<typeof vi.fn>
        isAbsolute: ReturnType<typeof vi.fn>
        sep: string
        delimiter: string
    }
    childProcess: {
        spawnSync: ReturnType<typeof vi.fn>
        execSync: ReturnType<typeof vi.fn>
        spawn: ReturnType<typeof vi.fn>
        exec: ReturnType<typeof vi.fn>
        fork: ReturnType<typeof vi.fn>
    }
    os: {
        platform: ReturnType<typeof vi.fn>
        homedir: ReturnType<typeof vi.fn>
        tmpdir: ReturnType<typeof vi.fn>
        userInfo: ReturnType<typeof vi.fn>
    }
    url: {
        fileURLToPath: ReturnType<typeof vi.fn>
        pathToFileURL: ReturnType<typeof vi.fn>
        URL: ReturnType<typeof vi.fn>
    }
    stripJsonComments: ReturnType<typeof vi.fn>
    process: {
        argv: string[]
        env: Record<string, string>
        platform: string
        cwd: ReturnType<typeof vi.fn>
        exit: ReturnType<typeof vi.fn>
        on: ReturnType<typeof vi.fn>
        off: ReturnType<typeof vi.fn>
    }
    config: {
        loadAliasConfig: ReturnType<typeof vi.fn>
    }
    shell: {
        detectShell: ReturnType<typeof vi.fn>
    }
}

export function setupPaeTestEnvironment(): PaeTestMocks {
    // Get the mocked modules directly
    const fs = vi.mocked(require('fs'))
    const path = vi.mocked(require('path'))
    const childProcess = vi.mocked(require('child_process'))
    const os = vi.mocked(require('os'))
    const url = vi.mocked(require('url'))
    const stripJsonComments = vi.mocked(require('strip-json-comments'))
    const config = vi.mocked(require('../../src/config.js'))
    const shell = vi.mocked(require('../../src/shell.js'))

    return {
        fs: {
            existsSync: fs.existsSync,
            readFileSync: fs.readFileSync,
            writeFileSync: fs.writeFileSync,
            mkdirSync: fs.mkdirSync,
            copyFileSync: fs.copyFileSync,
            rmSync: fs.rmSync,
            statSync: fs.statSync,
            readdirSync: fs.readdirSync,
            unlinkSync: fs.unlinkSync,
            rmdirSync: fs.rmdirSync,
        },
        path: {
            join: path.join,
            resolve: path.resolve,
            dirname: path.dirname,
            basename: path.basename,
            extname: path.extname,
            relative: path.relative,
            isAbsolute: path.isAbsolute,
            sep: '/',
            delimiter: ':',
        },
        childProcess: {
            spawnSync: childProcess.spawnSync,
            execSync: childProcess.execSync,
            spawn: childProcess.spawn,
            exec: childProcess.exec,
            fork: childProcess.fork,
        },
        os: {
            platform: os.platform,
            homedir: os.homedir,
            tmpdir: os.tmpdir,
            userInfo: os.userInfo,
        },
        url: {
            fileURLToPath: url.fileURLToPath,
            pathToFileURL: url.pathToFileURL,
            URL: url.URL,
        },
        stripJsonComments: stripJsonComments.default,
        process: {
            argv: ['node', 'script.js'],
            env: {},
            platform: 'win32',
            cwd: vi.fn(),
            exit: vi.fn(),
            on: vi.fn(),
            off: vi.fn(),
        },
        config: {
            loadAliasConfig: config.loadAliasConfig,
        },
        shell: {
            detectShell: shell.detectShell,
        },
    }
}

export function resetPaeMocks(mocks: PaeTestMocks): void {
    // Reset all mock functions
    Object.values(mocks.fs).forEach(mock => {
        if (typeof mock === 'function' && 'mockReset' in mock) {
            mock.mockReset()
        }
    })
    Object.values(mocks.path).forEach(mock => {
        if (typeof mock === 'function' && 'mockReset' in mock) {
            mock.mockReset()
        }
    })
    Object.values(mocks.childProcess).forEach(mock => {
        if (typeof mock === 'function' && 'mockReset' in mock) {
            mock.mockReset()
        }
    })
    Object.values(mocks.os).forEach(mock => {
        if (typeof mock === 'function' && 'mockReset' in mock) {
            mock.mockReset()
        }
    })
    Object.values(mocks.url).forEach(mock => {
        if (typeof mock === 'function' && 'mockReset' in mock) {
            mock.mockReset()
        }
    })
    mocks.stripJsonComments.mockReset()
    Object.values(mocks.process).forEach(mock => {
        if (typeof mock === 'function' && 'mockReset' in mock) {
            mock.mockReset()
        }
    })
    Object.values(mocks.config).forEach(mock => {
        if (typeof mock === 'function' && 'mockReset' in mock) {
            mock.mockReset()
        }
    })
    Object.values(mocks.shell).forEach(mock => {
        if (typeof mock === 'function' && 'mockReset' in mock) {
            mock.mockReset()
        }
    })
}

export function setupPaeFileSystemMocks(mocks: PaeTestMocks): void {
    // Setup default file system behavior
    mocks.fs.existsSync.mockReturnValue(false)
    mocks.fs.readFileSync.mockReturnValue('{}')
    mocks.fs.writeFileSync.mockImplementation(() => {})
    mocks.fs.mkdirSync.mockImplementation(() => {})
    mocks.fs.copyFileSync.mockImplementation(() => {})
    mocks.fs.rmSync.mockImplementation(() => {})
    mocks.fs.statSync.mockReturnValue({ isFile: () => true, isDirectory: () => false })
    mocks.fs.readdirSync.mockReturnValue([])
    mocks.fs.unlinkSync.mockImplementation(() => {})
    mocks.fs.rmdirSync.mockImplementation(() => {})
}

export function setupPaePathMocks(mocks: PaeTestMocks): void {
    // Setup default path behavior
    mocks.path.join.mockImplementation((...args: string[]) => args.join('/'))
    mocks.path.resolve.mockImplementation((...args: string[]) => '/' + args.join('/'))
    mocks.path.dirname.mockImplementation((path: string) => path.split('/').slice(0, -1).join('/') || '.')
    mocks.path.basename.mockImplementation((path: string) => path.split('/').pop() || '')
    mocks.path.extname.mockImplementation((path: string) => {
        const parts = path.split('.')
        return parts.length > 1 ? '.' + parts.pop() : ''
    })
    mocks.path.relative.mockImplementation((from: string, to: string) => to)
    mocks.path.isAbsolute.mockImplementation((path: string) => path.startsWith('/'))
}

export function setupPaeProcessMocks(mocks: PaeTestMocks): void {
    // Setup default process behavior
    mocks.process.cwd.mockReturnValue('/test')
    mocks.process.exit.mockImplementation(() => {})
    mocks.process.on.mockImplementation(() => {})
    mocks.process.off.mockImplementation(() => {})
}

export function setupPaeChildProcessMocks(mocks: PaeTestMocks): void {
    // Setup default child process behavior
    mocks.childProcess.spawnSync.mockReturnValue({
        status: 0,
        signal: null,
        output: [''],
        pid: 123,
        stdout: Buffer.from(''),
        stderr: Buffer.from(''),
        error: undefined
    })
    mocks.childProcess.execSync.mockReturnValue(Buffer.from('success'))
    mocks.childProcess.spawn.mockImplementation(() => ({ pid: 123, kill: vi.fn() }))
    mocks.childProcess.exec.mockImplementation(() => ({ pid: 123, kill: vi.fn() }))
    mocks.childProcess.fork.mockImplementation(() => ({ pid: 123, kill: vi.fn() }))
}

export function setupPaeUrlMocks(mocks: PaeTestMocks): void {
    // Setup default URL behavior
    mocks.url.fileURLToPath.mockImplementation((url: string) => url.replace('file://', ''))
    mocks.url.pathToFileURL.mockImplementation((path: string) => `file://${path}`)
    mocks.url.URL.mockImplementation((url: string) => ({ href: url }))
}

export function setupPaeStripJsonCommentsMocks(mocks: PaeTestMocks): void {
    // Setup default strip-json-comments behavior
    mocks.stripJsonComments.mockImplementation((content: string) => {
        try {
            return JSON.parse(content)
        } catch {
            return {}
        }
    })
}

export function setupPaeOsMocks(mocks: PaeTestMocks): void {
    // Setup default OS behavior
    mocks.os.platform.mockReturnValue('win32')
    mocks.os.homedir.mockReturnValue('/home/user')
    mocks.os.tmpdir.mockReturnValue('/tmp')
    mocks.os.userInfo.mockReturnValue({ username: 'user' })
}