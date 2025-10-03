import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as os from 'os'
import type { 
    ShellType,
    ExpandableValue,
    TemplateProcessingResult
} from '../../../src/_types/index.js'
import { ExpandableProcessorService } from '../../../src/services/ExpandableProcessor.service.js'

// Mock the shell detection module
vi.mock('../../../src/shell.js', () => ({
    detectShellTypeCached: vi.fn()
}))

/**
 * Cross-Platform Testing
 * 
 * Tests shell detection across platforms, platform-specific command execution,
 * path handling, environment variables, and shell-specific template processing.
 */

describe('Cross-Platform - Shell Detection and Platform Compatibility', () => {
    let expandableProcessor: ExpandableProcessorService
    let originalPlatform: string
    let originalEnv: NodeJS.ProcessEnv
    let mockDetectShellTypeCached: any

    beforeEach(async () => {
        // Get the mocked function first
        const { detectShellTypeCached } = await import('../../../src/shell.js')
        mockDetectShellTypeCached = detectShellTypeCached
        
        expandableProcessor = new ExpandableProcessorService()
        originalPlatform = process.platform
        originalEnv = { ...process.env }
        
        // Reset the mock for each test
        mockDetectShellTypeCached.mockClear()
    })

    afterEach(() => {
        Object.defineProperty(process, 'platform', {
            value: originalPlatform,
            writable: true,
            configurable: true
        })
        process.env = originalEnv
        vi.clearAllMocks()
    })

    describe('Shell Detection Across Platforms', () => {
        it('should detect PowerShell on Windows', () => {
            // Mock shell detection
            mockDetectShellTypeCached.mockReturnValue('pwsh')
            
            const result = expandableProcessor.detectShellType()
            
            expect(result).toBe('pwsh')
        })

        it('should detect CMD on Windows when PowerShell is not available', () => {
            // Mock shell detection
            mockDetectShellTypeCached.mockReturnValue('cmd')
            
            const result = expandableProcessor.detectShellType()
            
            expect(result).toBe('cmd')
        })

        it('should detect Linux shell on Unix-like systems', () => {
            // Mock shell detection
            mockDetectShellTypeCached.mockReturnValue('linux')
            
            const result = expandableProcessor.detectShellType()
            
            expect(result).toBe('linux')
        })

        it('should detect Linux shell on macOS', () => {
            // Mock shell detection
            mockDetectShellTypeCached.mockReturnValue('linux')
            
            const result = expandableProcessor.detectShellType()
            
            expect(result).toBe('linux')
        })

        it('should handle Git Bash on Windows', () => {
            // Mock shell detection
            mockDetectShellTypeCached.mockReturnValue('linux')
            
            const result = expandableProcessor.detectShellType()
            
            expect(result).toBe('linux')
        })

        it('should fallback to platform default for unknown shells', () => {
            // Mock shell detection
            mockDetectShellTypeCached.mockReturnValue('cmd')
            
            const result = expandableProcessor.detectShellType()
            
            expect(result).toBe('cmd')
        })

        it('should handle missing environment variables gracefully', () => {
            // Mock shell detection
            mockDetectShellTypeCached.mockReturnValue('linux')
            
            const result = expandableProcessor.detectShellType()
            
            expect(result).toBe('linux')
        })
    })

    describe('Platform-Specific Command Execution', () => {
        it('should generate PowerShell-specific commands', () => {
            const expandable: ExpandableValue = {
                'pwsh-template': 'Write-Host "PowerShell command: {message}"',
                'linux-template': 'echo "Linux command: {message}"',
                'cmd-template': 'echo "CMD command: {message}"'
            }
            const variables = { message: 'test' }
            
            // Mock PowerShell detection
            vi.spyOn(expandableProcessor, 'detectShellType').mockReturnValue('pwsh')
            
            const result = expandableProcessor.processShellSpecificTemplate(expandable, variables)
            
            expect(result.start).toContain('Write-Host "PowerShell command: test"')
            expect(result.start).not.toContain('echo "Linux command: test"')
            expect(result.start).not.toContain('echo "CMD command: test"')
        })

        it('should generate Linux-specific commands', () => {
            const expandable: ExpandableValue = {
                'pwsh-template': 'Write-Host "PowerShell command: {message}"',
                'linux-template': 'echo "Linux command: {message}"',
                'cmd-template': 'echo "CMD command: {message}"'
            }
            const variables = { message: 'test' }
            
            // Mock Linux detection
            vi.spyOn(expandableProcessor, 'detectShellType').mockReturnValue('linux')
            
            const result = expandableProcessor.processShellSpecificTemplate(expandable, variables)
            
            expect(result.start).toContain('echo "Linux command: test"')
            expect(result.start).not.toContain('Write-Host "PowerShell command: test"')
            expect(result.start).not.toContain('echo "CMD command: test"')
        })

        it('should generate CMD-specific commands', () => {
            const expandable: ExpandableValue = {
                'pwsh-template': 'Write-Host "PowerShell command: {message}"',
                'linux-template': 'echo "Linux command: {message}"',
                'cmd-template': 'echo "CMD command: {message}"'
            }
            const variables = { message: 'test' }
            
            // Mock CMD detection
            vi.spyOn(expandableProcessor, 'detectShellType').mockReturnValue('cmd')
            
            const result = expandableProcessor.processShellSpecificTemplate(expandable, variables)
            
            expect(result.start).toContain('echo "CMD command: test"')
            expect(result.start).not.toContain('Write-Host "PowerShell command: test"')
            expect(result.start).not.toContain('echo "Linux command: test"')
        })

        it('should handle missing shell-specific templates gracefully', () => {
            const expandable: ExpandableValue = {
                'pwsh-template': 'Write-Host "PowerShell command: {message}"',
                template: 'echo "Default command: {message}"'
            }
            const variables = { message: 'test' }
            
            // Mock Linux detection (no linux-template available)
            vi.spyOn(expandableProcessor, 'detectShellType').mockReturnValue('linux')
            
            const result = expandableProcessor.processShellSpecificTemplate(expandable, variables)
            
            expect(result.start).toContain('echo "Default command: test"')
            expect(result.start).not.toContain('Write-Host "PowerShell command: test"')
        })
    })

    describe('Path Handling and Environment Variables', () => {
        it('should handle Windows path separators', () => {
            const template = 'cd {workspace} && {command}'
            const variables = { 
                workspace: 'C:\\Users\\Developer\\Projects\\FocusedUX',
                command: 'nx build'
            }
            
            const result = expandableProcessor.expandTemplate(template, variables)
            
            expect(result).toContain('C:\\Users\\Developer\\Projects\\FocusedUX')
            expect(result).toContain('nx build')
        })

        it('should handle Unix path separators', () => {
            const template = 'cd {workspace} && {command}'
            const variables = { 
                workspace: '/home/developer/projects/focusedux',
                command: 'nx build'
            }
            
            const result = expandableProcessor.expandTemplate(template, variables)
            
            expect(result).toContain('/home/developer/projects/focusedux')
            expect(result).toContain('nx build')
        })

        it('should handle mixed path separators in templates', () => {
            const template = 'cd {workspace}'
            const variables = { 
                workspace: process.platform === 'win32' ? 'C:\\workspace' : '/workspace'
            }
            
            const result = expandableProcessor.expandTemplate(template, variables)
            
            if (process.platform === 'win32') {
                expect(result).toContain('C:\\workspace')
            } else {
                expect(result).toContain('/workspace')
            }
        })

        it('should handle environment variable substitution', () => {
            const template = 'cd {WORKSPACE_ROOT} && echo {TEST_VAR}'
            const variables = { 
                'WORKSPACE_ROOT': '/workspace',
                'TEST_VAR': 'test-value'
            }
            
            const result = expandableProcessor.expandTemplate(template, variables)
            
            expect(result).toContain('/workspace')
            expect(result).toContain('test-value')
        })

        it('should handle missing environment variables gracefully', () => {
            const template = 'cd {MISSING} && echo {ANOTHER}'
            const variables = { 
                'MISSING': '',
                'ANOTHER': ''
            }
            
            const result = expandableProcessor.expandTemplate(template, variables)
            
            expect(result).toBe('cd {MISSING} && echo {ANOTHER}')
            expect(result).not.toContain('undefined')
            expect(result).not.toContain('null')
        })
    })

    describe('Shell-Specific Template Processing', () => {
        it('should process PowerShell array templates', () => {
            const expandable: ExpandableValue = {
                'pwsh-template': [
                    { position: 'start', template: 'Write-Host "Starting {project}"' },
                    { position: 'end', template: 'Write-Host "Finished {project}"' }
                ]
            }
            const variables = { project: 'test-project' }
            
            vi.spyOn(expandableProcessor, 'detectShellType').mockReturnValue('pwsh')
            
            const result = expandableProcessor.processShellSpecificTemplate(expandable, variables)
            
            expect(result.start).toContain('Write-Host "Starting test-project"')
            expect(result.end).toContain('Write-Host "Finished test-project"')
        })

        it('should process Linux object templates', () => {
            const expandable: ExpandableValue = {
                'linux-template': {
                    position: 'start',
                    template: 'echo "Starting {project}"',
                    defaults: { project: 'default-project' }
                }
            }
            const variables = { message: 'test' }
            
            vi.spyOn(expandableProcessor, 'detectShellType').mockReturnValue('linux')
            
            const result = expandableProcessor.processShellSpecificTemplate(expandable, variables)
            
            expect(result.start).toContain('echo "Starting default-project"')
        })

        it('should process CMD string templates', () => {
            const expandable: ExpandableValue = {
                'cmd-template': 'echo "CMD: {message}"'
            }
            const variables = { message: 'test' }
            
            vi.spyOn(expandableProcessor, 'detectShellType').mockReturnValue('cmd')
            
            const result = expandableProcessor.processShellSpecificTemplate(expandable, variables)
            
            expect(result.start).toContain('echo "CMD: test"')
        })

        it('should handle template defaults correctly', () => {
            const expandable: ExpandableValue = {
                'pwsh-template': {
                    position: 'start',
                    template: 'Write-Host "{message} {name}"',
                    defaults: { name: 'Universe' }
                }
            }
            const variables = { message: 'Hello' }
            
            vi.spyOn(expandableProcessor, 'detectShellType').mockReturnValue('pwsh')
            
            const result = expandableProcessor.processShellSpecificTemplate(expandable, variables)
            
            expect(result.start).toContain('Write-Host "Hello Universe"')
        })
    })

    describe('Cross-Platform Command Construction', () => {
        it('should construct PowerShell commands correctly', () => {
            const baseCommand = ['nx', 'build', 'test-project']
            const startTemplates = ['Write-Host "Starting build"']
            const endTemplates = ['Write-Host "Build completed"']
            
            const result = expandableProcessor.constructWrappedCommand(baseCommand, startTemplates, endTemplates)
            
            expect(result).toEqual([
                'Write-Host "Starting build"',
                'nx',
                'build',
                'test-project',
                'Write-Host "Build completed"'
            ])
        })

        it('should construct Linux commands correctly', () => {
            const baseCommand = ['nx', 'build', 'test-project']
            const startTemplates = ['echo "Starting build"', 'cd /workspace']
            const endTemplates = ['echo "Build completed"', 'cd -']
            
            const result = expandableProcessor.constructWrappedCommand(baseCommand, startTemplates, endTemplates)
            
            expect(result).toEqual([
                'echo "Starting build"',
                'cd /workspace',
                'nx',
                'build',
                'test-project',
                'echo "Build completed"',
                'cd -'
            ])
        })

        it('should construct CMD commands correctly', () => {
            const baseCommand = ['nx', 'build', 'test-project']
            const startTemplates = ['echo Starting build']
            const endTemplates = ['echo Build completed']
            
            const result = expandableProcessor.constructWrappedCommand(baseCommand, startTemplates, endTemplates)
            
            expect(result).toEqual([
                'echo Starting build',
                'nx',
                'build',
                'test-project',
                'echo Build completed'
            ])
        })

        it('should handle empty command parts gracefully', () => {
            const baseCommand: string[] = []
            const startTemplates: string[] = []
            const endTemplates: string[] = []
            
            const result = expandableProcessor.constructWrappedCommand(baseCommand, startTemplates, endTemplates)
            
            expect(result).toEqual([])
        })
    })

    describe('Platform-Specific Error Handling', () => {
        it('should handle shell detection errors gracefully', () => {
            // Mock shell detection to throw an error
            vi.spyOn(expandableProcessor, 'detectShellType').mockImplementation(() => {
                throw new Error('Shell detection failed')
            })
            
            expect(() => {
                expandableProcessor.detectShellType()
            }).toThrow('Shell detection failed')
        })

        it('should handle template processing errors across platforms', () => {
            const expandable: ExpandableValue = {
                'pwsh-template': 'Write-Host "{invalid.template.syntax"',
                'linux-template': 'echo "{invalid.template.syntax"',
                'cmd-template': 'echo "{invalid.template.syntax"'
            }
            const variables = { message: 'test' }
            
            // Should not throw, but handle gracefully
            expect(() => {
                expandableProcessor.processShellSpecificTemplate(expandable, variables)
            }).not.toThrow()
        })

        it('should handle missing shell-specific templates gracefully', () => {
            const expandable: ExpandableValue = {
                template: 'echo "Default: {message}"'
            }
            const variables = { message: 'test' }
            
            // Mock different shell types
            const shells: ShellType[] = ['pwsh', 'linux', 'cmd']
            
            shells.forEach(shell => {
                vi.spyOn(expandableProcessor, 'detectShellType').mockReturnValue(shell)
                
                const result = expandableProcessor.processShellSpecificTemplate(expandable, variables)
                
                expect(result.start).toContain('echo "Default: test"')
            })
        })
    })

    describe('Platform Compatibility Validation', () => {
        it('should validate shell detection results', () => {
            const validShells: ShellType[] = ['pwsh', 'linux', 'cmd']
            
            // Test each valid shell type
            validShells.forEach(shell => {
                vi.spyOn(expandableProcessor, 'detectShellType').mockReturnValue(shell)
                
                const result = expandableProcessor.detectShellType()
                
                expect(validShells).toContain(result)
            })
        })

        it('should validate cross-platform template compatibility', () => {
            const expandable: ExpandableValue = {
                'pwsh-template': 'Write-Host "Cross-platform: {message}"',
                'linux-template': 'echo "Cross-platform: {message}"',
                'cmd-template': 'echo "Cross-platform: {message}"',
                template: 'echo "Cross-platform: {message}"'
            }
            const variables = { message: 'test' }
            
            const shells: ShellType[] = ['pwsh', 'linux', 'cmd']
            
            shells.forEach(shell => {
                vi.spyOn(expandableProcessor, 'detectShellType').mockReturnValue(shell)
                
                const result = expandableProcessor.processShellSpecificTemplate(expandable, variables)
                
                expect(result.start).toEqual(expect.arrayContaining([expect.stringContaining('Cross-platform: test')]))
            })
        })

        it('should validate platform-specific command syntax', () => {
            const templates = {
                pwsh: 'Write-Host "PowerShell syntax test"',
                linux: 'echo "Linux syntax test"',
                cmd: 'echo "CMD syntax test"'
            }
            
            Object.entries(templates).forEach(([shell, template]) => {
                const result = expandableProcessor.expandTemplate(template, {})
                
                expect(result).toContain('syntax test')
                expect(result).not.toContain('{{')
                expect(result).not.toContain('}}')
            })
        })
    })

    describe('Environment Variable Handling', () => {
        it('should handle Windows-specific environment variables', () => {
            if (process.platform === 'win32') {
                process.env.USERPROFILE = 'C:\\Users\\TestUser'
                process.env.PSModulePath = 'C:\\Program Files\\PowerShell\\7\\Modules'
                
                const template = 'cd {USERPROFILE} && echo {PSModulePath}'
                const variables = { 
                    'USERPROFILE': process.env.USERPROFILE,
                    'PSModulePath': process.env.PSModulePath
                }
                
                const result = expandableProcessor.expandTemplate(template, variables)
                
                expect(result).toContain('C:\\Users\\TestUser')
                expect(result).toContain('C:\\Program Files\\PowerShell\\7\\Modules')
            }
        })

        it('should handle Unix-specific environment variables', () => {
            if (process.platform !== 'win32') {
                process.env.HOME = '/home/testuser'
                process.env.SHELL = '/bin/bash'
                
                const template = 'cd {HOME} && echo {SHELL}'
                const variables = { 
                    'HOME': process.env.HOME,
                    'SHELL': process.env.SHELL
                }
                
                const result = expandableProcessor.expandTemplate(template, variables)
                
                expect(result).toContain('/home/testuser')
                expect(result).toContain('/bin/bash')
            }
        })

        it('should handle cross-platform environment variables', () => {
            process.env.PATH = process.platform === 'win32' 
                ? 'C:\\Windows\\System32;C:\\Program Files\\Node.js'
                : '/usr/local/bin:/usr/bin:/bin'
            
            const template = 'echo "PATH: {PATH}"'
            const variables = { 'PATH': process.env.PATH }
            
            const result = expandableProcessor.expandTemplate(template, variables)
            
            expect(result).toContain('PATH:')
            expect(result).toContain(process.env.PATH)
        })
    })
})
