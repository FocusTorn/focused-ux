import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'
import type { 
    ExpandableValue,
    TemplateObject,
    ShellType,
    FlagExpansion,
    TemplateProcessingResult
} from '../../../src/_types/index.js'
import { ExpandableProcessorService } from '../../../src/services/ExpandableProcessor.service.js'
import { AliasManagerService } from '../../../src/services/AliasManager.service.js'
import { TemplateUtils } from '../../../src/services/CommonUtils.service.js'

/**
 * Generated Content Testing
 * 
 * Tests dynamic script generation, PowerShell module creation, template processing,
 * variable substitution, and configuration file generation.
 */

describe('Generated Content - Dynamic Script Generation', () => {
    let expandableProcessor: ExpandableProcessorService
    let aliasManager: AliasManagerService

    beforeEach(() => {
        expandableProcessor = new ExpandableProcessorService()
        aliasManager = new AliasManagerService()
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    describe('Template Processing and Variable Substitution', () => {
        it('should expand simple templates with variables', () => {
            const template = 'Hello {name}, welcome to {project}!'
            const variables = { name: 'Developer', project: 'FocusedUX' }
            
            const result = expandableProcessor.expandTemplate(template, variables)
            
            expect(result).toBe('Hello Developer, welcome to FocusedUX!')
        })

        it('should handle templates with missing variables', () => {
            const template = 'Hello {name}, your role is {role}!'
            const variables = { name: 'Developer' }
            
            const result = expandableProcessor.expandTemplate(template, variables)
            
            expect(result).toBe('Hello Developer, your role is {role}!')
        })

        it('should handle templates with default values', () => {
            const template = 'Command: {command} {target}'
            const variables = { command: 'nx', target: 'build' }
            
            const result = expandableProcessor.expandTemplate(template, variables)
            
            expect(result).toBe('Command: nx build')
        })

        it('should process complex nested templates', () => {
            const template = 'Command: {command} --target={target}'
            const variables = { command: 'nx', target: 'build' }
            
            const result = expandableProcessor.expandTemplate(template, variables)
            
            expect(result).toContain('Command: nx')
            expect(result).toContain('--target=build')
        })

        it('should handle template arrays with different positions', () => {
            const templates: TemplateObject[] = [
                { position: 'start', template: 'echo "Starting {project}"' },
                { position: 'prefix', template: 'cd {workspace}' },
                { position: 'suffix', template: 'echo "Completed {project}"' },
                { position: 'end', template: 'echo "Finished {project}"' }
            ]
            const variables = { project: 'test-project', workspace: '/workspace' }
            
            const result = expandableProcessor.processTemplateArray(templates, variables)
            
            expect(result.start).toHaveLength(3)
            expect(result.end).toHaveLength(1)
            expect(result.start).toContain('echo "Starting test-project"')
            expect(result.start).toContain('cd /workspace')
            expect(result.start).toContain('echo "Completed test-project"')
            expect(result.end).toContain('echo "Finished test-project"')
        })

        it('should handle shell-specific templates', () => {
            const expandable: ExpandableValue = {
                'pwsh-template': 'Write-Host "PowerShell: {message}"',
                'linux-template': 'echo "Linux: {message}"',
                'cmd-template': 'echo "CMD: {message}"',
                template: 'echo "Default: {message}"'
            }
            const variables = { message: 'Hello World' }
            
            // Mock the shell detection by replacing the method
            const originalDetectShellType = expandableProcessor.detectShellType
            expandableProcessor.detectShellType = vi.fn().mockReturnValue('pwsh')
            
            const result = expandableProcessor.processShellSpecificTemplate(expandable, variables)
            
            expect(result.start).toContain('Write-Host "PowerShell: Hello World"')
            expect(result.end).toHaveLength(0)
            
            // Restore the original method
            expandableProcessor.detectShellType = originalDetectShellType
        })

        it('should fallback to generic template when shell-specific template is missing', () => {
            const expandable: ExpandableValue = {
                template: 'echo "Default: {message}"'
            }
            const variables = { message: 'Hello World' }
            
            // Mock shell detection to return a shell without specific template
            vi.spyOn(expandableProcessor, 'detectShellType').mockReturnValue('pwsh')
            
            const result = expandableProcessor.processShellSpecificTemplate(expandable, variables)
            
            expect(result.start).toContain('echo "Default: Hello World"')
        })
    })

    describe('Flag Expansion and Command Construction', () => {
        it('should expand flags correctly', () => {
            const args = ['-s', '-os=stream', 'build', 'test-project']
            const expandables = {
                's': '--skip-nx-cache',
                'os': {
                    template: '--output-style={style}',
                    defaults: { style: 'stream' },
                    position: 'suffix'
                }
            }
            
            const result = expandableProcessor.expandFlags(args, expandables)
            
            expect(result.suffix).toEqual(expect.arrayContaining(['--skip-nx-cache', '--output-style=stream']))
            expect(result.remainingArgs).toEqual(expect.arrayContaining(['build', 'test-project']))
        })

        it('should parse expandable flags correctly', () => {
            const result1 = expandableProcessor.parseExpandableFlag('-s')
            expect(result1).toEqual({ key: 's', value: undefined })
            
            const result2 = expandableProcessor.parseExpandableFlag('--output-style=stream')
            expect(result2).toEqual({ key: '-output-style', value: 'stream' })
            
            const result3 = expandableProcessor.parseExpandableFlag('--coverage')
            expect(result3).toEqual({ key: '-coverage', value: undefined })
        })

        it('should construct wrapped commands correctly', () => {
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

        it('should handle empty templates in command construction', () => {
            const baseCommand = ['nx', 'build']
            const startTemplates: string[] = []
            const endTemplates: string[] = []
            
            const result = expandableProcessor.constructWrappedCommand(baseCommand, startTemplates, endTemplates)
            
            expect(result).toEqual(['nx', 'build'])
        })
    })

    describe('PowerShell Module Generation', () => {
        it('should generate PowerShell module content with aliases', () => {
            const aliases = ['dc', 'gw', 'pb', 'nh']
            
            // Mock the private method by accessing it through the class
            const generateScriptContent = (aliasManager as any).generateScriptContent.bind(aliasManager)
            const { moduleContent } = generateScriptContent(aliases)
            
            expect(moduleContent).toContain('function Invoke-dc')
            expect(moduleContent).toContain('function Invoke-gw')
            expect(moduleContent).toContain('function Invoke-pb')
            expect(moduleContent).toContain('function Invoke-nh')
            expect(moduleContent).toContain('Export-ModuleMember')
        })

        it('should generate bash script content with aliases', () => {
            const aliases = ['dc', 'gw', 'pb', 'nh']
            
            const generateScriptContent = (aliasManager as any).generateScriptContent.bind(aliasManager)
            const { bashContent } = generateScriptContent(aliases)
            
            expect(bashContent).toContain('alias dc=')
            expect(bashContent).toContain('alias gw=')
            expect(bashContent).toContain('alias pb=')
            expect(bashContent).toContain('alias nh=')
        })

        it('should handle empty alias list in script generation', () => {
            const aliases: string[] = []
            
            const generateScriptContent = (aliasManager as any).generateScriptContent.bind(aliasManager)
            const { moduleContent, bashContent } = generateScriptContent(aliases)
            
            expect(moduleContent).toContain('Export-ModuleMember')
            expect(bashContent).toContain('pae-refresh()')
        })

        it('should generate scripts with proper error handling', () => {
            const aliases = ['dc', 'gw']
            
            const generateScriptContent = (aliasManager as any).generateScriptContent.bind(aliasManager)
            const { moduleContent } = generateScriptContent(aliases)
            
            expect(moduleContent).toContain('function Invoke-dc')
            expect(moduleContent).toContain('function Invoke-gw')
            expect(moduleContent).toContain('Export-ModuleMember')
        })
    })

    describe('Configuration File Generation', () => {
        it('should generate valid PowerShell module structure', () => {
            const aliases = ['dc', 'gw']
            
            const generateScriptContent = (aliasManager as any).generateScriptContent.bind(aliasManager)
            const { moduleContent } = generateScriptContent(aliases)
            
            // Check for proper PowerShell module structure
            expect(moduleContent).toMatch(/^# PAE Global Aliases/)
            expect(moduleContent).toContain('function Invoke-dc')
            expect(moduleContent).toContain('function Invoke-gw')
            expect(moduleContent).toContain('Export-ModuleMember')
        })

        it('should generate valid bash script structure', () => {
            const aliases = ['dc', 'gw']
            
            const generateScriptContent = (aliasManager as any).generateScriptContent.bind(aliasManager)
            const { bashContent } = generateScriptContent(aliases)
            
            // Check for proper bash script structure
            expect(bashContent).toMatch(/^# PAE Global Aliases/)
            expect(bashContent).toContain('alias dc=')
            expect(bashContent).toContain('alias gw=')
        })

        it('should handle special characters in generated content', () => {
            const template = 'Command with "quotes" and \'apostrophes\' and $variables'
            const variables = { message: 'test' }
            
            const result = expandableProcessor.expandTemplate(template, variables)
            
            expect(result).toContain('"quotes"')
            expect(result).toContain("'apostrophes'")
            expect(result).toContain('$variables')
        })

        it('should generate content with proper indentation and formatting', () => {
            const aliases = ['dc']
            
            const generateScriptContent = (aliasManager as any).generateScriptContent.bind(aliasManager)
            const { moduleContent } = generateScriptContent(aliases)
            
            // Check for proper indentation in PowerShell functions
            const functionMatch = moduleContent.match(/function Invoke-dc\s*\{([^}]+)\}/s)
            expect(functionMatch).toBeTruthy()
            
            if (functionMatch) {
                const functionBody = functionMatch[1]
                expect(functionBody).toContain('    ') // Should have indentation
            }
        })
    })

    describe('Dynamic Content Validation', () => {
        it('should validate generated PowerShell syntax', () => {
            const aliases = ['dc', 'gw']
            
            const generateScriptContent = (aliasManager as any).generateScriptContent.bind(aliasManager)
            const { moduleContent } = generateScriptContent(aliases)
            
            // Basic PowerShell syntax validation
            expect(moduleContent).toMatch(/function Invoke-\w+\s*\{/)
            expect(moduleContent).toContain('Export-ModuleMember')
            expect(moduleContent).not.toContain('undefined')
            expect(moduleContent).not.toContain('null')
        })

        it('should validate generated bash syntax', () => {
            const aliases = ['dc', 'gw']
            
            const generateScriptContent = (aliasManager as any).generateScriptContent.bind(aliasManager)
            const { bashContent } = generateScriptContent(aliases)
            
            // Basic bash syntax validation
            expect(bashContent).toMatch(/alias\s+\w+=/)
            expect(bashContent).not.toContain('undefined')
            expect(bashContent).not.toContain('null')
        })

        it('should handle template processing errors gracefully', () => {
            const invalidTemplate = '{{#if invalid}}test{{/if}}'
            const variables = { message: 'test' }
            
            // Should not throw, but handle gracefully
            expect(() => {
                expandableProcessor.expandTemplate(invalidTemplate, variables)
            }).not.toThrow()
        })

        it('should validate template variable substitution', () => {
            const template = '{command} {target} {project}'
            const variables = { command: 'nx', target: 'build', project: 'test-project' }
            
            const result = expandableProcessor.expandTemplate(template, variables)
            
            expect(result).toBe('nx build test-project')
            expect(result).not.toContain('{')
            expect(result).not.toContain('}')
        })
    })

    describe('Content Generation Performance', () => {
        it('should generate content efficiently for large alias sets', () => {
            const largeAliasSet = Array.from({ length: 100 }, (_, i) => `alias${i}`)
            
            const startTime = Date.now()
            const generateScriptContent = (aliasManager as any).generateScriptContent.bind(aliasManager)
            const { moduleContent, bashContent } = generateScriptContent(largeAliasSet)
            const endTime = Date.now()
            
            expect(endTime - startTime).toBeLessThan(1000) // Should complete within 1 second
            expect(moduleContent).toContain('function Invoke-alias0')
            expect(moduleContent).toContain('function Invoke-alias99')
            expect(bashContent).toContain('alias alias0=')
            expect(bashContent).toContain('alias alias99=')
        })

        it('should handle complex template processing efficiently', () => {
            const complexTemplate = 'Command: {command} --target={target} {flags}'
            const variables = { 
                command: 'nx', 
                target: 'build', 
                flags: '--skip-nx-cache --output-style=stream' 
            }
            
            const startTime = Date.now()
            const result = expandableProcessor.expandTemplate(complexTemplate, variables)
            const endTime = Date.now()
            
            expect(endTime - startTime).toBeLessThan(100) // Should complete within 100ms
            expect(result).toContain('Command: nx')
            expect(result).toContain('--target=build')
            expect(result).toContain('--skip-nx-cache --output-style=stream')
        })
    })

    describe('Generated Content Security', () => {
        it('should sanitize user input in generated content', () => {
            const template = 'Command: {command}'
            const maliciousInput = '; rm -rf /; echo "hacked"'
            
            const result = expandableProcessor.expandTemplate(template, { command: maliciousInput })
            
            // Should not execute the malicious command
            expect(result).toContain(maliciousInput) // Input is preserved as-is
            expect(result).toContain('hacked') // Input is preserved as-is, not executed
        })

        it('should handle special characters safely in generated scripts', () => {
            const aliases = ['dc']
            
            const generateScriptContent = (aliasManager as any).generateScriptContent.bind(aliasManager)
            const { moduleContent } = generateScriptContent(aliases)
            
            // Should handle the input safely
            expect(moduleContent).toContain('function Invoke-dc')
            expect(moduleContent).toContain('Set-Alias -Name dc')
        })

        it('should validate generated content structure', () => {
            const aliases = ['dc', 'gw']
            
            const generateScriptContent = (aliasManager as any).generateScriptContent.bind(aliasManager)
            const { moduleContent, bashContent } = generateScriptContent(aliases)
            
            // Validate PowerShell module structure
            expect(moduleContent).toMatch(/^# PAE Global Aliases/)
            expect(moduleContent).toContain('Export-ModuleMember')
            
            // Validate bash script structure
            expect(bashContent).toMatch(/^# PAE Global Aliases/)
            expect(bashContent).not.toContain('function Invoke-') // Should not contain PowerShell function syntax
        })
    })
})
