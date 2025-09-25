import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
    CoreTestMocks,
    setupCoreTestEnvironment,
    setupFileSystemMocks,
    setupPathMocks,
    resetCoreMocks,
    setupFileReadScenario,
    setupFileWriteScenario,
    setupFileCopyScenario,
    setupFileDeleteScenario,
    setupFileSystemErrorScenario,
    setupWindowsPathScenario,
    setupUnixPathScenario,
    CoreMockBuilder,
    createCoreMockBuilder,
} from '../../src/core/index.js'

describe('Core Package Mock Strategy', () => {
    let mocks: CoreTestMocks

    beforeEach(() => {
        mocks = setupCoreTestEnvironment()
    })

    describe('setupCoreTestEnvironment', () => {
        it('should create all required mock functions', () => {
            expect(mocks.fileSystem.readFile).toBeDefined()
            expect(mocks.fileSystem.writeFile).toBeDefined()
            expect(mocks.fileSystem.stat).toBeDefined()
            expect(mocks.fileSystem.copyFile).toBeDefined()
            expect(mocks.fileSystem.access).toBeDefined()
            expect(mocks.fileSystem.readdir).toBeDefined()
            expect(mocks.fileSystem.mkdir).toBeDefined()
            expect(mocks.fileSystem.rmdir).toBeDefined()
            expect(mocks.fileSystem.unlink).toBeDefined()

            expect(mocks.path.dirname).toBeDefined()
            expect(mocks.path.basename).toBeDefined()
            expect(mocks.path.join).toBeDefined()
            expect(mocks.path.resolve).toBeDefined()
            expect(mocks.path.extname).toBeDefined()
        })

        it('should create vi.fn() instances', () => {
            expect(vi.isMockFunction(mocks.fileSystem.readFile)).toBe(true)
            expect(vi.isMockFunction(mocks.fileSystem.writeFile)).toBe(true)
            expect(vi.isMockFunction(mocks.path.join)).toBe(true)
        })
    })

    describe('setupFileSystemMocks', () => {
        beforeEach(() => {
            setupFileSystemMocks(mocks)
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

    describe('setupPathMocks', () => {
        beforeEach(() => {
            setupPathMocks(mocks)
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

    describe('resetCoreMocks', () => {
        beforeEach(() => {
            setupFileSystemMocks(mocks)
            setupPathMocks(mocks)
        })

        it('should reset all mock functions', () => {
            // Call some mocks first
            mocks.fileSystem.readFile('test.txt')
            mocks.path.join('a', 'b')

            // Reset mocks
            resetCoreMocks(mocks)

            // Verify mocks were reset
            expect(mocks.fileSystem.readFile).toHaveBeenCalledTimes(0)
            expect(mocks.path.join).toHaveBeenCalledTimes(0)
        })
    })

    describe('File System Scenarios', () => {
        describe('setupFileReadScenario', () => {
            it('should set up file read scenario', async () => {
                setupFileReadScenario(mocks, {
                    sourcePath: '/test/file.txt',
                    content: 'custom content'
                })

                const content = await mocks.fileSystem.readFile('/test/file.txt')
                expect(content).toBe('custom content')

                const stat = await mocks.fileSystem.stat('/test/file.txt')
                expect(stat).toEqual({ type: 'file' })
            })

            it('should use default content when not provided', async () => {
                setupFileReadScenario(mocks, {
                    sourcePath: '/test/file.txt'
                })

                const content = await mocks.fileSystem.readFile('/test/file.txt')
                expect(content).toBe('file content')
            })
        })

        describe('setupFileWriteScenario', () => {
            it('should set up file write scenario', async () => {
                setupFileWriteScenario(mocks, {
                    targetPath: '/test/output.txt'
                })

                await expect(mocks.fileSystem.writeFile('/test/output.txt', 'content')).resolves.toBeUndefined()

                const stat = await mocks.fileSystem.stat('/test/output.txt')
                expect(stat).toEqual({ type: 'file' })
            })
        })

        describe('setupFileCopyScenario', () => {
            it('should set up file copy scenario', async () => {
                setupFileCopyScenario(mocks, {
                    sourcePath: '/test/source.txt',
                    targetPath: '/test/target.txt'
                })

                await expect(mocks.fileSystem.copyFile('/test/source.txt', '/test/target.txt')).resolves.toBeUndefined()

                const stat = await mocks.fileSystem.stat('/test/target.txt')
                expect(stat).toEqual({ type: 'file' })
            })
        })

        describe('setupFileDeleteScenario', () => {
            it('should set up file delete scenario', async () => {
                setupFileDeleteScenario(mocks, {
                    targetPath: '/test/file.txt'
                })

                await expect(mocks.fileSystem.unlink('/test/file.txt')).resolves.toBeUndefined()
                await expect(mocks.fileSystem.stat('/test/file.txt')).rejects.toThrow('File not found')
            })
        })

        describe('setupFileSystemErrorScenario', () => {
            it('should set up read error scenario', async () => {
                setupFileSystemErrorScenario(mocks, 'read', 'Permission denied', {
                    sourcePath: '/test/file.txt'
                })

                await expect(mocks.fileSystem.readFile('/test/file.txt')).rejects.toThrow('Permission denied')
            })

            it('should set up write error scenario', async () => {
                setupFileSystemErrorScenario(mocks, 'write', 'Disk full', {
                    targetPath: '/test/file.txt'
                })

                await expect(mocks.fileSystem.writeFile('/test/file.txt', 'content')).rejects.toThrow('Disk full')
            })

            it('should set up copy error scenario', async () => {
                setupFileSystemErrorScenario(mocks, 'copy', 'Source not found', {
                    sourcePath: '/test/source.txt',
                    targetPath: '/test/target.txt'
                })

                await expect(mocks.fileSystem.copyFile('/test/source.txt', '/test/target.txt')).rejects.toThrow('Source not found')
            })

            it('should set up delete error scenario', async () => {
                setupFileSystemErrorScenario(mocks, 'delete', 'File in use', {
                    targetPath: '/test/file.txt'
                })

                await expect(mocks.fileSystem.unlink('/test/file.txt')).rejects.toThrow('File in use')
            })

            it('should set up mkdir error scenario', async () => {
                setupFileSystemErrorScenario(mocks, 'mkdir', 'Permission denied', {
                    targetPath: '/test/dir'
                })

                await expect(mocks.fileSystem.mkdir('/test/dir')).rejects.toThrow('Permission denied')
            })
        })
    })

    describe('Path Scenarios', () => {
        describe('setupWindowsPathScenario', () => {
            it('should set up Windows path handling', () => {
                setupWindowsPathScenario(mocks, 'C:\\test\\file.txt', 'C:\\backup\\file.txt')

                expect(mocks.path.join('a', 'b', 'c')).toBe('a\\b\\c')
                expect(mocks.path.dirname('C:\\test\\file.txt')).toBe('C:\\test')
                expect(mocks.path.basename('C:\\test\\file.txt')).toBe('file.txt')
            })
        })

        describe('setupUnixPathScenario', () => {
            it('should set up Unix path handling', () => {
                setupUnixPathScenario(mocks, '/test/file.txt', '/backup/file.txt')

                expect(mocks.path.join('a', 'b', 'c')).toBe('a/b/c')
                expect(mocks.path.dirname('/test/file.txt')).toBe('/test')
                expect(mocks.path.basename('/test/file.txt')).toBe('file.txt')
            })
        })
    })

    describe('CoreMockBuilder', () => {
        let builder: CoreMockBuilder

        beforeEach(() => {
            builder = createCoreMockBuilder(mocks)
        })

        it('should create builder instance', () => {
            expect(builder).toBeInstanceOf(CoreMockBuilder)
        })

        it('should support fluent chaining', () => {
            const result = builder
                .fileRead({ sourcePath: '/test/file.txt', content: 'test' })
                .fileWrite({ targetPath: '/test/output.txt' })
                .build()

            expect(result).toBe(mocks)
        })

        it('should set up file read scenario', async () => {
            builder.fileRead({ sourcePath: '/test/file.txt', content: 'custom content' })

            const content = await mocks.fileSystem.readFile('/test/file.txt')
            expect(content).toBe('custom content')
        })

        it('should set up file write scenario', async () => {
            builder.fileWrite({ targetPath: '/test/output.txt' })

            await expect(mocks.fileSystem.writeFile('/test/output.txt', 'content')).resolves.toBeUndefined()
        })

        it('should set up file copy scenario', async () => {
            builder.fileCopy({ sourcePath: '/test/source.txt', targetPath: '/test/target.txt' })

            await expect(mocks.fileSystem.copyFile('/test/source.txt', '/test/target.txt')).resolves.toBeUndefined()
        })

        it('should set up file delete scenario', async () => {
            builder.fileDelete({ targetPath: '/test/file.txt' })

            await expect(mocks.fileSystem.unlink('/test/file.txt')).resolves.toBeUndefined()
        })

        it('should set up file system error scenario', async () => {
            builder.fileSystemError('read', 'Permission denied', { sourcePath: '/test/file.txt' })

            await expect(mocks.fileSystem.readFile('/test/file.txt')).rejects.toThrow('Permission denied')
        })

        it('should set up Windows path scenario', () => {
            builder.windowsPath('/test/file.txt', '/backup/file.txt')

            expect(mocks.path.join('a', 'b', 'c')).toBe('a\\b\\c')
        })

        it('should set up Unix path scenario', () => {
            builder.unixPath('/test/file.txt', '/backup/file.txt')

            expect(mocks.path.join('a', 'b', 'c')).toBe('a/b/c')
        })

        it('should build and return mocks', () => {
            const result = builder.build()
            expect(result).toBe(mocks)
        })
    })

    describe('createCoreMockBuilder', () => {
        it('should create CoreMockBuilder instance', () => {
            const builder = createCoreMockBuilder(mocks)
            expect(builder).toBeInstanceOf(CoreMockBuilder)
        })
    })
})
