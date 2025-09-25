import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setupPaeTestEnvironment, resetPaeMocks } from '../__mocks__/helpers'
import { createPaeMockBuilder } from '../__mocks__/mock-scenario-builder'
import { runNx, runMany, installAliases } from '../../src/cli'

describe('Execution', () => {
    let mocks: Awaited<ReturnType<typeof setupPaeTestEnvironment>>

    beforeEach(async () => { //>
        mocks = await setupPaeTestEnvironment()
        await resetPaeMocks(mocks)
    }) //<

    describe('runNx', () => {
        it('should execute nx command successfully', async () => { //>
            // Arrange
            const argv = ['build', '@fux/project-butler-core']
            
            const builder = await createPaeMockBuilder(mocks)
            const configuredBuilder = await builder
                .commandSuccess({
                    command: 'nx',
                    args: argv,
                    exitCode: 0,
                    stdout: 'Build successful'
                })
            configuredBuilder.build()

            // Act
            const result = runNx(argv)

            // Assert
            expect(result).toBe(0)
            expect(mocks.childProcess.spawnSync).toHaveBeenCalledWith('nx', argv, expect.any(Object))
        }) //<
        it('should handle nx command failure', async () => { //>
            // Arrange
            const argv = ['build', '@fux/project-butler-core']
            
            const builder = await createPaeMockBuilder(mocks)
            const configuredBuilder = await builder
                .commandFailure({
                    command: 'nx',
                    args: argv,
                    exitCode: 1,
                    stderr: 'Build failed'
                })
            configuredBuilder.build()

            // Act
            const result = runNx(argv)

            // Assert
            expect(result).toBe(1)
        }) //<
        it('should handle echo mode', () => { //>
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
        }) //<
    })

    describe('runMany', () => {
        it('should run command for all ext packages', async () => { //>
            // Arrange
            const config = {
                packages: {
                    pbc: { name: 'project-butler', suffix: 'core' as const },
                    pbe: { name: 'project-butler', suffix: 'ext' as const },
                    gwc: { name: 'ghost-writer', suffix: 'core' as const },
                    gwe: { name: 'ghost-writer', suffix: 'ext' as const }
                }
            }
            const targets = ['build']
            const flags: string[] = []

            const builder = await createPaeMockBuilder(mocks)
            const configuredBuilder = await builder
                .commandSuccess({
                    command: 'nx',
                    args: expect.arrayContaining(['run-many', '--target=build', '--projects=@fux/project-butler-ext,@fux/ghost-writer-ext']),
                    exitCode: 0
                })
            configuredBuilder.build()

            // Act
            const result = runMany('ext', targets, flags, config)

            // Assert
            expect(result).toBe(0)
        }) //<
        it('should run command for all core packages', async () => { //>
            // Arrange
            const config = {
                packages: {
                    pbc: { name: 'project-butler', suffix: 'core' as const },
                    pbe: { name: 'project-butler', suffix: 'ext' as const },
                    gwc: { name: 'ghost-writer', suffix: 'core' as const },
                    gwe: { name: 'ghost-writer', suffix: 'ext' as const }
                }
            }
            const targets = ['test']
            const flags: string[] = []

            const builder = await createPaeMockBuilder(mocks)
            const configuredBuilder = await builder
                .commandSuccess({
                    command: 'nx',
                    args: expect.arrayContaining(['run-many', '--target=test', '--projects=@fux/project-butler-core,@fux/ghost-writer-core']),
                    exitCode: 0
                })
            configuredBuilder.build()

            // Act
            const result = runMany('core', targets, flags, config)

            // Assert
            expect(result).toBe(0)
        }) //<
        it('should run command for all packages', async () => { //>
            // Arrange
            const config = {
                packages: {
                    pbc: { name: 'project-butler', suffix: 'core' as const },
                    pbe: { name: 'project-butler', suffix: 'ext' as const },
                    gwc: { name: 'ghost-writer', suffix: 'core' as const },
                    gwe: { name: 'ghost-writer', suffix: 'ext' as const }
                }
            }
            const targets = ['lint']
            const flags: string[] = []

            const builder = await createPaeMockBuilder(mocks)
            const configuredBuilder = await builder
                .commandSuccess({
                    command: 'nx',
                    args: expect.arrayContaining(['run-many', '--target=lint', '--projects=@fux/project-butler-core,@fux/project-butler-ext,@fux/ghost-writer-core,@fux/ghost-writer-ext']),
                    exitCode: 0
                })
            configuredBuilder.build()

            // Act
            const result = runMany('all', targets, flags, config)

            // Assert
            expect(result).toBe(0)
        }) //<
        it('should handle no packages found', () => { //>
            // Arrange
            const config = {
                packages: {
                    pbc: { name: 'project-butler', suffix: 'core' as const },
                    pbe: { name: 'project-butler', suffix: 'ext' as const }
                }
            }
            const targets = ['build']
            const flags: string[] = []

            // Act
            const result = runMany('ext', targets, flags, config)

            // Assert
            expect(result).toBe(1)
        }) //<
        it('should auto-inject stream output for test:full', async () => { //>
            // Arrange
            const config = {
                packages: {
                    pbe: { name: 'project-butler', suffix: 'ext' as const }
                }
            }
            const targets = ['test:full']
            const flags: string[] = []

            const builder = await createPaeMockBuilder(mocks)
            const configuredBuilder = await builder
                .commandSuccess({
                    command: 'nx',
                    args: expect.arrayContaining(['--output-style=stream']),
                    exitCode: 0
                })
            configuredBuilder.build()

            // Act
            const result = runMany('ext', targets, flags, config)

            // Assert
            expect(result).toBe(0)
        }) //<
    })

    describe('installAliases', () => {
        it('should generate PowerShell module successfully', async () => { //>
            // Arrange
            const config = {
                packages: {
                    pbc: { name: 'project-butler', suffix: 'core' as const },
                    pbe: { name: 'project-butler', suffix: 'ext' as const }
                }
            }

            const builder = await createPaeMockBuilder(mocks)
            const configuredBuilder1 = await builder
                .configExists({
                    configPath: '/config.json',
                    configContent: JSON.stringify(config)
                })
            const configuredBuilder2 = await configuredBuilder1
                .fileWrite({
                    targetPath: '/dist/pae-functions.psm1',
                    content: expect.stringContaining('Invoke-pbc')
                })
            const configuredBuilder3 = await configuredBuilder2
                .fileWrite({
                    targetPath: '/dist/pae-aliases.sh',
                    content: expect.stringContaining('alias pbc=')
                })
            configuredBuilder3.build()

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
        }) //<
        it('should handle verbose output', async () => { //>
            // Arrange
            const config = {
                packages: {
                    pbc: { name: 'project-butler', suffix: 'core' as const }
                }
            }

            // Mock process.argv to include verbose flag
            mocks.process.argv = ['node', 'cli.js', 'install-aliases', '--verbose']

            const builder = await createPaeMockBuilder(mocks)
            const configuredBuilder = await builder
                .configExists({
                    configPath: '/config.json',
                    configContent: JSON.stringify(config)
                })
            configuredBuilder.build()

            // Mock the config loading
            vi.doMock('../../src/cli', () => ({
                ...vi.importActual('../../src/cli'),
                loadAliasConfig: () => config
            }))

            // Act
            installAliases()

            // Assert
            expect(mocks.fileSystem.writeFile).toHaveBeenCalled()
        }) //<
        it('should detect PowerShell shell', async () => { //>
            // Arrange
            const config = {
                packages: {
                    pbc: { name: 'project-butler', suffix: 'core' as const }
                }
            }

            // Mock PowerShell environment
            mocks.process.env = {
                PSModulePath: '/powershell/modules',
                POWERSHELL_DISTRIBUTION_CHANNEL: 'PSGallery'
            }

            const builder = await createPaeMockBuilder(mocks)
            const configuredBuilder = await builder
                .configExists({
                    configPath: '/config.json',
                    configContent: JSON.stringify(config)
                })
            configuredBuilder.build()

            // Mock the config loading
            vi.doMock('../../src/cli', () => ({
                ...vi.importActual('../../src/cli'),
                loadAliasConfig: () => config
            }))

            // Act
            installAliases()

            // Assert
            expect(mocks.fileSystem.writeFile).toHaveBeenCalled()
        }) //<
        it('should detect Git Bash shell', async () => { //>
            // Arrange
            const config = {
                packages: {
                    pbc: { name: 'project-butler', suffix: 'core' as const }
                }
            }

            // Mock Git Bash environment
            mocks.process.env = {
                MSYS_ROOT: '/msys64',
                SHELL: '/usr/bin/bash'
            }

            const builder = await createPaeMockBuilder(mocks)
            const configuredBuilder = await builder
                .configExists({
                    configPath: '/config.json',
                    configContent: JSON.stringify(config)
                })
            configuredBuilder.build()

            // Mock the config loading
            vi.doMock('../../src/cli', () => ({
                ...vi.importActual('../../src/cli'),
                loadAliasConfig: () => config
            }))

            // Act
            installAliases()

            // Assert
            expect(mocks.fileSystem.writeFile).toHaveBeenCalled()
        }) //<
    })
})



