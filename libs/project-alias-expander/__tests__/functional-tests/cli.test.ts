import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setupPaeTestEnvironment, resetPaeMocks } from '../__mocks__/helpers'
import { createPaeMockBuilder } from '../__mocks__/mock-scenario-builder'
import { //> from '../../src/cli'
    loadAliasConfig,
    resolveProjectForAlias,
    expandTargetShortcuts,
    expandTemplate,
    parseExpandableFlag,
    expandFlags,
    normalizeFullSemantics,
} from '../../src/cli' //<

describe('CLI', () => {
    let mocks: Awaited<ReturnType<typeof setupPaeTestEnvironment>>

    beforeEach(async () => { //>
        mocks = await setupPaeTestEnvironment()
        await resetPaeMocks(mocks)
    }) //<

    describe('loadAliasConfig', () => {
        it('should load and parse config successfully', async () => { //>
            // Arrange
            const configContent = JSON.stringify({
                packages: {
                    pbc: { name: 'project-butler', suffix: 'core' },
                    pbe: { name: 'project-butler', suffix: 'ext' }
                },
                'package-targets': {
                    b: 'build',
                    t: 'test'
                }
            })

            const builder = await createPaeMockBuilder(mocks)
            const configuredBuilder = await builder
                .configExists({
                    configPath: '/config.json',
                    configContent
                })
            configuredBuilder.build()

            // Act
            const config = loadAliasConfig()

            // Assert
            expect(config.packages).toBeDefined()
            expect(config.packages.pbc).toEqual({ name: 'project-butler', suffix: 'core' })
            expect(config['package-targets']).toEqual({ b: 'build', t: 'test' })
        }) //<
        it('should handle config file not found', async () => { //>
            // Arrange
            const builder = await createPaeMockBuilder(mocks)
            const configuredBuilder = await builder
                .configNotExists({
                    configPath: '/config.json',
                    configContent: ''
                })
            configuredBuilder.build()

            // Act & Assert
            expect(() => loadAliasConfig()).toThrow()
        })

        it('should handle invalid JSON in config', async () => {
            // Arrange
            const invalidJson = '{ invalid json }'
            const builder = await createPaeMockBuilder(mocks)
            const configuredBuilder = await builder
                .configExists({
                    configPath: '/config.json',
                    configContent: invalidJson
                })
            configuredBuilder.build()

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

    describe('expandTargetShortcuts', () => {
        it('should expand target shortcuts', () => { //>
            // Arrange
            const args = ['b', '--coverage']
            const targets = { b: 'build', t: 'test' }

            // Act
            const result = expandTargetShortcuts(args, targets)

            // Assert
            expect(result.args).toEqual(['build', '--coverage'])
            expect(result.wasFeatureTarget).toBe(false)
        }) //<
        it('should handle feature targets for full packages', () => { //>
            // Arrange
            const args = ['b', '--coverage']
            const targets = { b: 'build' }
            const featureTargets = { b: { 'run-from': 'ext' as const, 'run-target': 'build' } }

            // Act
            const result = expandTargetShortcuts(args, targets, featureTargets, true)

            // Assert
            expect(result.args).toEqual(['build', '--coverage'])
            expect(result.wasFeatureTarget).toBe(true)
        }) //<
        it('should return original args when no shortcut found', () => { //>
            // Arrange
            const args = ['unknown', '--coverage']
            const targets = { b: 'build' }

            // Act
            const result = expandTargetShortcuts(args, targets)

            // Assert
            expect(result.args).toEqual(['unknown', '--coverage'])
            expect(result.wasFeatureTarget).toBe(false)
        }) //<
        it('should handle empty args', () => { //>
            // Arrange
            const args: string[] = []
            const targets = { b: 'build' }

            // Act
            const result = expandTargetShortcuts(args, targets)

            // Assert
            expect(result.args).toEqual([])
            expect(result.wasFeatureTarget).toBe(false)
        }) //<
    })

    describe('expandTemplate', () => {
        it('should expand template with variables', () => { //>
            // Arrange
            const template = 'timeout {duration}s {command}'
            const variables = { duration: '10', command: 'nx test' }

            // Act
            const result = expandTemplate(template, variables)

            // Assert
            expect(result).toBe('timeout 10s nx test')
        }) //<
        it('should handle missing variables', () => { //>
            // Arrange
            const template = 'timeout {duration}s {command}'
            const variables = { duration: '10' }

            // Act
            const result = expandTemplate(template, variables)

            // Assert
            expect(result).toBe('timeout 10s {command}')
        }) //<
        it('should handle empty template', () => { //>
            // Arrange
            const template = ''
            const variables = { duration: '10' }

            // Act
            const result = expandTemplate(template, variables)

            // Assert
            expect(result).toBe('')
        }) //<
    })

    describe('parseExpandableFlag', () => {
        it('should parse equal syntax flag', () => { //>
            // Arrange
            const flag = '-sto=5'

            // Act
            const result = parseExpandableFlag(flag)

            // Assert
            expect(result.key).toBe('sto')
            expect(result.value).toBe('5')
        }) //<
        it('should parse colon syntax flag', () => { //>
            // Arrange
            const flag = '-mem:2048'

            // Act
            const result = parseExpandableFlag(flag)

            // Assert
            expect(result.key).toBe('mem')
            expect(result.value).toBe('2048')
        }) //<
        it('should parse flag without value', () => { //>
            // Arrange
            const flag = '-f'

            // Act
            const result = parseExpandableFlag(flag)

            // Assert
            expect(result.key).toBe('f')
            expect(result.value).toBeUndefined()
        }) //<
        it('should handle invalid flag format', () => { //>
            // Arrange
            const flag = 'invalid'

            // Act
            const result = parseExpandableFlag(flag)

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
            const result = expandFlags(args, expandables)

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
            const result = expandFlags(args, expandables)

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
            const result = expandFlags(args, expandables)

            // Assert
            expect(result.prefix).toEqual(['timeout 5s'])
            expect(result.remainingArgs).toEqual(['test'])
        }) //<
        it('should handle short bundle flags', () => { //>
            // Arrange
            const args = ['-fs', 'test']
            const expandables = { f: '--fix', s: '--skip-nx-cache' }

            // Act
            const result = expandFlags(args, expandables)

            // Assert
            expect(result.suffix).toEqual(['--fix', '--skip-nx-cache'])
            expect(result.remainingArgs).toEqual(['test'])
        }) //<
        it('should preserve double-dash flags', () => { //>
            // Arrange
            const args = ['--coverage', 'test']
            const expandables = { f: '--fix' }

            // Act
            const result = expandFlags(args, expandables)

            // Assert
            expect(result.remainingArgs).toEqual(['--coverage', 'test'])
        }) //<
    })

    describe('normalizeFullSemantics', () => {
        it('should normalize targets for full packages', () => { //>
            // Act & Assert
            expect(normalizeFullSemantics(true, 'l')).toBe('lint:deps')
            expect(normalizeFullSemantics(true, 'lint')).toBe('lint:deps')
            expect(normalizeFullSemantics(true, 'test')).toBe('test:full')
            expect(normalizeFullSemantics(true, 'validate')).toBe('validate:deps')
        }) //<
        it('should return original target for non-full packages', () => { //>
            // Act & Assert
            expect(normalizeFullSemantics(false, 'l')).toBe('l')
            expect(normalizeFullSemantics(false, 'lint')).toBe('lint')
            expect(normalizeFullSemantics(false, 'test')).toBe('test')
            expect(normalizeFullSemantics(false, 'unknown')).toBe('unknown')
        }) //<
    })
})



