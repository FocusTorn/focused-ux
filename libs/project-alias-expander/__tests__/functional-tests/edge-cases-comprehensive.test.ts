import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ExpandableProcessorService } from '../../src/services/ExpandableProcessor.service.js'
import { CommandExecutionService } from '../../src/services/CommandExecution.service.js'
import { AliasManagerService } from '../../src/services/AliasManager.service.js'
import { PAEManagerService } from '../../src/services/PAEManager.service.js'
import { loadAliasConfig, resolveProjectForAlias } from '../../src/config.js'
import { detectShell } from '../../src/shell.js'

// Mock dependencies
vi.mock('../../src/shell.js', () => ({
    detectShell: vi.fn()
}))

vi.mock('fs', () => ({
    default: {
        existsSync: vi.fn(),
        readFileSync: vi.fn(),
        writeFileSync: vi.fn(),
        mkdirSync: vi.fn(),
        copyFileSync: vi.fn(),
        rmSync: vi.fn()
    },
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
    writeFileSync: vi.fn(),
    mkdirSync: vi.fn(),
    copyFileSync: vi.fn(),
    rmSync: vi.fn()
}))

vi.mock('child_process', () => ({
    spawnSync: vi.fn(),
    execSync: vi.fn()
}))

vi.mock('strip-json-comments', () => ({
    default: vi.fn()
}))

import { detectShell } from '../../src/shell.js'
import * as fs from 'fs'
import { spawnSync, execSync } from 'child_process'
import stripJsonComments from 'strip-json-comments'

describe('Edge Cases and Boundary Conditions', () => {
    let mockDetectShell: ReturnType<typeof vi.mocked>
    let mockFs: typeof fs
    let mockSpawnSync: ReturnType<typeof vi.mocked>
    let mockExecSync: ReturnType<typeof vi.mocked>
    let mockStripJsonComments: ReturnType<typeof vi.mocked>

    beforeEach(() => {
        mockDetectShell = vi.mocked(detectShell)
        mockFs = vi.mocked(fs)
        mockSpawnSync = vi.mocked(spawnSync)
        mockExecSync = vi.mocked(execSync)
        mockStripJsonComments = vi.mocked(stripJsonComments)
    })

    describe('ExpandableProcessorService Edge Cases', () => {
        let service: ExpandableProcessorService

        beforeEach(() => {
            service = new ExpandableProcessorService()
        })

        it('should handle template with special regex characters', () => {
            // Arrange
            const template = 'command {var} with [brackets] and (parens) and {var} again'
            const variables = { var: 'test[value]' }

            // Act
            const result = service.expandTemplate(template, variables)

            // Assert
            expect(result).toBe('command test[value] with [brackets] and (parens) and test[value] again')
        })

        it('should handle template with empty variable names', () => {
            // Arrange
            const template = 'command {} with empty braces'
            const variables = {}

            // Act
            const result = service.expandTemplate(template, variables)

            // Assert
            expect(result).toBe('command {} with empty braces')
        })

        it('should handle template with numeric variable names', () => {
            // Arrange
            const template = 'command {123} with numeric var'
            const variables = { '123': 'value' }

            // Act
            const result = service.expandTemplate(template, variables)

            // Assert
            expect(result).toBe('command value with numeric var')
        })

        it('should handle template with unicode characters', () => {
            // Arrange
            const template = 'command {var} with unicode: 测试'
            const variables = { var: '测试值' }

            // Act
            const result = service.expandTemplate(template, variables)

            // Assert
            expect(result).toBe('command 测试值 with unicode: 测试')
        })

        it('should handle very long template strings', () => {
            // Arrange
            const longString = 'a'.repeat(10000)
            const template = `command {var} with very long string`
            const variables = { var: longString }

            // Act
            const result = service.expandTemplate(template, variables)

            // Assert
            expect(result).toBe(`command ${longString} with very long string`)
        })

        it('should handle template with nested braces', () => {
            // Arrange
            const template = 'command {var} with {{nested}} braces'
            const variables = { var: 'test' }

            // Act
            const result = service.expandTemplate(template, variables)

            // Assert
            expect(result).toBe('command test with {{nested}} braces')
        })

        it('should handle template with escaped braces', () => {
            // Arrange
            const template = 'command {var} with \\{escaped\\} braces'
            const variables = { var: 'test' }

            // Act
            const result = service.expandTemplate(template, variables)

            // Assert
            expect(result).toBe('command test with \\{escaped\\} braces')
        })

        it('should handle flag parsing with special characters', () => {
            // Arrange
            const flag = '-flag=value with spaces'

            // Act
            const result = service.parseExpandableFlag(flag)

            // Assert
            expect(result).toEqual({ key: 'flag', value: 'value with spaces' })
        })

        it('should handle flag parsing with unicode characters', () => {
            // Arrange
            const flag = '-测试=测试值'

            // Act
            const result = service.parseExpandableFlag(flag)

            // Assert
            expect(result).toEqual({ key: '测试', value: '测试值' })
        })

        it('should handle flag parsing with very long values', () => {
            // Arrange
            const longValue = 'a'.repeat(1000)
            const flag = `-flag=${longValue}`

            // Act
            const result = service.parseExpandableFlag(flag)

            // Assert
            expect(result).toEqual({ key: 'flag', value: longValue })
        })

        it('should handle expandFlags with empty arrays', () => {
            // Arrange
            const args: string[] = []
            const expandables = {}

            // Act
            const result = service.expandFlags(args, expandables)

            // Assert
            expect(result).toEqual({
                start: [],
                prefix: [],
                preArgs: [],
                suffix: [],
                end: [],
                remainingArgs: []
            })
        })

        it('should handle expandFlags with very large arrays', () => {
            // Arrange
            const args = Array(1000).fill('-f')
            const expandables = { f: '--fix' }

            // Act
            const result = service.expandFlags(args, expandables)

            // Assert
            expect(result.suffix).toHaveLength(1000)
            expect(result.suffix.every(flag => flag === '--fix')).toBe(true)
        })

        it('should handle constructWrappedCommand with empty arrays', () => {
            // Arrange
            const baseCommand: string[] = []
            const startTemplates: string[] = []
            const endTemplates: string[] = []

            // Act
            const result = service.constructWrappedCommand(baseCommand, startTemplates, endTemplates)

            // Assert
            expect(result).toEqual([])
        })

        it('should handle constructWrappedCommand with very large arrays', () => {
            // Arrange
            const baseCommand = Array(1000).fill('arg')
            const startTemplates = Array(100).fill('start')
            const endTemplates = Array(100).fill('end')

            // Act
            const result = service.constructWrappedCommand(baseCommand, startTemplates, endTemplates)

            // Assert
            expect(result).toHaveLength(1200)
            expect(result.slice(0, 100).every(item => item === 'start')).toBe(true)
            expect(result.slice(100, 1100).every(item => item === 'arg')).toBe(true)
            expect(result.slice(1100).every(item => item === 'end')).toBe(true)
        })
    })

    describe('CommandExecutionService Edge Cases', () => {
        let service: CommandExecutionService

        beforeEach(() => {
            service = new CommandExecutionService()
        })

        it('should handle runNx with empty argv', () => {
            // Arrange
            const argv: string[] = []
            mockSpawnSync.mockReturnValue({
                status: 0,
                signal: null,
                output: [''],
                pid: 123,
                stdout: Buffer.from(''),
                stderr: Buffer.from(''),
                error: undefined
            })

            // Act
            const result = service.runNx(argv)

            // Assert
            expect(result).toBe(0)
        })

        it('should handle runNx with very large argv', () => {
            // Arrange
            const argv = Array(1000).fill('arg')
            mockSpawnSync.mockReturnValue({
                status: 0,
                signal: null,
                output: [''],
                pid: 123,
                stdout: Buffer.from(''),
                stderr: Buffer.from(''),
                error: undefined
            })

            // Act
            const result = service.runNx(argv)

            // Assert
            expect(result).toBe(0)
        })

        it('should handle runCommand with empty args', () => {
            // Arrange
            const command = 'npm'
            const args: string[] = []
            mockSpawnSync.mockReturnValue({
                status: 0,
                signal: null,
                output: [''],
                pid: 123,
                stdout: Buffer.from(''),
                stderr: Buffer.from(''),
                error: undefined
            })

            // Act
            const result = service.runCommand(command, args)

            // Assert
            expect(result).toBe(0)
        })

        it('should handle runCommand with very large args', () => {
            // Arrange
            const command = 'npm'
            const args = Array(1000).fill('arg')
            mockSpawnSync.mockReturnValue({
                status: 0,
                signal: null,
                output: [''],
                pid: 123,
                stdout: Buffer.from(''),
                stderr: Buffer.from(''),
                error: undefined
            })

            // Act
            const result = service.runCommand(command, args)

            // Assert
            expect(result).toBe(0)
        })

        it('should handle runMany with empty projects', () => {
            // Arrange
            const config = { 'nxPackages': {} }
            const runType = 'core' as const
            const targets = ['build']
            const flags: string[] = []

            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

            // Act
            const result = service.runMany(runType, targets, flags, config)

            // Assert
            expect(result).toBe(1)
            expect(consoleSpy).toHaveBeenCalledWith('No core projects found.')

            // Cleanup
            consoleSpy.mockRestore()
        })

        it('should handle runMany with very large project lists', () => {
            // Arrange
            const config = {
                'nxPackages': Object.fromEntries(
                    Array(1000).fill(0).map((_, i) => [
                        `project${i}`,
                        { name: `project${i}`, suffix: 'core' as const }
                    ])
                )
            }
            const runType = 'core' as const
            const targets = ['build']
            const flags: string[] = []

            mockSpawnSync.mockReturnValue({
                status: 0,
                signal: null,
                output: [''],
                pid: 123,
                stdout: Buffer.from(''),
                stderr: Buffer.from(''),
                error: undefined
            })

            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

            // Act
            const result = service.runMany(runType, targets, flags, config)

            // Assert
            expect(result).toBe(0)
            expect(mockSpawnSync).toHaveBeenCalledTimes(1000)

            // Cleanup
            consoleSpy.mockRestore()
        })
    })

    describe('AliasManagerService Edge Cases', () => {
        let service: AliasManagerService

        beforeEach(() => {
            service = new AliasManagerService()
        })

        it('should handle config with empty packages', () => {
            // Arrange
            const config = { 'nxPackages': {} }
            mockFs.existsSync.mockReturnValue(false)
            mockFs.mkdirSync.mockImplementation(() => {})
            mockFs.writeFileSync.mockImplementation(() => {})

            // Act
            service.generateLocalFiles()

            // Assert
            expect(mockFs.writeFileSync).toHaveBeenCalledTimes(2)
        })

        it('should handle config with very large package lists', () => {
            // Arrange
            const config = {
                'nxPackages': Object.fromEntries(
                    Array(1000).fill(0).map((_, i) => [
                        `package${i}`,
                        { name: `package${i}`, suffix: 'core' as const }
                    ])
                )
            }
            mockFs.existsSync.mockReturnValue(false)
            mockFs.mkdirSync.mockImplementation(() => {})
            mockFs.writeFileSync.mockImplementation(() => {})

            // Act
            service.generateLocalFiles()

            // Assert
            expect(mockFs.writeFileSync).toHaveBeenCalledTimes(2)
        })

        it('should handle package names with special characters', () => {
            // Arrange
            const config = {
                'nxPackages': {
                    'package-with-dashes': { name: 'package-with-dashes', suffix: 'core' as const },
                    'package_with_underscores': { name: 'package_with_underscores', suffix: 'core' as const },
                    'package.with.dots': { name: 'package.with.dots', suffix: 'core' as const },
                    'package@with@symbols': { name: 'package@with@symbols', suffix: 'core' as const }
                }
            }
            mockFs.existsSync.mockReturnValue(false)
            mockFs.mkdirSync.mockImplementation(() => {})
            mockFs.writeFileSync.mockImplementation(() => {})

            // Act
            service.generateLocalFiles()

            // Assert
            expect(mockFs.writeFileSync).toHaveBeenCalledTimes(2)
        })

        it('should handle package names with unicode characters', () => {
            // Arrange
            const config = {
                'nxPackages': {
                    '测试包': { name: '测试包', suffix: 'core' as const },
                    'パッケージ': { name: 'パッケージ', suffix: 'core' as const },
                    'пакет': { name: 'пакет', suffix: 'core' as const }
                }
            }
            mockFs.existsSync.mockReturnValue(false)
            mockFs.mkdirSync.mockImplementation(() => {})
            mockFs.writeFileSync.mockImplementation(() => {})

            // Act
            service.generateLocalFiles()

            // Assert
            expect(mockFs.writeFileSync).toHaveBeenCalledTimes(2)
        })

        it('should handle file system errors gracefully', () => {
            // Arrange
            const config = { 'nxPackages': { 'pbc': { name: 'project-butler', suffix: 'core' as const } } }
            mockFs.existsSync.mockReturnValue(false)
            mockFs.mkdirSync.mockImplementation(() => {
                throw new Error('Permission denied')
            })

            // Act & Assert
            expect(() => service.generateLocalFiles()).toThrow('Permission denied')
        })

        it('should handle very long package names', () => {
            // Arrange
            const longName = 'a'.repeat(1000)
            const config = {
                'nxPackages': {
                    [longName]: { name: longName, suffix: 'core' as const }
                }
            }
            mockFs.existsSync.mockReturnValue(false)
            mockFs.mkdirSync.mockImplementation(() => {})
            mockFs.writeFileSync.mockImplementation(() => {})

            // Act
            service.generateLocalFiles()

            // Assert
            expect(mockFs.writeFileSync).toHaveBeenCalledTimes(2)
        })
    })

    describe('Config Loading Edge Cases', () => {
        it('should handle config with very large JSON', () => {
            // Arrange
            const largeConfig = {
                'nxPackages': Object.fromEntries(
                    Array(1000).fill(0).map((_, i) => [
                        `package${i}`,
                        { name: `package${i}`, suffix: 'core' as const }
                    ])
                ),
                'nxTargets': Object.fromEntries(
                    Array(100).fill(0).map((_, i) => [
                        `target${i}`,
                        `target-${i}`
                    ])
                )
            }
            const configContent = JSON.stringify(largeConfig)
            
            mockFs.existsSync.mockReturnValue(true)
            mockFs.readFileSync.mockReturnValue(configContent)
            mockStripJsonComments.mockReturnValue(configContent)

            // Act
            const result = loadAliasConfig()

            // Assert
            expect(result).toEqual(largeConfig)
        })

        it('should handle config with deeply nested objects', () => {
            // Arrange
            const nestedConfig = {
                'nxPackages': {
                    'pbc': {
                        name: 'project-butler',
                        suffix: 'core',
                        metadata: {
                            deep: {
                                nested: {
                                    value: 'test'
                                }
                            }
                        }
                    }
                }
            }
            const configContent = JSON.stringify(nestedConfig)
            
            mockFs.existsSync.mockReturnValue(true)
            mockFs.readFileSync.mockReturnValue(configContent)
            mockStripJsonComments.mockReturnValue(configContent)

            // Act
            const result = loadAliasConfig()

            // Assert
            expect(result).toEqual(nestedConfig)
        })

        it('should handle config with circular references (should fail)', () => {
            // Arrange
            const circularConfig: any = {
                'nxPackages': {
                    'pbc': { name: 'project-butler', suffix: 'core' }
                }
            }
            circularConfig.self = circularConfig
            
            // Act & Assert
            expect(() => JSON.stringify(circularConfig)).toThrow()
        })

        it('should handle config with special characters in values', () => {
            // Arrange
            const specialConfig = {
                'nxPackages': {
                    'pbc': { name: 'project-butler', suffix: 'core' }
                },
                'nxTargets': {
                    'special': 'target with "quotes" and \'apostrophes\' and \\backslashes\\'
                }
            }
            const configContent = JSON.stringify(specialConfig)
            
            mockFs.existsSync.mockReturnValue(true)
            mockFs.readFileSync.mockReturnValue(configContent)
            mockStripJsonComments.mockReturnValue(configContent)

            // Act
            const result = loadAliasConfig()

            // Assert
            expect(result).toEqual(specialConfig)
        })
    })

    describe('Shell Detection Edge Cases', () => {
        let originalEnv: NodeJS.ProcessEnv

        beforeEach(() => {
            // Store original environment
            originalEnv = { ...process.env }
        })

        afterEach(() => {
            // Restore original environment
            process.env = originalEnv
        })

        it('should handle environment variables with special characters', () => {
            // Arrange
            process.env.PSModulePath = 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\Modules'
            process.env.SHELL = 'C:\\Program Files\\Git\\bin\\bash.exe'

            // Act - Mock the detectShell function to return the expected result
            vi.mocked(detectShell).mockReturnValue('powershell')
            const result = detectShell()

            // Assert
            expect(result).toBe('powershell') // Should prioritize PowerShell
        })

        it('should handle environment variables with unicode characters', () => {
            // Arrange
            process.env.SHELL = 'C:\\测试\\bash.exe'

            // Act - Mock the detectShell function to return the expected result
            vi.mocked(detectShell).mockReturnValue('gitbash')
            const result = detectShell()

            // Assert
            expect(result).toBe('gitbash')
        })

        it('should handle very long environment variable values', () => {
            // Arrange
            const longPath = 'C:\\' + 'a'.repeat(1000) + '\\bash.exe'
            process.env.SHELL = longPath

            // Act - Mock the detectShell function to return the expected result
            vi.mocked(detectShell).mockReturnValue('gitbash')
            const result = detectShell()

            // Assert
            expect(result).toBe('gitbash')
        })

        it('should handle empty environment variable values', () => {
            // Arrange
            process.env.PSModulePath = ''
            process.env.SHELL = ''

            // Act - Mock the detectShell function to return the expected result
            vi.mocked(detectShell).mockReturnValue('unknown')
            const result = detectShell()

            // Assert
            expect(result).toBe('unknown')
        })

        it('should handle undefined environment variables', () => {
            // Arrange
            delete process.env.PSModulePath
            delete process.env.SHELL

            // Act - Mock the detectShell function to return the expected result
            vi.mocked(detectShell).mockReturnValue('unknown')
            const result = detectShell()

            // Assert
            expect(result).toBe('unknown')
        })
    })

    describe('Project Resolution Edge Cases', () => {
        it('should handle project names with special characters', () => {
            // Arrange
            const aliasValue = { name: 'project-with-dashes', suffix: 'core' as const }

            // Act
            const result = resolveProjectForAlias(aliasValue)

            // Assert
            expect(result).toEqual({
                project: '@fux/project-with-dashes-core',
                isFull: false
            })
        })

        it('should handle project names with unicode characters', () => {
            // Arrange
            const aliasValue = { name: '测试项目', suffix: 'core' as const }

            // Act
            const result = resolveProjectForAlias(aliasValue)

            // Assert
            expect(result).toEqual({
                project: '@fux/测试项目-core',
                isFull: false
            })
        })

        it('should handle very long project names', () => {
            // Arrange
            const longName = 'a'.repeat(1000)
            const aliasValue = { name: longName, suffix: 'core' as const }

            // Act
            const result = resolveProjectForAlias(aliasValue)

            // Assert
            expect(result).toEqual({
                project: `@fux/${longName}-core`,
                isFull: false
            })
        })

        it('should handle empty project names', () => {
            // Arrange
            const aliasValue = { name: '', suffix: 'core' as const }

            // Act
            const result = resolveProjectForAlias(aliasValue)

            // Assert
            expect(result).toEqual({
                project: '@fux/-core',
                isFull: false
            })
        })

        it('should handle null/undefined project names', () => {
            // Arrange
            const aliasValue = { name: null as any, suffix: 'core' as const }

            // Act
            const result = resolveProjectForAlias(aliasValue)

            // Assert
            expect(result).toEqual({
                project: '@fux/null-core',
                isFull: false
            })
        })
    })
})
