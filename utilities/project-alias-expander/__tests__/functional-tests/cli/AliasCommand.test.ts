import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setupLibTestEnvironment, resetLibMocks, type LibTestMocks } from '@fux/mock-strategy/lib'
import { AliasCommand } from '../../../src/commands/AliasCommand.js'
import type { AliasConfig } from '../../../src/_types/config.types.js'

// Mock the services that AliasCommand depends on
vi.mock('../../../src/services/CommandResolutionService.js', () => ({
    CommandResolutionService: vi.fn().mockImplementation(() => ({
        resolveCommand: vi.fn(),
    })),
}))

vi.mock('../../../src/services/PackageResolutionService.js', () => ({
    PackageResolutionService: vi.fn().mockImplementation(() => ({
        resolvePackage: vi.fn(),
    })),
}))

vi.mock('../../../src/services/TargetResolutionService.js', () => ({
    TargetResolutionService: vi.fn().mockImplementation(() => ({
        resolveTarget: vi.fn(),
    })),
}))

vi.mock('../../../src/services/ConfigurationValidator.js', () => ({
    ConfigurationValidator: vi.fn().mockImplementation(() => ({
        validate: vi.fn(),
    })),
}))

vi.mock('../../../src/services/index.js', () => ({
    commandExecution: {
        runCommand: vi.fn(),
    },
    expandableProcessor: {
        expandFlags: vi.fn(),
    },
}))

vi.mock('../../../src/commands/HelpCommand.js', () => ({
    HelpCommand: vi.fn().mockImplementation(() => ({
        execute: vi.fn(),
    })),
}))

describe('AliasCommand', () => {

    // SETUP ----------------->>
    let mocks: LibTestMocks
    let aliasCommand: AliasCommand
    let mockDebug: ReturnType<typeof vi.fn>
    let mockError: ReturnType<typeof vi.fn>
    let mockGetContextAwareFlags: ReturnType<typeof vi.fn>
    let mockCommandExecution: any
    let mockCommandResolver: any
    let mockPackageResolver: any
    let mockTargetResolver: any
    let mockConfigValidator: any
    let mockHelpCommand: any
    //----------------------------------------------------<<

    beforeEach(async () => {

        //>

        mocks = await setupLibTestEnvironment()
        await resetLibMocks(mocks)

        mockDebug = vi.fn()
        mockError = vi.fn()
        mockGetContextAwareFlags = vi.fn().mockReturnValue({})

        // Setup service mocks
        mockCommandExecution = {
            runCommand: vi.fn().mockResolvedValue(0),
        }
        mockCommandResolver = {
            resolveCommand: vi.fn(),
        }
        mockPackageResolver = {
            resolvePackage: vi.fn(),
        }
        mockTargetResolver = {
            resolveTarget: vi.fn().mockReturnValue('build'),
        }
        mockConfigValidator = {
            validate: vi.fn().mockReturnValue({ isValid: true, errors: [] }),
        }
        mockHelpCommand = {
            execute: vi.fn(),
        }

        // Mock the service constructors to return our mock instances
        const { CommandResolutionService } = await import(
            '../../../src/services/CommandResolutionService.js'
        )
        const { PackageResolutionService } = await import(
            '../../../src/services/PackageResolutionService.js'
        )
        const { TargetResolutionService } = await import(
            '../../../src/services/TargetResolutionService.js'
        )
        const { ConfigurationValidator } = await import(
            '../../../src/services/ConfigurationValidator.js'
        )
        const { HelpCommand } = await import('../../../src/commands/HelpCommand.js')
        const { commandExecution } = await import('../../../src/services/index.js')

        vi.mocked(CommandResolutionService).mockImplementation(() => mockCommandResolver)
        vi.mocked(PackageResolutionService).mockImplementation(() => mockPackageResolver)
        vi.mocked(TargetResolutionService).mockImplementation(() => mockTargetResolver)
        vi.mocked(ConfigurationValidator).mockImplementation(() => mockConfigValidator)
        vi.mocked(HelpCommand).mockImplementation(() => mockHelpCommand)
        vi.mocked(commandExecution).runCommand = mockCommandExecution.runCommand

        aliasCommand = new AliasCommand(mockDebug, mockError, mockGetContextAwareFlags)
    
    }) //<

    describe('Public Methods', () => {

        describe('execute', () => {

            it('should execute package alias resolution successfully', async () => {

                //>

                const config: AliasConfig = {
                    nxPackages: {
                        dc: 'dynamicons',
                        shared: 'libs/shared',
                    },
                    'expandable-commands': {},
                }
                const args = ['dc', 'build']

                // Setup mocks for successful package alias resolution
                mockCommandResolver.resolveCommand.mockReturnValue({
                    type: 'package',
                    command: 'dc',
                })
                mockPackageResolver.resolvePackage.mockReturnValue({
                    packageName: 'dynamicons',
                    alias: 'dc',
                    variant: undefined,
                    fullName: '@fux/dynamicons',
                })
                mockCommandExecution.runCommand.mockResolvedValue(0)

                const result = await aliasCommand.execute(args, config)

                expect(result).toBe(0)
                expect(mockDebug).toHaveBeenCalledWith('Processing alias command', {
                    alias: 'dc',
                    remainingArgs: ['build'],
                })
                expect(mockCommandResolver.resolveCommand).toHaveBeenCalledWith('dc', config)
                expect(mockPackageResolver.resolvePackage).toHaveBeenCalledWith('dc')
                expect(mockCommandExecution.runCommand).toHaveBeenCalled()
            
            }) //<

            it('should execute expandable command resolution successfully', async () => {

                //>

                const config: AliasConfig = {
                    nxPackages: {},
                    'expandable-commands': {
                        'test-all': 'nx run-many --target=test --all',
                    },
                }
                const args = ['test-all']

                // Setup mocks for successful expandable command resolution
                mockCommandResolver.resolveCommand.mockReturnValue({
                    type: 'expandable',
                    command: 'test-all',
                    execution: 'nx run-many --target=test --all',
                })
                mockCommandExecution.runCommand.mockResolvedValue(0)

                const result = await aliasCommand.execute(args, config)

                expect(result).toBe(0)
                expect(mockDebug).toHaveBeenCalledWith('Processing alias command', {
                    alias: 'test-all',
                    remainingArgs: [],
                })
                expect(mockCommandResolver.resolveCommand).toHaveBeenCalledWith('test-all', config)
                expect(mockCommandExecution.runCommand).toHaveBeenCalledWith(
                    'nx run-many --target=test --all',
                    [],
                    undefined
                )
            
            }) //<

            it('should execute reserved command resolution successfully', async () => {

                //>

                const config: AliasConfig = {
                    nxPackages: {},
                    'expandable-commands': {},
                }
                const args = ['help']

                // Setup mocks for successful reserved command resolution
                mockCommandResolver.resolveCommand.mockReturnValue({
                    type: 'reserved',
                    command: 'help',
                })

                const result = await aliasCommand.execute(args, config)

                expect(result).toBe(0)
                expect(mockDebug).toHaveBeenCalledWith('Processing alias command', {
                    alias: 'help',
                    remainingArgs: [],
                })
                expect(mockCommandResolver.resolveCommand).toHaveBeenCalledWith('help', config)
                expect(mockHelpCommand.execute).toHaveBeenCalled()
            
            }) //<

            it('should handle invalid alias with error message', async () => {

                //>

                const config: AliasConfig = {
                    nxPackages: {},
                    'expandable-commands': {},
                }
                const args = ['invalid-alias']

                // Setup mocks for invalid alias scenario
                mockCommandResolver.resolveCommand.mockReturnValue({
                    type: 'package',
                    command: 'invalid-alias',
                })
                mockPackageResolver.resolvePackage.mockImplementation(() => {

                    throw new Error('Unknown alias: invalid-alias')
                
                })

                const result = await aliasCommand.execute(args, config)

                expect(result).toBe(1)
                expect(mockError).toHaveBeenCalledWith(
                    'Error handling package alias:',
                    expect.any(Error)
                )
                expect(mockCommandResolver.resolveCommand).toHaveBeenCalledWith(
                    'invalid-alias',
                    config
                )
                expect(mockPackageResolver.resolvePackage).toHaveBeenCalledWith('invalid-alias')
            
            }) //<

            it('should handle configuration validation errors', async () => {

                //>

                const invalidConfig = {} as AliasConfig
                const args = ['dc']

                // Setup mocks for configuration validation error
                mockConfigValidator.validate.mockReturnValue({
                    isValid: false,
                    errors: ['Missing required configuration'],
                })

                const result = await aliasCommand.execute(args, invalidConfig)

                expect(result).toBe(1)
                expect(mockError).toHaveBeenCalledWith('Configuration validation failed:')
                expect(mockError).toHaveBeenCalledWith('  - Missing required configuration')
                expect(mockConfigValidator.validate).toHaveBeenCalledWith(invalidConfig)
            
            }) //<

            it('should handle execution errors gracefully', async () => {

                //>

                const config: AliasConfig = {
                    nxPackages: {
                        dc: 'dynamicons',
                    },
                    'expandable-commands': {},
                }
                const args = ['dc', 'build']

                // Setup mocks for execution error scenario
                mockCommandResolver.resolveCommand.mockReturnValue({
                    type: 'package',
                    command: 'dc',
                })
                mockPackageResolver.resolvePackage.mockReturnValue({
                    packageName: 'dynamicons',
                    alias: 'dc',
                    variant: undefined,
                    fullName: '@fux/dynamicons',
                })
                mockCommandExecution.runCommand.mockRejectedValue(
                    new Error('Command execution failed')
                )

                const result = await aliasCommand.execute(args, config)

                expect(result).toBe(1)
                expect(mockError).toHaveBeenCalledWith(
                    'Error handling package alias:',
                    expect.any(Error)
                )
                expect(mockCommandExecution.runCommand).toHaveBeenCalled()
            
            }) //<
        
        })
    
    })

    describe('Configuration', () => {

        it('should handle valid configuration with nxPackages', async () => {

            //>

            const config: AliasConfig = {
                nxPackages: {
                    dc: 'dynamicons',
                    shared: 'libs/shared',
                    mockly: 'libs/mock-strategy',
                },
                'expandable-commands': {},
            }
            const args = ['dc', 'build', '--verbose']

            // Setup mocks for successful execution
            mockCommandResolver.resolveCommand.mockReturnValue({
                type: 'package',
                command: 'dc',
            })
            mockPackageResolver.resolvePackage.mockReturnValue({
                packageName: 'dynamicons',
                alias: 'dc',
                variant: undefined,
                fullName: '@fux/dynamicons',
            })
            mockCommandExecution.runCommand.mockResolvedValue(0)

            const result = await aliasCommand.execute(args, config)

            expect(result).toBe(0)
            expect(mockCommandResolver.resolveCommand).toHaveBeenCalledWith('dc', config)
            expect(mockPackageResolver.resolvePackage).toHaveBeenCalledWith('dc')
        
        }) //<

        it('should handle configuration with expandable commands', async () => {

            //>

            const config: AliasConfig = {
                nxPackages: {},
                'expandable-commands': {
                    'test-all': 'nx run-many --target=test --all',
                    'build-all': 'nx run-many --target=build --all',
                },
            }
            const args = ['test-all']

            // Setup mocks for expandable command execution
            mockCommandResolver.resolveCommand.mockReturnValue({
                type: 'expandable',
                command: 'test-all',
                execution: 'nx run-many --target=test --all',
            })
            mockCommandExecution.runCommand.mockResolvedValue(0)

            const result = await aliasCommand.execute(args, config)

            expect(result).toBe(0)
            expect(mockCommandResolver.resolveCommand).toHaveBeenCalledWith('test-all', config)
            expect(mockCommandExecution.runCommand).toHaveBeenCalledWith(
                'nx run-many --target=test --all',
                [],
                undefined
            )
        
        }) //<

        it('should handle configuration with targets', async () => {

            //>

            const config: AliasConfig = {
                nxPackages: {
                    dynamicons: 'dynamicons',
                },
                'expandable-commands': {},
                targets: {
                    'nx-targets': {
                        build: 'nx build {package}',
                        test: 'nx test {package}',
                    },
                },
            }
            const args = ['dynamicons', 'build']

            // Setup mocks for target resolution
            mockCommandResolver.resolveCommand.mockReturnValue({
                type: 'package',
                command: 'dynamicons',
            })
            mockPackageResolver.resolvePackage.mockReturnValue({
                packageName: 'dynamicons',
                alias: 'dynamicons',
                variant: undefined,
                fullName: '@fux/dynamicons',
            })
            mockTargetResolver.resolveTarget.mockReturnValue('nx build {package}')
            mockCommandExecution.runCommand.mockResolvedValue(0)

            const result = await aliasCommand.execute(args, config)

            expect(result).toBe(0)
            expect(mockCommandResolver.resolveCommand).toHaveBeenCalledWith('dynamicons', config)
            expect(mockPackageResolver.resolvePackage).toHaveBeenCalledWith('dynamicons')
            expect(mockTargetResolver.resolveTarget).toHaveBeenCalledWith('build', config)
        
        }) //<
    
    })

    describe('Error Handling', () => {

        it('should handle empty arguments array', async () => {

            //>

            const config: AliasConfig = {
                nxPackages: {},
                'expandable-commands': {},
            }
            const args: string[] = []

            // Setup mocks for empty arguments scenario
            mockCommandResolver.resolveCommand.mockReturnValue({
                type: 'package',
                command: undefined,
            })
            mockPackageResolver.resolvePackage.mockImplementation(() => {

                throw new Error('Unknown alias: undefined')
            
            })

            const result = await aliasCommand.execute(args, config)

            expect(result).toBe(1)
            expect(mockError).toHaveBeenCalledWith(
                'Error handling package alias:',
                expect.any(Error)
            )
            expect(mockCommandResolver.resolveCommand).toHaveBeenCalledWith(undefined, config)
        
        }) //<

        it('should handle null configuration', async () => {

            //>

            const config = null as any
            const args = ['dc']

            // Setup mocks for null configuration scenario
            mockConfigValidator.validate.mockImplementation(() => {

                throw new Error('Cannot read properties of null')
            
            })

            const result = await aliasCommand.execute(args, config)

            expect(result).toBe(1)
            expect(mockError).toHaveBeenCalledWith(
                'Error handling alias command:',
                expect.any(Error)
            )
        
        }) //<

        it('should handle malformed configuration', async () => {

            //>

            const config = {
                nxPackages: 'invalid-type',
            } as any
            const args = ['dc']

            // Setup mocks for malformed configuration scenario
            mockConfigValidator.validate.mockReturnValue({
                isValid: false,
                errors: ['nxPackages must be an object'],
            })

            const result = await aliasCommand.execute(args, config)

            expect(result).toBe(1)
            expect(mockError).toHaveBeenCalledWith('Configuration validation failed:')
            expect(mockError).toHaveBeenCalledWith('  - nxPackages must be an object')
            expect(mockConfigValidator.validate).toHaveBeenCalledWith(config)
        
        }) //<
    
    })

    describe('Edge Cases', () => {

        it('should handle alias with special characters', async () => {

            //>

            const config: AliasConfig = {
                nxPackages: {
                    'test-package': 'libs/test-package',
                },
                'expandable-commands': {},
            }
            const args = ['test-package', 'build']

            // Setup mocks for special character alias
            mockCommandResolver.resolveCommand.mockReturnValue({
                type: 'package',
                command: 'test-package',
            })
            mockPackageResolver.resolvePackage.mockReturnValue({
                packageName: 'libs/test-package',
                alias: 'test-package',
                variant: undefined,
                fullName: 'libs/test-package',
            })
            mockCommandExecution.runCommand.mockResolvedValue(0)

            const result = await aliasCommand.execute(args, config)

            expect(result).toBe(0)
            expect(mockCommandResolver.resolveCommand).toHaveBeenCalledWith('test-package', config)
            expect(mockPackageResolver.resolvePackage).toHaveBeenCalledWith('test-package')
        
        }) //<

        it('should handle alias with numeric characters', async () => {

            //>

            const config: AliasConfig = {
                nxPackages: {
                    pkg123: 'libs/package-123',
                },
                'expandable-commands': {},
            }
            const args = ['pkg123', 'test']

            // Setup mocks for numeric character alias
            mockCommandResolver.resolveCommand.mockReturnValue({
                type: 'package',
                command: 'pkg123',
            })
            mockPackageResolver.resolvePackage.mockReturnValue({
                packageName: 'libs/package-123',
                alias: 'pkg123',
                variant: undefined,
                fullName: 'libs/package-123',
            })
            mockCommandExecution.runCommand.mockResolvedValue(0)

            const result = await aliasCommand.execute(args, config)

            expect(result).toBe(0)
            expect(mockCommandResolver.resolveCommand).toHaveBeenCalledWith('pkg123', config)
            expect(mockPackageResolver.resolvePackage).toHaveBeenCalledWith('pkg123')
        
        }) //<

        it('should handle very long alias names', async () => {

            //>

            const longAlias = 'very-long-package-name-that-exceeds-normal-length'
            const config: AliasConfig = {
                nxPackages: {
                    [longAlias]: 'libs/very-long-package',
                },
                'expandable-commands': {},
            }
            const args = [longAlias, 'build']

            // Setup mocks for long alias
            mockCommandResolver.resolveCommand.mockReturnValue({
                type: 'package',
                command: longAlias,
            })
            mockPackageResolver.resolvePackage.mockReturnValue({
                packageName: 'libs/very-long-package',
                alias: longAlias,
                variant: undefined,
                fullName: 'libs/very-long-package',
            })
            mockCommandExecution.runCommand.mockResolvedValue(0)

            const result = await aliasCommand.execute(args, config)

            expect(result).toBe(0)
            expect(mockCommandResolver.resolveCommand).toHaveBeenCalledWith(longAlias, config)
            expect(mockPackageResolver.resolvePackage).toHaveBeenCalledWith(longAlias)
        
        }) //<

        it('should handle multiple arguments correctly', async () => {

            //>

            const config: AliasConfig = {
                nxPackages: {
                    dc: 'dynamicons',
                },
                'expandable-commands': {},
            }
            const args = ['dc', 'build', '--verbose', '--skip-nx-cache']

            // Setup mocks for multiple arguments
            mockCommandResolver.resolveCommand.mockReturnValue({
                type: 'package',
                command: 'dc',
            })
            mockPackageResolver.resolvePackage.mockReturnValue({
                packageName: 'dynamicons',
                alias: 'dc',
                variant: undefined,
                fullName: '@fux/dynamicons',
            })
            mockCommandExecution.runCommand.mockResolvedValue(0)

            const result = await aliasCommand.execute(args, config)

            expect(result).toBe(0)
            expect(mockDebug).toHaveBeenCalledWith('Processing alias command', {
                alias: 'dc',
                remainingArgs: ['build', '--verbose', '--skip-nx-cache'],
            })
            expect(mockCommandResolver.resolveCommand).toHaveBeenCalledWith('dc', config)
            expect(mockPackageResolver.resolvePackage).toHaveBeenCalledWith('dc')
        
        }) //<
    
    })

    describe('Service Integration', () => {

        it('should integrate with CommandResolutionService', async () => {

            //>

            const config: AliasConfig = {
                nxPackages: {
                    dc: 'dynamicons',
                },
                'expandable-commands': {},
            }
            const args = ['dc', 'build']

            // Setup mocks for command resolution integration
            mockCommandResolver.resolveCommand.mockReturnValue({
                type: 'package',
                command: 'dc',
            })
            mockPackageResolver.resolvePackage.mockReturnValue({
                packageName: 'dynamicons',
                alias: 'dc',
                variant: undefined,
                fullName: '@fux/dynamicons',
            })
            mockCommandExecution.runCommand.mockResolvedValue(0)

            const result = await aliasCommand.execute(args, config)

            expect(result).toBe(0)
            expect(mockCommandResolver.resolveCommand).toHaveBeenCalledWith('dc', config)
            expect(mockCommandResolver.resolveCommand).toHaveBeenCalledTimes(1)
        
        }) //<

        it('should integrate with PackageResolutionService', async () => {

            //>

            const config: AliasConfig = {
                nxPackages: {
                    dc: 'dynamicons',
                },
                'expandable-commands': {},
            }
            const args = ['dc', 'test']

            // Setup mocks for package resolution integration
            mockCommandResolver.resolveCommand.mockReturnValue({
                type: 'package',
                command: 'dc',
            })
            mockPackageResolver.resolvePackage.mockReturnValue({
                packageName: 'dynamicons',
                alias: 'dc',
                variant: undefined,
                fullName: '@fux/dynamicons',
            })
            mockCommandExecution.runCommand.mockResolvedValue(0)

            const result = await aliasCommand.execute(args, config)

            expect(result).toBe(0)
            expect(mockPackageResolver.resolvePackage).toHaveBeenCalledWith('dc')
            expect(mockPackageResolver.resolvePackage).toHaveBeenCalledTimes(1)
        
        }) //<

        it('should integrate with TargetResolutionService', async () => {

            //>

            const config: AliasConfig = {
                nxPackages: {
                    dc: 'dynamicons',
                },
                'expandable-commands': {},
            }
            const args = ['dc', 'build']

            // Setup mocks for target resolution integration
            mockCommandResolver.resolveCommand.mockReturnValue({
                type: 'package',
                command: 'dc',
            })
            mockPackageResolver.resolvePackage.mockReturnValue({
                packageName: 'dynamicons',
                alias: 'dc',
                variant: undefined,
                fullName: '@fux/dynamicons',
            })
            mockTargetResolver.resolveTarget.mockReturnValue('build')
            mockCommandExecution.runCommand.mockResolvedValue(0)

            const result = await aliasCommand.execute(args, config)

            expect(result).toBe(0)
            expect(mockTargetResolver.resolveTarget).toHaveBeenCalledWith('build', config)
            expect(mockTargetResolver.resolveTarget).toHaveBeenCalledTimes(1)
        
        }) //<

        it('should integrate with ConfigurationValidator', async () => {

            //>

            const config: AliasConfig = {
                nxPackages: {},
                'expandable-commands': {},
            }
            const args = ['help']

            // Setup mocks for configuration validation integration
            mockCommandResolver.resolveCommand.mockReturnValue({
                type: 'reserved',
                command: 'help',
            })

            const result = await aliasCommand.execute(args, config)

            expect(result).toBe(0)
            expect(mockConfigValidator.validate).toHaveBeenCalledWith(config)
            expect(mockConfigValidator.validate).toHaveBeenCalledTimes(1)
        
        }) //<
    
    })

    describe('Command Types', () => {

        it('should handle package aliases', async () => {

            //>

            const config: AliasConfig = {
                nxPackages: {
                    dc: 'dynamicons',
                    shared: 'libs/shared',
                },
                'expandable-commands': {},
            }
            const args = ['dc', 'build']

            // Setup mocks for package alias
            mockCommandResolver.resolveCommand.mockReturnValue({
                type: 'package',
                command: 'dc',
            })
            mockPackageResolver.resolvePackage.mockReturnValue({
                packageName: 'dynamicons',
                alias: 'dc',
                variant: undefined,
                fullName: '@fux/dynamicons',
            })
            mockCommandExecution.runCommand.mockResolvedValue(0)

            const result = await aliasCommand.execute(args, config)

            expect(result).toBe(0)
            expect(mockCommandResolver.resolveCommand).toHaveBeenCalledWith('dc', config)
            expect(mockPackageResolver.resolvePackage).toHaveBeenCalledWith('dc')
        
        }) //<

        it('should handle expandable commands', async () => {

            //>

            const config: AliasConfig = {
                nxPackages: {},
                'expandable-commands': {
                    'test-all': 'nx run-many --target=test --all',
                },
            }
            const args = ['test-all']

            // Setup mocks for expandable command
            mockCommandResolver.resolveCommand.mockReturnValue({
                type: 'expandable',
                command: 'test-all',
                execution: 'nx run-many --target=test --all',
            })
            mockCommandExecution.runCommand.mockResolvedValue(0)

            const result = await aliasCommand.execute(args, config)

            expect(result).toBe(0)
            expect(mockCommandResolver.resolveCommand).toHaveBeenCalledWith('test-all', config)
            expect(mockCommandExecution.runCommand).toHaveBeenCalledWith(
                'nx run-many --target=test --all',
                [],
                undefined
            )
        
        }) //<

        it('should handle reserved commands', async () => {

            //>

            const config: AliasConfig = {
                nxPackages: {},
                'expandable-commands': {},
            }
            const args = ['help']

            // Setup mocks for reserved command
            mockCommandResolver.resolveCommand.mockReturnValue({
                type: 'reserved',
                command: 'help',
            })

            const result = await aliasCommand.execute(args, config)

            expect(result).toBe(0)
            expect(mockCommandResolver.resolveCommand).toHaveBeenCalledWith('help', config)
            expect(mockHelpCommand.execute).toHaveBeenCalled()
        
        }) //<

        it('should handle nx target resolution', async () => {

            //>

            const config: AliasConfig = {
                nxPackages: {
                    dc: 'dynamicons',
                },
                'expandable-commands': {},
                targets: {
                    'nx-targets': {
                        build: 'nx build {package}',
                        test: 'nx test {package}',
                    },
                },
            }
            const args = ['dc', 'build']

            // Setup mocks for nx target resolution
            mockCommandResolver.resolveCommand.mockReturnValue({
                type: 'package',
                command: 'dc',
            })
            mockPackageResolver.resolvePackage.mockReturnValue({
                packageName: 'dynamicons',
                alias: 'dc',
                variant: undefined,
                fullName: '@fux/dynamicons',
            })
            mockTargetResolver.resolveTarget.mockReturnValue('nx build {package}')
            mockCommandExecution.runCommand.mockResolvedValue(0)

            const result = await aliasCommand.execute(args, config)

            expect(result).toBe(0)
            expect(mockCommandResolver.resolveCommand).toHaveBeenCalledWith('dc', config)
            expect(mockPackageResolver.resolvePackage).toHaveBeenCalledWith('dc')
            expect(mockTargetResolver.resolveTarget).toHaveBeenCalledWith('build', config)
        
        }) //<

        it('should handle non-nx target resolution', async () => {

            //>

            const config: AliasConfig = {
                nxPackages: {
                    tool: 'libs/tools/some-tool',
                },
                'expandable-commands': {},
                targets: {
                    'not-nx-target': {
                        run: 'node {package}/dist/index.js',
                    },
                },
            }
            const args = ['tool', 'run']

            // Setup mocks for non-nx target resolution
            mockCommandResolver.resolveCommand.mockReturnValue({
                type: 'package',
                command: 'tool',
            })
            mockPackageResolver.resolvePackage.mockReturnValue({
                packageName: 'libs/tools/some-tool',
                alias: 'tool',
                variant: undefined,
                fullName: 'libs/tools/some-tool',
            })
            mockTargetResolver.resolveTarget.mockReturnValue('node {package}/dist/index.js')
            mockCommandExecution.runCommand.mockResolvedValue(0)

            const result = await aliasCommand.execute(args, config)

            expect(result).toBe(0)
            expect(mockCommandResolver.resolveCommand).toHaveBeenCalledWith('tool', config)
            expect(mockPackageResolver.resolvePackage).toHaveBeenCalledWith('tool')
            expect(mockTargetResolver.resolveTarget).toHaveBeenCalledWith('run', config)
        
        }) //<
    
    })

})
