import { vi } from 'vitest'

export interface CCPTestMocks {
    fileSystem: {
        readFile: ReturnType<typeof vi.fn>
        writeFile: ReturnType<typeof vi.fn>
        stat: ReturnType<typeof vi.fn>
        copyFile: ReturnType<typeof vi.fn>
        access: ReturnType<typeof vi.fn>
        readdir: ReturnType<typeof vi.fn>
        readDirectory: ReturnType<typeof vi.fn>
        mkdir: ReturnType<typeof vi.fn>
        createDirectory: ReturnType<typeof vi.fn>
        rmdir: ReturnType<typeof vi.fn>
        unlink: ReturnType<typeof vi.fn>
    }
    path: {
        dirname: ReturnType<typeof vi.fn>
        basename: ReturnType<typeof vi.fn>
        join: ReturnType<typeof vi.fn>
        resolve: ReturnType<typeof vi.fn>
        extname: ReturnType<typeof vi.fn>
    }
    yaml: {
        load: ReturnType<typeof vi.fn>
        dump: ReturnType<typeof vi.fn>
    }
    tokenizer: {
        encode: ReturnType<typeof vi.fn>
        decode: ReturnType<typeof vi.fn>
    }
    micromatch: {
        isMatch: ReturnType<typeof vi.fn>
        match: ReturnType<typeof vi.fn>
    }
}

export function setupTestEnvironment(): CCPTestMocks {
    return {
        fileSystem: {
            readFile: vi.fn(),
            writeFile: vi.fn(),
            stat: vi.fn(),
            copyFile: vi.fn(),
            access: vi.fn(),
            readdir: vi.fn(),
            readDirectory: vi.fn(),
            mkdir: vi.fn(),
            createDirectory: vi.fn(),
            rmdir: vi.fn(),
            unlink: vi.fn(),
        },
        path: {
            dirname: vi.fn(),
            basename: vi.fn(),
            join: vi.fn(),
            resolve: vi.fn(),
            extname: vi.fn(),
            relative: vi.fn(),
        },
        yaml: {
            load: vi.fn(),
            dump: vi.fn(),
        },
        tokenizer: {
            encode: vi.fn(),
            decode: vi.fn(),
            calculateTokens: vi.fn(),
        },
        micromatch: {
            isMatch: vi.fn(),
            match: vi.fn(),
        },
    }
}

export function setupFileSystemMocks(mocks: CCPTestMocks): void {
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

export function setupPathMocks(mocks: CCPTestMocks): void {
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
    mocks.path.relative.mockImplementation((from: string, to: string) => {
        // Simple relative path calculation for testing
        if (to.startsWith(from)) {
            return to.substring(from.length + 1)
        }
        return to
    })
}

export function setupYamlMocks(mocks: CCPTestMocks): void {
    mocks.yaml.load.mockReturnValue({
        ContextCherryPicker: {
            'projectTreeDisplay': {
                'alwaysShowGlobs': ['*.md', '*.json'],
                'alwaysHideGlobs': ['node_modules/**', '.git/**'],
                'showIfSelectedGlobs': ['*.test.ts', '*.spec.ts'],
            },
        },
    })
}

export function setupTokenizerMocks(mocks: CCPTestMocks): void {
    mocks.tokenizer.encode.mockImplementation((text: string) => {
        // Simple mock: return array of numbers based on text length
        return Array.from({ length: Math.ceil(text.length / 4) }, (_, i) => i + 1)
    })
    mocks.tokenizer.decode.mockReturnValue('mock decoded text')
    mocks.tokenizer.calculateTokens.mockImplementation((text: string) => {
        // Simple mock: return token count based on text length
        return Math.ceil(text.length / 4)
    })
}

export function setupMicromatchMocks(mocks: CCPTestMocks): void {
    mocks.micromatch.isMatch.mockImplementation((file: string, patterns: string | string[]) => {
        // Simple mock: return true for common file patterns
        const commonPatterns = ['*.md', '*.json', '*.ts', '*.js']
        return commonPatterns.some(pattern => file.includes(pattern.replace('*', '')))
    })
    mocks.micromatch.match.mockImplementation((files: string[], patterns: string | string[]) => {
        // Simple mock: return files that match patterns
        return files.filter(file => 
            Array.isArray(patterns) 
                ? patterns.some(pattern => file.includes(pattern.replace('*', '')))
                : file.includes(patterns.replace('*', ''))
        )
    })
}

// Mock reset utilities
export function resetAllMocks(mocks: CCPTestMocks): void {
    Object.values(mocks.fileSystem).forEach((mock) => mock.mockReset())
    Object.values(mocks.path).forEach((mock) => mock.mockReset())
    Object.values(mocks.yaml).forEach((mock) => mock.mockReset())
    Object.values(mocks.tokenizer).forEach((mock) => mock.mockReset())
    Object.values(mocks.micromatch).forEach((mock) => mock.mockReset())
}
