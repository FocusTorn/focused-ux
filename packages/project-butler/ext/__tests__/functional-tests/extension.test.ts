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
vi.mock('@fux/project-butler-core', () => ({
	PackageJsonFormattingService: vi.fn().mockImplementation(() => ({
		formatPackageJson: vi.fn(),
	})),
	TerminalManagementService: vi.fn().mockImplementation(() => ({
		updateTerminalPath: vi.fn().mockResolvedValue({ command: 'cd /test', shouldShowTerminal: true }),
	})),
	BackupManagementService: vi.fn().mockImplementation(() => ({
		createBackup: vi.fn().mockResolvedValue('/test/file.txt.bak'),
	})),
	PoetryShellService: vi.fn().mockImplementation(() => ({
		enterPoetryShell: vi.fn().mockResolvedValue({ command: 'poetry shell', shouldShowTerminal: true }),
	})),
	ProjectButlerManagerService: vi.fn().mockImplementation(() => ({
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
})
