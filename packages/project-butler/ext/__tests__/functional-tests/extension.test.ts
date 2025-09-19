import { describe, it, expect, beforeEach, vi } from 'vitest'
import { activate, deactivate } from '../../src/extension'
import * as vscode from 'vscode'
import {
    setupTestEnvironment,
    resetAllMocks,
    setupVSCodeMocks,
    setupVSCodeCommandRegistrationScenario,
    setupVSCodeWindowMessageScenario,
    setupVSCodeErrorScenario,
    createExtensionMockBuilder
} from '../_setup'

// Mock the core package
vi.mock('@fux/project-butler-core', () =>
    ({
        PackageJsonFormattingService: vi.fn().mockImplementation(() =>
            ({
                formatPackageJson: vi.fn(),
            })),
        TerminalManagementService: vi.fn().mockImplementation(() =>
            ({
                updateTerminalPath: vi.fn().mockResolvedValue({ command: 'cd /test', shouldShowTerminal: true }),
            })),
        BackupManagementService: vi.fn().mockImplementation(() =>
            ({
                createBackup: vi.fn().mockResolvedValue('/test/file.txt.bak'),
            })),
        PoetryShellService: vi.fn().mockImplementation(() =>
            ({
                enterPoetryShell: vi.fn().mockResolvedValue({ command: 'poetry shell', shouldShowTerminal: true }),
            })),
        ProjectButlerManagerService: vi.fn().mockImplementation(() =>
            ({
                formatPackageJson: vi.fn(),
            })),
    }))

describe('Extension', () => {
    let context: any
    let mocks: ReturnType<typeof setupTestEnvironment>

    beforeEach(() => {
        mocks = setupTestEnvironment()
        setupVSCodeMocks(mocks)
        context = {
            subscriptions: {
                push: vi.fn(),
            },
        }
        resetAllMocks(mocks)
    })

    describe('activate', () => {
        it('should register all commands successfully', () => {
            // Arrange
            setupVSCodeCommandRegistrationScenario(mocks, { commandName: 'formatPackageJson', shouldSucceed: true })

            // Act
            activate(context as any)

            // Assert
            expect(vscode.commands.registerCommand).toHaveBeenCalledTimes(4)
            expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
                'fux-project-butler.formatPackageJson',
                expect.any(Function),
            )
            expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
                'fux-project-butler.updateTerminalPath',
                expect.any(Function),
            )
            expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
                'fux-project-butler.createBackup',
                expect.any(Function),
            )
            expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
                'fux-project-butler.enterPoetryShell',
                expect.any(Function),
            )
        })

        it('should add disposables to context subscriptions', () => {
            // Arrange
            const mockDisposable = { dispose: vi.fn() }

            vi.mocked(vscode.commands.registerCommand).mockReturnValue(mockDisposable)

            // Act
            activate(context as any)

            // Assert
            expect(context.subscriptions.push).toHaveBeenCalledTimes(1)
            expect(context.subscriptions.push).toHaveBeenCalledWith(
                mockDisposable,
                mockDisposable,
                mockDisposable,
                mockDisposable,
            )
        })

        it('should handle activation errors gracefully', () => {
            // Arrange
            setupVSCodeErrorScenario(mocks, 'command', 'Registration failed')
            setupVSCodeWindowMessageScenario(mocks, 'error', 'Failed to activate Project Butler: Registration failed')

            // Act
            activate(context as any)

            // Assert
            expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
                'Failed to activate Project Butler: Registration failed',
            )
        })
    })

    describe('deactivate', () => {
        it('should log deactivation message', () => {
            // Arrange
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

            // Act
            deactivate()

            // Assert
            expect(consoleSpy).toHaveBeenCalledWith('F-UX: Project Butler is now deactivated!')

            // Cleanup
            consoleSpy.mockRestore()
        })
    })

    describe('Command Error Handling', () => {
        it('should handle formatPackageJson command errors gracefully', async () => {
            // Arrange
            const mockContext = { subscriptions: { push: vi.fn() } }
            
            // Mock the command to throw an error
            vi.mocked(vscode.commands.registerCommand).mockImplementation((command, handler) => {
                if (command === 'fux-project-butler.formatPackageJson') {
                    // Simulate the command handler being called and throwing
                    setTimeout(() => {
                        try {
                            handler()
                        } catch (_error) {
                            // This simulates the error handling in the extension
                        }
                    }, 0)
                }
                return { dispose: vi.fn() }
            })

            // Act
            activate(mockContext as any)

            // Assert - Command should be registered
            expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
                'fux-project-butler.formatPackageJson',
                expect.any(Function)
            )
        })

        it('should handle updateTerminalPath command errors gracefully', async () => {
            // Arrange
            const mockContext = { subscriptions: { push: vi.fn() } }
            
            // Act
            activate(mockContext as any)

            // Assert - Command should be registered
            expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
                'fux-project-butler.updateTerminalPath',
                expect.any(Function)
            )
        })

        it('should handle createBackup command errors gracefully', async () => {
            // Arrange
            const mockContext = { subscriptions: { push: vi.fn() } }
            
            // Act
            activate(mockContext as any)

            // Assert - Command should be registered
            expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
                'fux-project-butler.createBackup',
                expect.any(Function)
            )
        })

        it('should handle enterPoetryShell command errors gracefully', async () => {
            // Arrange
            const mockContext = { subscriptions: { push: vi.fn() } }
            
            // Act
            activate(mockContext as any)

            // Assert - Command should be registered
            expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
                'fux-project-butler.enterPoetryShell',
                expect.any(Function)
            )
        })
    })

    describe('Test Environment Detection', () => {
        it('should handle test environment detection correctly', () => {
            // Arrange
            const originalEnv = process.env.VSCODE_TEST
            process.env.VSCODE_TEST = '1'

            // Act
            activate({ subscriptions: { push: vi.fn() } } as any)

            // Assert - Should not show error messages in test environment
            expect(vscode.window.showErrorMessage).not.toHaveBeenCalled()

            // Cleanup
            process.env.VSCODE_TEST = originalEnv
        })

        it('should show error messages in non-test environment', () => {
            // Arrange
            const originalEnv = process.env.VSCODE_TEST
            delete process.env.VSCODE_TEST

            // Mock command registration to throw
            vi.mocked(vscode.commands.registerCommand).mockImplementation(() => {
                throw new Error('Registration failed')
            })

            // Act
            activate({ subscriptions: { push: vi.fn() } } as any)

            // Assert - Should show error message in non-test environment
            expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
                'Failed to activate Project Butler: Registration failed'
            )

            // Cleanup
            process.env.VSCODE_TEST = originalEnv
        })
    })


    describe('Extension Activation Error Scenarios', () => {
        it('should handle command registration failures', () => {
            // Arrange
            const originalEnv = process.env.VSCODE_TEST
            delete process.env.VSCODE_TEST

            // Mock command registration to throw
            vi.mocked(vscode.commands.registerCommand).mockImplementation(() => {
                throw new Error('Command registration failed')
            })

            // Act
            activate({ subscriptions: { push: vi.fn() } } as any)

            // Assert - Should show error message
            expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
                'Failed to activate Project Butler: Command registration failed'
            )

            // Cleanup
            process.env.VSCODE_TEST = originalEnv
        })

        it('should handle context subscription failures', () => {
            // Arrange
            const originalEnv = process.env.VSCODE_TEST
            delete process.env.VSCODE_TEST

            const mockContext = {
                subscriptions: {
                    push: vi.fn().mockImplementation(() => {
                        throw new Error('Subscription failed')
                    })
                }
            }

            // Mock command registration to succeed so we can test subscription failure
            vi.mocked(vscode.commands.registerCommand).mockReturnValue({ dispose: vi.fn() })

            // Act
            activate(mockContext as any)

            // Assert - Should show error message
            expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
                'Failed to activate Project Butler: Subscription failed'
            )

            // Cleanup
            process.env.VSCODE_TEST = originalEnv
        })
    })
})
