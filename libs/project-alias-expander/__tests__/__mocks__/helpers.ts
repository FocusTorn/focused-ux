import { vi } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'
import * as childProcess from 'child_process'
import * as os from 'os'
import * as url from 'url'
import stripJsonComments from 'strip-json-comments'
import * as config from '../../src/config.js'
import * as shell from '../../src/shell.js'

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
    }
    os: {
        platform: ReturnType<typeof vi.fn>
        arch: ReturnType<typeof vi.fn>
        homedir: ReturnType<typeof vi.fn>
        tmpdir: ReturnType<typeof vi.fn>
        cpus: ReturnType<typeof vi.fn>
        freemem: ReturnType<typeof vi.fn>
        totalmem: ReturnType<typeof vi.fn>
        uptime: ReturnType<typeof vi.fn>
        userInfo: ReturnType<typeof vi.fn>
        type: ReturnType<typeof vi.fn>
        release: ReturnType<typeof vi.fn>
        networkInterfaces: ReturnType<typeof vi.fn>
        hostname: ReturnType<typeof vi.fn>
        loadavg: ReturnType<typeof vi.fn>
        endianness: ReturnType<typeof vi.fn>
        EOL: string
    }
    url: {
        parse: ReturnType<typeof vi.fn>
        format: ReturnType<typeof vi.fn>
        resolve: ReturnType<typeof vi.fn>
        URL: ReturnType<typeof vi.fn>
        URLSearchParams: ReturnType<typeof vi.fn>
        domainToASCII: ReturnType<typeof vi.fn>
        domainToUnicode: ReturnType<typeof vi.fn>
        fileURLToPath: ReturnType<typeof vi.fn>
        pathToFileURL: ReturnType<typeof vi.fn>
    }
    stripJsonComments: ReturnType<typeof vi.fn>
    config: {
        loadAliasConfig: ReturnType<typeof vi.fn>
    }
    shell: {
        detectShell: ReturnType<typeof vi.fn>
    }
}

export function setupPaeTestEnvironment(): PaeTestMocks {
    // Get the mocked modules directly
    const mockedFs = vi.mocked(fs)
    const mockedPath = vi.mocked(path)
    const mockedChildProcess = vi.mocked(childProcess)
    const mockedOs = vi.mocked(os)
    const mockedUrl = vi.mocked(url)
    const mockedStripJsonComments = vi.mocked(stripJsonComments)
    const mockedConfig = vi.mocked(config)
    const mockedShell = vi.mocked(shell)

    return {
        fs: {
            existsSync: mockedFs.existsSync,
            readFileSync: mockedFs.readFileSync,
            writeFileSync: mockedFs.writeFileSync,
            mkdirSync: mockedFs.mkdirSync,
            copyFileSync: mockedFs.copyFileSync,
            rmSync: mockedFs.rmSync,
            statSync: mockedFs.statSync,
            readdirSync: mockedFs.readdirSync,
            unlinkSync: mockedFs.unlinkSync,
            rmdirSync: mockedFs.rmdirSync,
        },
        path: {
            join: mockedPath.join,
            resolve: mockedPath.resolve,
            dirname: mockedPath.dirname,
            basename: mockedPath.basename,
            extname: mockedPath.extname,
            relative: mockedPath.relative,
            isAbsolute: mockedPath.isAbsolute,
            sep: '/',
            delimiter: ':',
        },
        childProcess: {
            spawnSync: mockedChildProcess.spawnSync,
            execSync: mockedChildProcess.execSync,
            spawn: mockedChildProcess.spawn,
            exec: mockedChildProcess.exec,
        },
        os: {
            platform: mockedOs.platform,
            arch: mockedOs.arch,
            homedir: mockedOs.homedir,
            tmpdir: mockedOs.tmpdir,
            cpus: mockedOs.cpus,
            freemem: mockedOs.freemem,
            totalmem: mockedOs.totalmem,
            uptime: mockedOs.uptime,
            userInfo: mockedOs.userInfo,
            type: mockedOs.type,
            release: mockedOs.release,
            networkInterfaces: mockedOs.networkInterfaces,
            hostname: mockedOs.hostname,
            loadavg: mockedOs.loadavg,
            endianness: mockedOs.endianness,
            EOL: '\n',
        },
        url: {
            parse: mockedUrl.parse,
            format: mockedUrl.format,
            resolve: mockedUrl.resolve,
            URL: mockedUrl.URL as any,
            URLSearchParams: mockedUrl.URLSearchParams as any,
            domainToASCII: mockedUrl.domainToASCII,
            domainToUnicode: mockedUrl.domainToUnicode,
            fileURLToPath: mockedUrl.fileURLToPath,
            pathToFileURL: mockedUrl.pathToFileURL,
        },
        stripJsonComments: mockedStripJsonComments,
        config: {
            loadAliasConfig: mockedConfig.loadAliasConfig,
        },
        shell: {
            detectShell: mockedShell.detectShell,
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
    
    if ('mockReset' in mocks.stripJsonComments) {
        mocks.stripJsonComments.mockReset()
    }
    
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