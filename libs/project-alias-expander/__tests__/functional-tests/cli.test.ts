import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPaeMockBuilder } from '../__mocks__/mock-scenario-builder'
import { loadAliasConfig, resolveProjectForAlias } from '../../src/config.js'

// Mock the strip-json-comments module
vi.mock('strip-json-comments', () => ({
    default: vi.fn(),
}))

// Mock the fs module to use our custom mocks
vi.mock('fs', () => ({
    default: {
        existsSync: vi.fn(),
        readFileSync: vi.fn(),
        writeFileSync: vi.fn(),
        mkdirSync: vi.fn(),
    },
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
    writeFileSync: vi.fn(),
    mkdirSync: vi.fn(),
}))

vi.mock('node:fs', () => ({
    default: {
        existsSync: vi.fn(),
        readFileSync: vi.fn(),
        writeFileSync: vi.fn(),
        mkdirSync: vi.fn(),
    },
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
    writeFileSync: vi.fn(),
    mkdirSync: vi.fn(),
}))

// Mock the CLI module to prevent actual command execution
vi.mock('../../src/cli', async () => {
    const actual = await vi.importActual('../../src/cli')
    return {
        ...actual,
        runNx: vi.fn(),
        runMany: vi.fn(),
        installAliases: vi.fn()
    }
})

import { //> from '../../src/cli'
    loadAliasConfig,
    resolveProjectForAlias,
    paeManager,
} from '../../src/cli' //<

describe('CLI', () => {

    beforeEach(() => {
        vi.clearAllMocks()
    }) //<

    describe('loadAliasConfig', () => {
        it('should load and parse config successfully', async () => { //>
            // Arrange - Use standard mocks for simple setup
            mocks.fs.existsSync.mockReturnValue(true)
            mocks.fs.readFileSync.mockReturnValue(JSON.stringify({
                'nxPackages': {
                    pbc: { name: 'project-butler', suffix: 'core' },
                    pbe: { name: 'project-butler', suffix: 'ext' }
                },
                'nxTargets': {
                    "a": "audit",
                    "aa": "audit:all",
                    "ac": "audit:code",
                    "at": "audit:test",
                    "b": "build",
                    "c": "clean",
                    "cc": "clean:cache",
                    "cd": "clean:dist",
                    "ct": "check-types",
                    "ctd": "check-types:deps",
                    "l": "lint",
                    "lf": "lint:deps",
                    "m": "monitor",
                    "o": "optimize",
                    "p": "package",
                    "pd": "package:dev",
                    "pub": "publish",
                    "s": "status",
                    "t": "test",
                    "tc": "test:coverage-tests",
                    "td": "test:deps",
                    "tdc": "test:deps:coverage-tests",
                    "ti": "test:integration",
                    "v": "validate",
                    "vf": "validate:deps"
                }
            }))
            mocks.stripJsonComments.mockImplementation((content) => content)

            // Act
            const config = loadAliasConfig()

            // Assert
            expect(config['nxPackages']).toBeDefined()
            expect(config['nxPackages'].pbc).toEqual({ name: 'project-butler', suffix: 'core' })
            expect(config['nxTargets']).toEqual({
                "a": "audit",
                "aa": "audit:all",
                "ac": "audit:code",
                "at": "audit:test",
                "b": "build",
                "c": "clean",
                "cc": "clean:cache",
                "cd": "clean:dist",
                "ct": "check-types",
                "ctd": "check-types:deps",
                "l": "lint",
                "lf": "lint:deps",
                "m": "monitor",
                "o": "optimize",
                "p": "package",
                "pd": "package:dev",
                "pub": "publish",
                "s": "status",
                "t": "test",
                "tc": "test:coverage-tests",
                "td": "test:deps",
                "tdc": "test:deps:coverage-tests",
                "ti": "test:integration",
                "v": "validate",
                "vf": "validate:deps"
            })
        }) //<
        it('should handle config file not found', async () => { //>
            // Arrange - Use standard mocks for simple setup
            mocks.fs.existsSync.mockReturnValue(false)

            // Act & Assert
            expect(() => loadAliasConfig()).toThrow('Config file not found')
        })

        it('should handle invalid JSON in config', async () => {
            // Arrange - Use standard mocks for simple setup
            mocks.fs.existsSync.mockReturnValue(true)
            mocks.fs.readFileSync.mockReturnValue('{ invalid json }')
            mocks.stripJsonComments.mockImplementation(() => {
                throw new Error('Invalid JSON')
            })

            // Act & Assert
            expect(() => loadAliasConfig()).toThrow()
        }) //<
    })

    describe('resolveProjectForAlias', () => {
        it('should resolve string alias to project name', () => { //>
            // Arrange
            const aliasValue = '@fux/project-butler'

            // Act
            const result = resolveProjectForAlias(aliasValue)

            // Assert
            expect(result.project).toBe('@fux/project-butler')
            expect(result.full).toBe(false)
        }) //<
        it('should resolve object alias with suffix', () => { //>
            // Arrange
            const aliasValue = { name: 'project-butler', suffix: 'core' as const }

            // Act
            const result = resolveProjectForAlias(aliasValue)

            // Assert
            expect(result.project).toBe('@fux/project-butler-core')
            expect(result.full).toBe(false)
        }) //<
        it('should resolve object alias with full flag', () => { //> //>
            // Arrange
            const aliasValue = { name: 'project-butler', suffix: 'ext' as const, full: true }

            // Act
            const result = resolveProjectForAlias(aliasValue)

            // Assert
            expect(result.project).toBe('@fux/project-butler-ext')
            expect(result.full).toBe(true)
        }) //<
        it('should add @fux/ prefix for string aliases without it', () => { //>
            // Arrange
            const aliasValue = 'project-butler'

            // Act
            const result = resolveProjectForAlias(aliasValue)

            // Assert
            expect(result.project).toBe('@fux/project-butler')
            expect(result.full).toBe(false)
        }) //<
    })

    // Legacy expandTargetShortcuts tests removed - functionality now handled by paeManager.expandFlags

    describe('expandTemplate', () => {
        it('should expand template with variables', () => { //>
            // Arrange
            const template = 'timeout {duration}s {command}'
            const variables = { duration: '10', command: 'nx test' }

            // Act
            const result = paeManager.expandTemplate(template, variables)

            // Assert
            expect(result).toBe('timeout 10s nx test')
        }) //<
        it('should handle missing variables', () => { //>
            // Arrange
            const template = 'timeout {duration}s {command}'
            const variables = { duration: '10' }

            // Act
            const result = paeManager.expandTemplate(template, variables)

            // Assert
            expect(result).toBe('timeout 10s {command}')
        }) //<
        it('should handle empty template', () => { //>
            // Arrange
            const template = ''
            const variables = { duration: '10' }

            // Act
            const result = paeManager.expandTemplate(template, variables)

            // Assert
            expect(result).toBe('')
        }) //<
    })

    describe('parseExpandableFlag', () => {
        it('should parse equal syntax flag', () => { //>
            // Arrange
            const flag = '-sto=5'

            // Act
            const result = paeManager.parseExpandableFlag(flag)

            // Assert
            expect(result.key).toBe('sto')
            expect(result.value).toBe('5')
        }) //<
        it('should parse colon syntax flag', () => { //>
            // Arrange
            const flag = '-mem:2048'

            // Act
            const result = paeManager.parseExpandableFlag(flag)

            // Assert
            expect(result.key).toBe('mem')
            expect(result.value).toBe('2048')
        }) //<
        it('should parse flag without value', () => { //>
            // Arrange
            const flag = '-f'

            // Act
            const result = paeManager.parseExpandableFlag(flag)

            // Assert
            expect(result.key).toBe('f')
            expect(result.value).toBeUndefined()
        }) //<
        it('should handle invalid flag format', () => { //>
            // Arrange
            const flag = '-invalid'

            // Act
            const result = paeManager.parseExpandableFlag(flag)

            // Assert
            expect(result.key).toBe('invalid')
            expect(result.value).toBeUndefined()
        }) //<
    })

    describe('expandFlags', () => {
        it('should expand simple string flags', () => { //>
            // Arrange
            const args = ['-f', '-s', 'test']
            const expandables = { f: '--fix', s: '--skip-nx-cache' }

            // Act
            const result = paeManager.expandFlags(args, expandables)

            // Assert
            expect(result.prefix).toEqual([])
            expect(result.preArgs).toEqual([])
            expect(result.suffix).toEqual(['--fix', '--skip-nx-cache'])
            expect(result.remainingArgs).toEqual(['test'])
        }) //<
        it('should expand template flags with defaults', () => { //>
            // Arrange
            const args = ['-sto', 'test']
            const expandables = {
                sto: {
                    position: 'prefix' as const,
                    defaults: { duration: '10' },
                    template: 'timeout {duration}s'
                }
            }

            // Act
            const result = paeManager.expandFlags(args, expandables)

            // Assert
            expect(result.prefix).toEqual(['timeout 10s'])
            expect(result.remainingArgs).toEqual(['test'])
        }) //<
        it('should expand template flags with custom values', () => { //>
            // Arrange
            const args = ['-sto=5', 'test']
            const expandables = {
                sto: {
                    position: 'prefix' as const,
                    defaults: { duration: '10' },
                    template: 'timeout {duration}s'
                }
            }

            // Act
            const result = paeManager.expandFlags(args, expandables)

            // Assert
            expect(result.prefix).toEqual(['timeout 5s'])
            expect(result.remainingArgs).toEqual(['test'])
        }) //<
        it('should handle short bundle flags', () => { //>
            // Arrange
            const args = ['-fs', 'test']
            const expandables = { f: '--fix', s: '--skip-nx-cache' }

            // Act
            const result = paeManager.expandFlags(args, expandables)

            // Assert
            expect(result.suffix).toEqual(['--fix', '--skip-nx-cache'])
            expect(result.remainingArgs).toEqual(['test'])
        }) //<
        it('should preserve double-dash flags', () => { //>
            // Arrange
            const args = ['--coverage', 'test']
            const expandables = { f: '--fix' }

            // Act
            const result = paeManager.expandFlags(args, expandables)

            // Assert
            expect(result.remainingArgs).toEqual(['--coverage', 'test'])
        }) //<
    })

    // Legacy normalizeFullSemantics tests removed - functionality now handled by CLI logic
})



