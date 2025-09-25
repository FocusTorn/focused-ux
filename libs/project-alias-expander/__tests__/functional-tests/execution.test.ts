import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setupPaeTestEnvironment, resetPaeMocks } from '../__mocks__/helpers'
import { createPaeMockBuilder } from '../__mocks__/mock-scenario-builder'
import { runNx, runMany, installAliases } from '../../src/cli'

describe('PAE CLI Execution Functions', () => {
    let mocks: ReturnType<typeof setupPaeTestEnvironment>

    beforeEach(() => {
        mocks = setupPaeTestEnvironment()
        resetPaeMocks(mocks)
    })

    describe('runNx', () => {
        it('should execute nx command successfully', () => {
            // Arrange
            const argv = ['build', '@fux/project-butler-core']
            
            createPaeMockBuilder(mocks)
                .commandSuccess({
                    command: 'nx',
                    args: argv,
                    exitCode: 0,
                    stdout: 'Build successful'
                })
                .build()

            // Act
            const result = runNx(argv)

            // Assert
            expect(result).toBe(0)
            expect(mocks.childProcess.spawnSync).toHaveBeenCalledWith('nx', argv, expect.any(Object))
        })

        it('should handle nx command failure', () => {
            // Arrange
            const argv = ['build', '@fux/project-butler-core']
            
            createPaeMockBuilder(mocks)
                .commandFailure({
                    command: 'nx',
                    args: argv,
                    exitCode: 1,
                    stderr: 'Build failed'
                })
                .build()

            // Act
            const result = runNx(argv)

            // Assert
            expect(result).toBe(1)
        })

        it('should handle echo mode', () => {
            // Arrange
            const argv = ['build', '@fux/project-butler-core']
            const originalEcho = process.env.PAE_ECHO
            process.env.PAE_ECHO = '1'

            // Act
            const result = runNx(argv)

            // Assert
            expect(result).toBe(0)
            
            // Cleanup
            if (originalEcho === undefined) {
                delete process.env.PAE_ECHO
            } else {
                process.env.PAE_ECHO = originalEcho
            }
        })
    })

    describe('runMany', () => {
        it('should run command for all ext packages', () => {
            // Arrange
            const config = {
                packages: {
                    pbc: { name: 'project-butler', suffix: 'core' },
                    pbe: { name: 'project-butler', suffix: 'ext' },
                    gwc: { name: 'ghost-writer', suffix: 'core' },
                    gwe: { name: 'ghost-writer', suffix: 'ext' }
                }
            }
            const targets = ['build']
            const flags: string[] = []

            createPaeMockBuilder(mocks)
                .commandSuccess({
                    command: 'nx',
                    args: expect.arrayContaining(['run-many', '--target=build', '--projects=@fux/project-butler-ext,@fux/ghost-writer-ext']),
                    exitCode: 0
                })
                .build()

            // Act
            const result = runMany('ext', targets, flags, config)

            // Assert
            expect(result).toBe(0)
        })

        it('should run command for all core packages', () => {
            // Arrange
            const config = {
                packages: {
                    pbc: { name: 'project-butler', suffix: 'core' },
                    pbe: { name: 'project-butler', suffix: 'ext' },
                    gwc: { name: 'ghost-writer', suffix: 'core' },
                    gwe: { name: 'ghost-writer', suffix: 'ext' }
                }
            }
            const targets = ['test']
            const flags: string[] = []

            createPaeMockBuilder(mocks)
                .commandSuccess({
                    command: 'nx',
                    args: expect.arrayContaining(['run-many', '--target=test', '--projects=@fux/project-butler-core,@fux/ghost-writer-core']),
                    exitCode: 0
                })
                .build()

            // Act
            const result = runMany('core', targets, flags, config)

            // Assert
            expect(result).toBe(0)
        })

        it('should run command for all packages', () => {
            // Arrange
            const config = {
                packages: {
                    pbc: { name: 'project-butler', suffix: 'core' },
                    pbe: { name: 'project-butler', suffix: 'ext' },
                    gwc: { name: 'ghost-writer', suffix: 'core' },
                    gwe: { name: 'ghost-writer', suffix: 'ext' }
                }
            }
            const targets = ['lint']
            const flags: string[] = []

            createPaeMockBuilder(mocks)
                .commandSuccess({
                    command: 'nx',
                    args: expect.arrayContaining(['run-many', '--target=lint', '--projects=@fux/project-butler-core,@fux/project-butler-ext,@fux/ghost-writer-core,@fux/ghost-writer-ext']),
                    exitCode: 0
                })
                .build()

            // Act
            const result = runMany('all', targets, flags, config)

            // Assert
            expect(result).toBe(0)
        })

        it('should handle no packages found', () => {
            // Arrange
            const config = {
                packages: {
                    pbc: { name: 'project-butler', suffix: 'core' },
                    pbe: { name: 'project-butler', suffix: 'ext' }
                }
            }
            const targets = ['build']
            const flags: string[] = []

            // Act
            const result = runMany('ext', targets, flags, config)

            // Assert
            expect(result).toBe(1)
        })

        it('should auto-inject stream output for test:full', () => {
            // Arrange
            const config = {
                packages: {
                    pbe: { name: 'project-butler', suffix: 'ext' }
                }
            }
            const targets = ['test:full']
            const flags: string[] = []

            createPaeMockBuilder(mocks)
                .commandSuccess({
                    command: 'nx',
                    args: expect.arrayContaining(['--output-style=stream']),
                    exitCode: 0
                })
                .build()

            // Act
            const result = runMany('ext', targets, flags, config)

            // Assert
            expect(result).toBe(0)
        })
    })

    describe('installAliases', () => {
        it('should generate PowerShell module successfully', () => {
            // Arrange
            const config = {
                packages: {
                    pbc: { name: 'project-butler', suffix: 'core' },
                    pbe: { name: 'project-butler', suffix: 'ext' }
                }
            }

            createPaeMockBuilder(mocks)
                .configExists({
                    configPath: '/config.json',
                    configContent: JSON.stringify(config)
                })
                .fileWrite({
                    targetPath: '/dist/pae-functions.psm1',
                    content: expect.stringContaining('Invoke-pbc')
                })
                .fileWrite({
                    targetPath: '/dist/pae-aliases.sh',
                    content: expect.stringContaining('alias pbc=')
                })
                .build()

            // Mock the config loading
            vi.doMock('../../src/cli', () => ({
                ...vi.importActual('../../src/cli'),
                loadAliasConfig: () => config
            }))

            // Act
            installAliases()

            // Assert
            expect(mocks.fileSystem.writeFile).toHaveBeenCalledWith(
                expect.stringContaining('pae-functions.psm1'),
                expect.stringContaining('Invoke-pbc')
            )
            expect(mocks.fileSystem.writeFile).toHaveBeenCalledWith(
                expect.stringContaining('pae-aliases.sh'),
                expect.stringContaining('alias pbc=')
            )
        })

        it('should handle verbose output', () => {
            // Arrange
            const config = {
                packages: {
                    pbc: { name: 'project-butler', suffix: 'core' }
                }
            }

            // Mock process.argv to include verbose flag
            mocks.process.argv = ['node', 'cli.js', 'install-aliases', '--verbose']

            createPaeMockBuilder(mocks)
                .configExists({
                    configPath: '/config.json',
                    configContent: JSON.stringify(config)
                })
                .build()

            // Mock the config loading
            vi.doMock('../../src/cli', () => ({
                ...vi.importActual('../../src/cli'),
                loadAliasConfig: () => config
            }))

            // Act
            installAliases()

            // Assert
            expect(mocks.fileSystem.writeFile).toHaveBeenCalled()
        })

        it('should detect PowerShell shell', () => {
            // Arrange
            const config = {
                packages: {
                    pbc: { name: 'project-butler', suffix: 'core' }
                }
            }

            // Mock PowerShell environment
            mocks.process.env = {
                PSModulePath: '/powershell/modules',
                POWERSHELL_DISTRIBUTION_CHANNEL: 'PSGallery'
            }

            createPaeMockBuilder(mocks)
                .configExists({
                    configPath: '/config.json',
                    configContent: JSON.stringify(config)
                })
                .build()

            // Mock the config loading
            vi.doMock('../../src/cli', () => ({
                ...vi.importActual('../../src/cli'),
                loadAliasConfig: () => config
            }))

            // Act
            installAliases()

            // Assert
            expect(mocks.fileSystem.writeFile).toHaveBeenCalled()
        })

        it('should detect Git Bash shell', () => {
            // Arrange
            const config = {
                packages: {
                    pbc: { name: 'project-butler', suffix: 'core' }
                }
            }

            // Mock Git Bash environment
            mocks.process.env = {
                MSYS_ROOT: '/msys64',
                SHELL: '/usr/bin/bash'
            }

            createPaeMockBuilder(mocks)
                .configExists({
                    configPath: '/config.json',
                    configContent: JSON.stringify(config)
                })
                .build()

            // Mock the config loading
            vi.doMock('../../src/cli', () => ({
                ...vi.importActual('../../src/cli'),
                loadAliasConfig: () => config
            }))

            // Act
            installAliases()

            // Assert
            expect(mocks.fileSystem.writeFile).toHaveBeenCalled()
        })
    })
})



