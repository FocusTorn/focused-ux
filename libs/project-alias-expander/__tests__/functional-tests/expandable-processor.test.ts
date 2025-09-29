import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ExpandableProcessorService } from '../../src/services/ExpandableProcessor.service.js'
import type {
    ExpandableValue,
    TemplateObject,
    ShellType,
    FlagExpansion,
    TemplateProcessingResult,
    ShellDetectionResult
} from '../../src/_types/index.js'

// Mock the shell detection
vi.mock('../../src/shell.js', () => ({
    detectShell: vi.fn()
}))

import { detectShell } from '../../src/shell.js'

describe('ExpandableProcessorService', () => {
    let service: ExpandableProcessorService
    let mockDetectShell: ReturnType<typeof vi.mocked>

    beforeEach(() => {
        service = new ExpandableProcessorService()
        mockDetectShell = vi.mocked(detectShell)
    })

    describe('expandTemplate', () => {
        it('should expand template with all variables', () => {
            // Arrange
            const template = 'timeout {duration}s {command}'
            const variables = { duration: '10', command: 'nx test' }

            // Act
            const result = service.expandTemplate(template, variables)

            // Assert
            expect(result).toBe('timeout 10s nx test')
        })

        it('should handle missing variables by keeping placeholders', () => {
            // Arrange
            const template = 'timeout {duration}s {command}'
            const variables = { duration: '10' }

            // Act
            const result = service.expandTemplate(template, variables)

            // Assert
            expect(result).toBe('timeout 10s {command}')
        })

        it('should handle empty template', () => {
            // Arrange
            const template = ''
            const variables = { duration: '10' }

            // Act
            const result = service.expandTemplate(template, variables)

            // Assert
            expect(result).toBe('')
        })

        it('should handle template with no variables', () => {
            // Arrange
            const template = 'simple command'
            const variables = {}

            // Act
            const result = service.expandTemplate(template, variables)

            // Assert
            expect(result).toBe('simple command')
        })

        it('should handle multiple occurrences of same variable', () => {
            // Arrange
            const template = '{var} and {var} again'
            const variables = { var: 'test' }

            // Act
            const result = service.expandTemplate(template, variables)

            // Assert
            expect(result).toBe('test and test again')
        })
    })

    describe('detectShellType', () => {
        it('should return pwsh for PowerShell shell', () => {
            // Arrange
            mockDetectShell.mockReturnValue('powershell')

            // Act
            const result = service.detectShellType()

            // Assert
            expect(result).toBe('pwsh')
        })

        it('should return linux for Git Bash shell', () => {
            // Arrange
            mockDetectShell.mockReturnValue('gitbash')

            // Act
            const result = service.detectShellType()

            // Assert
            expect(result).toBe('linux')
        })

        it('should return cmd for unknown shell on Windows', () => {
            // Arrange
            mockDetectShell.mockReturnValue('unknown')
            const originalPlatform = process.platform
            Object.defineProperty(process, 'platform', { value: 'win32' })

            // Act
            const result = service.detectShellType()

            // Assert
            expect(result).toBe('cmd')

            // Cleanup
            Object.defineProperty(process, 'platform', { value: originalPlatform })
        })

        it('should return linux for unknown shell on non-Windows', () => {
            // Arrange
            mockDetectShell.mockReturnValue('unknown')
            const originalPlatform = process.platform
            Object.defineProperty(process, 'platform', { value: 'linux' })

            // Act
            const result = service.detectShellType()

            // Assert
            expect(result).toBe('linux')

            // Cleanup
            Object.defineProperty(process, 'platform', { value: originalPlatform })
        })
    })

    describe('processTemplateArray', () => {
        it('should process templates with start position', () => {
            // Arrange
            const templates: TemplateObject[] = [
                { position: 'start', template: 'timeout {duration}s' },
                { position: 'prefix', template: 'echo {message}' }
            ]
            const variables = { duration: '10', message: 'hello' }

            // Act
            const result = service.processTemplateArray(templates, variables)

            // Assert
            expect(result.start).toEqual(['timeout 10s', 'echo hello'])
            expect(result.end).toEqual([])
        })

        it('should process templates with end position', () => {
            // Arrange
            const templates: TemplateObject[] = [
                { position: 'end', template: 'cleanup {action}' }
            ]
            const variables = { action: 'remove' }

            // Act
            const result = service.processTemplateArray(templates, variables)

            // Assert
            expect(result.start).toEqual([])
            expect(result.end).toEqual(['cleanup remove'])
        })

        it('should handle template-level defaults', () => {
            // Arrange
            const templates: TemplateObject[] = [
                {
                    position: 'start',
                    template: 'timeout {duration}s {command}',
                    defaults: { command: 'default' }
                }
            ]
            const variables = { duration: '10' }

            // Act
            const result = service.processTemplateArray(templates, variables)

            // Assert
            expect(result.start).toEqual(['timeout 10s default'])
        })

        it('should throw error for conflicting defaults', () => {
            // Arrange
            const templates: TemplateObject[] = [
                {
                    position: 'start',
                    template: 'timeout {duration}s',
                    defaults: { duration: '5' }
                }
            ]
            const variables = { duration: '10' }

            // Act & Assert
            expect(() => service.processTemplateArray(templates, variables))
                .toThrow("Variable conflict: 'duration' is defined in both top-level and template-level defaults")
        })

        it('should throw error for multiple end templates', () => {
            // Arrange
            const templates: TemplateObject[] = [
                { position: 'end', template: 'cleanup1' },
                { position: 'end', template: 'cleanup2' }
            ]
            const variables = {}

            // Act & Assert
            expect(() => service.processTemplateArray(templates, variables))
                .toThrow('Only one "end" position template is allowed per expandable')
        })
    })

    describe('processShellSpecificTemplate', () => {
        it('should process pwsh-template array', () => {
            // Arrange
            mockDetectShell.mockReturnValue('powershell')
            const expandable: ExpandableValue = {
                'pwsh-template': [
                    { position: 'start', template: 'timeout {duration}s' },
                    { position: 'end', template: 'cleanup' }
                ],
                defaults: { duration: '10' }
            }
            const variables = { duration: '10' }

            // Act
            const result = service.processShellSpecificTemplate(expandable, variables)

            // Assert
            expect(result.start).toEqual(['timeout 10s'])
            expect(result.end).toEqual(['cleanup'])
        })

        it('should process linux-template object', () => {
            // Arrange
            mockDetectShell.mockReturnValue('gitbash')
            const expandable: ExpandableValue = {
                'linux-template': {
                    position: 'prefix',
                    template: 'timeout {duration}s',
                    defaults: { timeout: '5' }
                }
            }
            const variables = { duration: '5' }

            // Act
            const result = service.processShellSpecificTemplate(expandable, variables)

            // Assert
            expect(result.start).toEqual(['timeout 5s'])
            expect(result.end).toEqual([])
        })

        it('should process cmd-template string', () => {
            // Arrange
            mockDetectShell.mockReturnValue('unknown')
            const originalPlatform = process.platform
            Object.defineProperty(process, 'platform', { value: 'win32' })
            
            const expandable: ExpandableValue = {
                'cmd-template': 'timeout {duration}s',
                defaults: { duration: '10' }
            }
            const variables = { duration: '10' }

            // Act
            const result = service.processShellSpecificTemplate(expandable, variables)

            // Assert
            expect(result.start).toEqual(['timeout 10s'])
            expect(result.end).toEqual([])

            // Cleanup
            Object.defineProperty(process, 'platform', { value: originalPlatform })
        })

        it('should fallback to generic template when no shell-specific template', () => {
            // Arrange
            mockDetectShell.mockReturnValue('unknown')
            const expandable: ExpandableValue = {
                template: 'timeout {duration}s',
                position: 'suffix',
                defaults: { duration: '10' }
            }
            const variables = { duration: '10' }

            // Act
            const result = service.processShellSpecificTemplate(expandable, variables)

            // Assert
            expect(result.start).toEqual(['timeout 10s'])
            expect(result.end).toEqual([])
        })

        it('should handle string expandable', () => {
            // Arrange
            const expandable: ExpandableValue = 'simple-flag'
            const variables = {}

            // Act
            const result = service.processShellSpecificTemplate(expandable, variables)

            // Assert
            expect(result.start).toEqual([])
            expect(result.end).toEqual([])
        })
    })

    describe('parseExpandableFlag', () => {
        it('should parse equal syntax flag', () => {
            // Arrange
            const flag = '-sto=5'

            // Act
            const result = service.parseExpandableFlag(flag)

            // Assert
            expect(result.key).toBe('sto')
            expect(result.value).toBe('5')
        })

        it('should parse colon syntax flag', () => {
            // Arrange
            const flag = '-mem:2048'

            // Act
            const result = service.parseExpandableFlag(flag)

            // Assert
            expect(result.key).toBe('mem')
            expect(result.value).toBe('2048')
        })

        it('should parse flag without value', () => {
            // Arrange
            const flag = '-f'

            // Act
            const result = service.parseExpandableFlag(flag)

            // Assert
            expect(result.key).toBe('f')
            expect(result.value).toBeUndefined()
        })

        it('should handle invalid flag format', () => {
            // Arrange
            const flag = '-invalid'

            // Act
            const result = service.parseExpandableFlag(flag)

            // Assert
            expect(result.key).toBe('invalid')
            expect(result.value).toBeUndefined()
        })
    })

    describe('expandFlags', () => {
        it('should expand simple string flags', () => {
            // Arrange
            const args = ['-f', '-s', 'test']
            const expandables = { f: '--fix', s: '--skip-nx-cache' }

            // Act
            const result = service.expandFlags(args, expandables)

            // Assert
            expect(result.prefix).toEqual([])
            expect(result.preArgs).toEqual([])
            expect(result.suffix).toEqual(['--fix', '--skip-nx-cache'])
            expect(result.remainingArgs).toEqual(['test'])
        })

        it('should expand template flags with defaults', () => {
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
            const result = service.expandFlags(args, expandables)

            // Assert
            expect(result.prefix).toEqual(['timeout 10s'])
            expect(result.remainingArgs).toEqual(['test'])
        })

        it('should expand template flags with custom values', () => {
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
            const result = service.expandFlags(args, expandables)

            // Assert
            expect(result.prefix).toEqual(['timeout 5s'])
            expect(result.remainingArgs).toEqual(['test'])
        })

        it('should handle short bundle flags', () => {
            // Arrange
            const args = ['-fs', 'test']
            const expandables = { f: '--fix', s: '--skip-nx-cache' }

            // Act
            const result = service.expandFlags(args, expandables)

            // Assert
            expect(result.suffix).toEqual(['--fix', '--skip-nx-cache'])
            expect(result.remainingArgs).toEqual(['test'])
        })

        it('should preserve double-dash flags', () => {
            // Arrange
            const args = ['--coverage', 'test']
            const expandables = { f: '--fix' }

            // Act
            const result = service.expandFlags(args, expandables)

            // Assert
            expect(result.remainingArgs).toEqual(['--coverage', 'test'])
        })

        it('should handle echo flag specially', () => {
            // Arrange
            const args = ['-echo', 'test']
            const expandables = {}

            // Act
            const result = service.expandFlags(args, expandables)

            // Assert
            expect(result.remainingArgs).toEqual(['test'])
            expect(process.env.PAE_ECHO).toBe('1')
        })

        it('should handle shell-specific templates', () => {
            // Arrange
            mockDetectShell.mockReturnValue('powershell')
            const args = ['-sto', 'test']
            const expandables = {
                sto: {
                    'pwsh-template': [
                        { position: 'start', template: 'timeout {duration}s' },
                        { position: 'end', template: 'cleanup' }
                    ],
                    defaults: { duration: '10' }
                }
            }

            // Act
            const result = service.expandFlags(args, expandables)

            // Assert
            expect(result.start).toEqual(['timeout 10s'])
            expect(result.end).toEqual(['cleanup'])
            expect(result.remainingArgs).toEqual(['test'])
        })

        it('should handle mixed expandable and non-expandable flags', () => {
            // Arrange
            const args = ['-f', '-unknown', 'test']
            const expandables = { f: '--fix' }

            // Act
            const result = service.expandFlags(args, expandables)

            // Assert
            expect(result.suffix).toEqual(['--fix'])
            expect(result.remainingArgs).toEqual(['-unknown', 'test'])
        })
    })

    describe('constructWrappedCommand', () => {
        it('should wrap command with start and end templates', () => {
            // Arrange
            const baseCommand = ['nx', 'run', 'test']
            const startTemplates = ['timeout 10s']
            const endTemplates = ['cleanup']

            // Act
            const result = service.constructWrappedCommand(baseCommand, startTemplates, endTemplates)

            // Assert
            expect(result).toEqual(['timeout 10s', 'nx', 'run', 'test', 'cleanup'])
        })

        it('should handle no start templates', () => {
            // Arrange
            const baseCommand = ['nx', 'run', 'test']
            const startTemplates: string[] = []
            const endTemplates = ['cleanup']

            // Act
            const result = service.constructWrappedCommand(baseCommand, startTemplates, endTemplates)

            // Assert
            expect(result).toEqual(['nx', 'run', 'test', 'cleanup'])
        })

        it('should handle no templates', () => {
            // Arrange
            const baseCommand = ['nx', 'run', 'test']
            const startTemplates: string[] = []
            const endTemplates: string[] = []

            // Act
            const result = service.constructWrappedCommand(baseCommand, startTemplates, endTemplates)

            // Assert
            expect(result).toEqual(['nx', 'run', 'test'])
        })
    })
})
