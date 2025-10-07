import { describe, it, expect, beforeEach } from 'vitest'
import {
    CommandResolutionService,
    type CommandResolution,
} from '../../../src/services/CommandResolutionService.js'
import type { AliasConfig } from '../../../src/_types/config.types.js'
import { setupPaeTestEnvironment, resetPaeMocks } from '../../__mocks__/helpers.js'

describe('CommandResolutionService', () => {

    // SETUP ----------------->>
    let mocks: Awaited<ReturnType<typeof setupPaeTestEnvironment>>
    let service: CommandResolutionService
    let mockConfig: AliasConfig

    beforeEach(async () => {

        //>

        mocks = await setupPaeTestEnvironment()
        await resetPaeMocks(mocks)

        service = new CommandResolutionService()

        mockConfig = {
            'expandable-commands': {
                build: 'nx build @fux/project-alias-expander -s',
                test: 'nx test @fux/project-alias-expander',
                hello: 'echo "Hello World"',
            },
            nxPackages: {
                dc: 'dynamicons',
                pb: 'project-butler',
            },
        }
    
    }) //<

    //----------------------------------------------------<<

    describe('constructor', () => {

        it('should initialize with required dependencies', () => {

            //>

            const newService = new CommandResolutionService()

            expect(newService).toBeInstanceOf(CommandResolutionService)
            expect(newService).toBeDefined()
        
        }) //<
    
    })

    describe('resolveCommand function', () => {

        it('should resolve reserved commands', () => {

            //>

            const reservedCommands = ['install', 'remove', 'refresh', 'help', 'load']

            reservedCommands.forEach((command) => {

                const result = service.resolveCommand(command, mockConfig)

                expect(result).toEqual({
                    type: 'reserved',
                    command,
                })
            
            })
        
        }) //<
        it('should resolve expandable commands', () => {

            //>

            const result = service.resolveCommand('build', mockConfig)

            expect(result).toEqual({
                type: 'expandable',
                command: 'build',
                execution: 'nx build @fux/project-alias-expander -s',
            })
        
        }) //<
        it('should resolve package commands', () => {

            //>

            const result = service.resolveCommand('dc', mockConfig)

            expect(result).toEqual({
                type: 'package',
                command: 'dc',
            })
        
        }) //<
        it('should handle unknown commands', () => {

            //>

            const result = service.resolveCommand('unknown-command', mockConfig)

            expect(result).toEqual({
                type: 'package',
                command: 'unknown-command',
            })
        
        }) //<
        it('should prioritize reserved commands over expandable commands', () => {

            //>

            const configWithReservedConflict: AliasConfig = {
                'expandable-commands': {
                    help: 'echo "Custom help"',
                },
                nxPackages: {},
            }

            const result = service.resolveCommand('help', configWithReservedConflict)

            expect(result).toEqual({
                type: 'reserved',
                command: 'help',
            })
        
        }) //<
        it('should handle empty expandable commands', () => {

            //>

            const emptyConfig: AliasConfig = {
                'expandable-commands': {},
                nxPackages: {},
            }

            const result = service.resolveCommand('build', emptyConfig)

            expect(result).toEqual({
                type: 'package',
                command: 'build',
            })
        
        }) //<
        it('should handle undefined expandable commands', () => {

            //>

            const undefinedConfig: AliasConfig = {
                nxPackages: {},
            }

            const result = service.resolveCommand('build', undefinedConfig)

            expect(result).toEqual({
                type: 'package',
                command: 'build',
            })
        
        }) //<
        it('should handle null expandable commands', () => {

            //>

            const nullConfig: AliasConfig = {
                'expandable-commands': null as any,
                nxPackages: {},
            }

            const result = service.resolveCommand('build', nullConfig)

            expect(result).toEqual({
                type: 'package',
                command: 'build',
            })
        
        }) //<
    
    })

    describe('validateExpandableCommands function', () => {

        it('should validate valid expandable commands', () => {

            //>

            const validConfig: AliasConfig = {
                'expandable-commands': {
                    build: 'nx build @fux/project-alias-expander',
                    test: 'nx test @fux/project-alias-expander',
                    custom: 'echo "Custom command"',
                },
                nxPackages: {},
            }

            const errors = service.validateExpandableCommands(validConfig)

            expect(errors).toEqual([])
        
        }) //<
        it('should detect reserved command conflicts', () => {

            //>

            const conflictConfig: AliasConfig = {
                'expandable-commands': {
                    help: 'echo "Custom help"',
                    install: 'echo "Custom install"',
                    build: 'nx build @fux/project-alias-expander',
                },
                nxPackages: {},
            }

            const errors = service.validateExpandableCommands(conflictConfig)

            expect(errors).toHaveLength(1)
            expect(errors[0]).toContain('Reserved commands cannot be used as expandable commands')
            expect(errors[0]).toContain('help, install')
        
        }) //<
        it('should handle empty expandable commands', () => {

            //>

            const emptyConfig: AliasConfig = {
                'expandable-commands': {},
                nxPackages: {},
            }

            const errors = service.validateExpandableCommands(emptyConfig)

            expect(errors).toEqual([])
        
        }) //<
        it('should handle undefined expandable commands', () => {

            //>

            const undefinedConfig: AliasConfig = {
                nxPackages: {},
            }

            const errors = service.validateExpandableCommands(undefinedConfig)

            expect(errors).toEqual([])
        
        }) //<
        it('should handle null expandable commands', () => {

            //>

            const nullConfig: AliasConfig = {
                'expandable-commands': null as any,
                nxPackages: {},
            }

            const errors = service.validateExpandableCommands(nullConfig)

            expect(errors).toEqual([])
        
        }) //<
        it('should detect all reserved command conflicts', () => {

            //>

            const allReservedConfig: AliasConfig = {
                'expandable-commands': {
                    install: 'echo "install"',
                    remove: 'echo "remove"',
                    refresh: 'echo "refresh"',
                    help: 'echo "help"',
                    load: 'echo "load"',
                },
                nxPackages: {},
            }

            const errors = service.validateExpandableCommands(allReservedConfig)

            expect(errors).toHaveLength(1)
            expect(errors[0]).toContain('install, remove, refresh, help, load')
        
        }) //<
        it('should handle mixed valid and invalid commands', () => {

            //>

            const mixedConfig: AliasConfig = {
                'expandable-commands': {
                    build: 'nx build @fux/project-alias-expander',
                    help: 'echo "Custom help"',
                    test: 'nx test @fux/project-alias-expander',
                    install: 'echo "Custom install"',
                },
                nxPackages: {},
            }

            const errors = service.validateExpandableCommands(mixedConfig)

            expect(errors).toHaveLength(1)
            expect(errors[0]).toContain('help, install')
        
        }) //<
    
    })

    describe('private isReservedCommand function', () => {

        it('should identify all reserved commands', () => {

            //>

            const reservedCommands = ['install', 'remove', 'refresh', 'help', 'load']

            reservedCommands.forEach((command) => {

                // Access private method through resolveCommand behavior
                const result = service.resolveCommand(command, mockConfig)
                expect(result.type).toBe('reserved')
            
            })
        
        }) //<
        it('should reject non-reserved commands', () => {

            //>

            const nonReservedCommands = ['build', 'test', 'custom', 'unknown']

            nonReservedCommands.forEach((command) => {

                // Access private method through resolveCommand behavior
                const result = service.resolveCommand(command, mockConfig)
                expect(result.type).not.toBe('reserved')
            
            })
        
        }) //<
        it('should handle case sensitivity', () => {

            //>

            const caseVariations = ['HELP', 'Help', 'hElP', 'Install', 'INSTALL']

            caseVariations.forEach((command) => {

                // Access private method through resolveCommand behavior
                const result = service.resolveCommand(command, mockConfig)
                expect(result.type).toBe('package') // Should not match reserved commands
            
            })
        
        }) //<
        it('should handle empty string', () => {

            //>

            const result = service.resolveCommand('', mockConfig)
            expect(result.type).toBe('package')
        
        }) //<
        it('should handle whitespace', () => {

            //>

            const result = service.resolveCommand(' help ', mockConfig)
            expect(result.type).toBe('package')
        
        }) //<
    
    })

    describe('edge cases and error handling', () => {

        it('should handleq malformed config objects', () => {

            //>

            const malformedConfig = {
                'expandable-commands': {
                    valid: 'echo "valid"',
                    invalid: null,
                    empty: '',
                    undefined: undefined,
                },
            } as any

            const errors = service.validateExpandableCommands(malformedConfig)
            expect(errors).toEqual([])
        
        }) //<
        it('should handle very long command names', () => {

            //>

            const longCommand = 'a'.repeat(1000)
            const result = service.resolveCommand(longCommand, mockConfig)

            expect(result).toEqual({
                type: 'package',
                command: longCommand,
            })
        
        }) //<
        it('should handle special characters in command names', () => {

            //>

            const specialCommands = ['test-command', 'test_command', 'test.command', 'test@command']

            specialCommands.forEach((command) => {

                const result = service.resolveCommand(command, mockConfig)
                expect(result.type).toBe('package')
            
            })
        
        }) //<
        it('should handle numeric command names', () => {

            //>

            const numericCommands = ['123', '0', '999']

            numericCommands.forEach((command) => {

                const result = service.resolveCommand(command, mockConfig)
                expect(result.type).toBe('package')
            
            })
        
        }) //<
        it('should handle unicode command names', () => {

            //>

            const unicodeCommands = ['测试', 'тест', 'テスト', '🎯']

            unicodeCommands.forEach((command) => {

                const result = service.resolveCommand(command, mockConfig)
                expect(result.type).toBe('package')
            
            })
        
        }) //<
    
    })

    describe('integration scenarios', () => {

        it('should handle complex real-world configuration', () => {

            //>

            const complexConfig: AliasConfig = {
                'expandable-commands': {
                    build: 'nx build @fux/project-alias-expander -s',
                    test: 'nx test @fux/project-alias-expander --coverage',
                    lint: 'nx lint @fux/project-alias-expander --fix',
                    'custom-build':
                        'nx build @fux/project-alias-expander --configuration=production',
                },
                nxPackages: {
                    dc: 'dynamicons',
                    pb: 'project-butler',
                    gw: 'ghost-writer',
                    nh: 'note-hub',
                },
            }

            // Test reserved command resolution
            const reservedResult = service.resolveCommand('help', complexConfig)
            expect(reservedResult.type).toBe('reserved')

            // Test expandable command resolution
            const expandableResult = service.resolveCommand('build', complexConfig)
            expect(expandableResult.type).toBe('expandable')
            expect(expandableResult.execution).toBe('nx build @fux/project-alias-expander -s')

            // Test package command resolution
            const packageResult = service.resolveCommand('dc', complexConfig)
            expect(packageResult.type).toBe('package')

            // Test validation
            const errors = service.validateExpandableCommands(complexConfig)
            expect(errors).toEqual([])
        
        }) //<
        it('should handle configuration with conflicts', () => {

            //>

            const conflictConfig: AliasConfig = {
                'expandable-commands': {
                    help: 'echo "Custom help"',
                    install: 'echo "Custom install"',
                    build: 'nx build @fux/project-alias-expander',
                    test: 'nx test @fux/project-alias-expander',
                },
                nxPackages: {},
            }

            const errors = service.validateExpandableCommands(conflictConfig)
            expect(errors).toHaveLength(1)
            expect(errors[0]).toContain('help, install')

            // Reserved commands should still be resolved as reserved
            const helpResult = service.resolveCommand('help', conflictConfig)
            expect(helpResult.type).toBe('reserved')
        
        }) //<
    
    })

})
