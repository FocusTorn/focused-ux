import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
    CoreTestMocks,
    setupCoreTestEnvironment,
    createCoreMockBuilder,
} from '../../src/core/index.js'
import {
    ExtensionTestMocks,
    setupExtensionTestEnvironment,
    createExtensionMockBuilder,
} from '../../src/ext/index.js'
import {
    LibTestMocks,
    setupLibTestEnvironment,
    createLibMockBuilder,
} from '../../src/lib/index.js'
import {
    ToolTestMocks,
    setupToolTestEnvironment,
    createToolMockBuilder,
} from '../../src/tool/index.js'
import {
    PluginTestMocks,
    setupPluginTestEnvironment,
    createPluginMockBuilder,
} from '../../src/plugin/index.js'
import {
    mockStateManager,
    validateMockCall,
    validateMockCallWith,
    validateMockCallTimes,
} from '../../src/index.js'

describe('Integration Tests - All Mock Strategies', () => {
    let coreMocks: CoreTestMocks
    let extMocks: ExtensionTestMocks
    let libMocks: LibTestMocks
    let toolMocks: ToolTestMocks
    let pluginMocks: PluginTestMocks

    beforeEach(() => {
        coreMocks = setupCoreTestEnvironment()
        extMocks = setupExtensionTestEnvironment()
        libMocks = setupLibTestEnvironment()
        toolMocks = setupToolTestEnvironment()
        pluginMocks = setupPluginTestEnvironment()
        
        // Clear global state manager
        mockStateManager.clear()
    })

    describe('Cross-Package Mock Integration', () => {
        it('should work with all mock strategies simultaneously', async () => {
            // Core mocks
            const coreBuilder = createCoreMockBuilder(coreMocks)
                .fileRead({ sourcePath: '/test/file.txt', content: 'core content' })
                .build()

            // Extension mocks
            const extBuilder = createExtensionMockBuilder(extMocks)
                .textEditor({ fileName: '/test/file.ts', content: 'ext content' })
                .commandRegistration({ commandName: 'test.command' })
                .build()

            // Library mocks
            const libBuilder = createLibMockBuilder(libMocks)
                .processSuccess({ command: 'npm install', stdout: 'lib output' })
                .fileWrite({ targetPath: '/test/output.txt' })
                .build()

            // Tool mocks
            const toolBuilder = createToolMockBuilder(toolMocks)
                .cliSuccess({ input: 'user input', output: 'tool output' })
                .fileProcessing({ sourcePath: '/input.txt', targetPath: '/output.txt' })
                .build()

            // Plugin mocks
            const pluginBuilder = createPluginMockBuilder(pluginMocks)
                .generatorSuccess({ projectName: 'test-project' })
                .executorSuccess({ projectName: 'test-project', target: 'build' })
                .build()

            // Test core functionality
            const coreContent = await coreMocks.fileSystem.readFile('/test/file.txt')
            expect(coreContent).toBe('core content')

            // Test extension functionality
            expect(extMocks.vscode.window.activeTextEditor.document.fileName).toBe('/test/file.ts')
            expect(extMocks.vscode.window.activeTextEditor.document.getText()).toBe('ext content')

            // Test library functionality
            const libResult = libMocks.childProcess.spawnSync('npm install', [])
            expect(libResult.stdout.toString()).toBe('lib output')

            // Test tool functionality
            const toolInterface = toolMocks.readline.createInterface({})
            const callback = vi.fn()
            toolInterface.question('prompt', callback)
            expect(callback).toHaveBeenCalledWith('user input')

            // Test plugin functionality
            const pluginConfig = pluginMocks.nx.readProjectConfiguration('test-project')
            expect(pluginConfig.name).toBe('test-project')
        })

        it('should handle mixed scenarios across packages', async () => {
            // Set up a complex scenario involving multiple packages
            const coreBuilder = createCoreMockBuilder(coreMocks)
                .fileSystemError('read', 'Permission denied', { sourcePath: '/test/file.txt' })
                .build()

            const extBuilder = createExtensionMockBuilder(extMocks)
                .windowMessage('error', 'File read failed')
                .build()

            const libBuilder = createLibMockBuilder(libMocks)
                .processError({ command: 'git pull', exitCode: 1, stderr: 'Authentication failed' })
                .build()

            const toolBuilder = createToolMockBuilder(toolMocks)
                .cliError({ error: 'Tool failed', exitCode: 1 })
                .build()

            const pluginBuilder = createPluginMockBuilder(pluginMocks)
                .generatorError({ errorMessage: 'Generator failed' })
                .executorError({ error: 'Executor failed', exitCode: 1 })
                .build()

            // Test error scenarios
            await expect(coreMocks.fileSystem.readFile('/test/file.txt')).rejects.toThrow('Permission denied')
            await expect(extMocks.vscode.window.showErrorMessage('File read failed')).resolves.toBeUndefined()

            const libResult = libMocks.childProcess.spawnSync('git pull', [])
            expect(libResult.status).toBe(1)
            expect(libResult.stderr.toString()).toBe('Authentication failed')

            expect(toolMocks.process.stderr.write('error')).toBe(true)

            expect(() => pluginMocks.tree.write('file.txt', 'content')).toThrow('Generator failed')
        })
    })

    describe('Global State Manager Integration', () => {
        it('should manage multiple mock instances', () => {
            // Register all mock types
            mockStateManager.register('core', coreMocks)
            mockStateManager.register('ext', extMocks)
            mockStateManager.register('lib', libMocks)
            mockStateManager.register('tool', toolMocks)
            mockStateManager.register('plugin', pluginMocks)

            // Use some mocks
            coreMocks.fileSystem.readFile('test.txt')
            extMocks.vscode.window.showInformationMessage('test')
            libMocks.process.cwd()
            toolMocks.readline.createInterface({})
            pluginMocks.logger.info('test')

            // Reset all
            mockStateManager.resetAll()

            // Verify all mocks were reset
            expect(coreMocks.fileSystem.readFile).toHaveBeenCalledTimes(0)
            expect(extMocks.vscode.window.showInformationMessage).toHaveBeenCalledTimes(0)
            expect(libMocks.process.cwd).toHaveBeenCalledTimes(0)
            expect(toolMocks.readline.createInterface).toHaveBeenCalledTimes(0)
            expect(pluginMocks.logger.info).toHaveBeenCalledTimes(0)
        })

        it('should handle selective reset', () => {
            // Register mocks
            mockStateManager.register('core', coreMocks)
            mockStateManager.register('ext', extMocks)

            // Use mocks
            coreMocks.fileSystem.readFile('test.txt')
            extMocks.vscode.window.showInformationMessage('test')

            // Reset only core
            mockStateManager.reset('core')

            // Verify selective reset
            expect(coreMocks.fileSystem.readFile).toHaveBeenCalledTimes(0)
            expect(extMocks.vscode.window.showInformationMessage).toHaveBeenCalledTimes(1)
        })
    })

    describe('Validation Helpers Integration', () => {
        it('should validate mocks across all packages', () => {
            // Set up mocks
            coreMocks.fileSystem.readFile('test.txt')
            extMocks.vscode.window.showInformationMessage('test')
            libMocks.process.cwd()
            toolMocks.readline.createInterface({})
            pluginMocks.logger.info('test')

            // Validate calls
            expect(() => validateMockCall(coreMocks.fileSystem.readFile, 1, ['test.txt'], expect)).not.toThrow()
            expect(() => validateMockCallWith(extMocks.vscode.window.showInformationMessage, ['test'], expect)).not.toThrow()
            expect(() => validateMockCallTimes(libMocks.process.cwd, 1, expect)).not.toThrow()
            expect(() => validateMockCall(toolMocks.readline.createInterface, 1, [{}], expect)).not.toThrow()
            expect(() => validateMockCallWith(pluginMocks.logger.info, ['test'], expect)).not.toThrow()
        })

        it('should handle validation errors across packages', () => {
            // Set up mocks
            coreMocks.fileSystem.readFile('test.txt')
            extMocks.vscode.window.showInformationMessage('test')

            // Validate with wrong counts/arguments
            expect(() => validateMockCall(coreMocks.fileSystem.readFile, 2, ['test.txt'], expect)).toThrow()
            expect(() => validateMockCallWith(extMocks.vscode.window.showInformationMessage, ['wrong'], expect)).toThrow()
            expect(() => validateMockCallTimes(libMocks.process.cwd, 1, expect)).toThrow()
        })
    })

    describe('Builder Pattern Integration', () => {
        it('should chain builders across different packages', () => {
            // Create a complex scenario using multiple builders
            const coreBuilder = createCoreMockBuilder(coreMocks)
                .fileRead({ sourcePath: '/input.txt', content: 'input' })
                .fileWrite({ targetPath: '/output.txt' })
                .windowsPath('/input.txt', '/output.txt')

            const extBuilder = createExtensionMockBuilder(extMocks)
                .textEditor({ fileName: '/input.txt', content: 'input' })
                .commandRegistration({ commandName: 'process.file' })
                .windowMessage('info', 'Processing complete')

            const libBuilder = createLibMockBuilder(libMocks)
                .processSuccess({ command: 'process-file', stdout: 'Success' })
                .unixPath()

            const toolBuilder = createToolMockBuilder(toolMocks)
                .cliSuccess({ input: 'process', output: 'done' })
                .fileProcessing({ sourcePath: '/input.txt', targetPath: '/output.txt' })

            const pluginBuilder = createPluginMockBuilder(pluginMocks)
                .generatorSuccess({ projectName: 'file-processor' })
                .executorSuccess({ projectName: 'file-processor', target: 'process' })

            // Build all
            const coreResult = coreBuilder.build()
            const extResult = extBuilder.build()
            const libResult = libBuilder.build()
            const toolResult = toolBuilder.build()
            const pluginResult = pluginBuilder.build()

            // Verify all builders returned their respective mocks
            expect(coreResult).toBe(coreMocks)
            expect(extResult).toBe(extMocks)
            expect(libResult).toBe(libMocks)
            expect(toolResult).toBe(toolMocks)
            expect(pluginResult).toBe(pluginMocks)
        })
    })

    describe('Error Handling Integration', () => {
        it('should handle errors across all packages consistently', async () => {
            // Set up error scenarios for all packages
            const coreBuilder = createCoreMockBuilder(coreMocks)
                .fileSystemError('read', 'Core error', { sourcePath: '/test.txt' })

            const extBuilder = createExtensionMockBuilder(extMocks)
                .commandRegistration({ commandName: 'test.command', shouldSucceed: false, errorMessage: 'Ext error' })

            const libBuilder = createLibMockBuilder(libMocks)
                .processError({ command: 'test', exitCode: 1, stderr: 'Lib error' })

            const toolBuilder = createToolMockBuilder(toolMocks)
                .cliError({ error: 'Tool error', exitCode: 1 })

            const pluginBuilder = createPluginMockBuilder(pluginMocks)
                .generatorError({ errorMessage: 'Plugin error' })
                .executorError({ error: 'Plugin executor error', exitCode: 1 })

            // Build all
            coreBuilder.build()
            extBuilder.build()
            libBuilder.build()
            toolBuilder.build()
            pluginBuilder.build()

            // Test all error scenarios
            await expect(coreMocks.fileSystem.readFile('/test.txt')).rejects.toThrow('Core error')
            expect(() => extMocks.vscode.commands.registerCommand('test.command', () => {})).toThrow('Ext error')
            
            const libResult = libMocks.childProcess.spawnSync('test', [])
            expect(libResult.status).toBe(1)
            expect(libResult.stderr.toString()).toBe('Lib error')

            expect(toolMocks.process.stderr.write('error')).toBe(true)

            expect(() => pluginMocks.tree.write('file.txt', 'content')).toThrow('Plugin error')
        })
    })

    describe('Performance and Memory Integration', () => {
        it('should handle large numbers of mocks efficiently', () => {
            // Create many mock instances
            const mockInstances = []
            for (let i = 0; i < 100; i++) {
                const mocks = setupCoreTestEnvironment()
                mockStateManager.register(`mock-${i}`, mocks)
                mockInstances.push(mocks)
            }

            // Use some mocks
            mockInstances.forEach((mocks, index) => {
                mocks.fileSystem.readFile(`file-${index}.txt`)
            })

            // Reset all
            mockStateManager.resetAll()

            // Verify all were reset
            mockInstances.forEach((mocks) => {
                expect(mocks.fileSystem.readFile).toHaveBeenCalledTimes(0)
            })

            // Clear all
            mockStateManager.clear()
            expect(mockStateManager.get('mock-0')).toBeUndefined()
        })
    })
})
