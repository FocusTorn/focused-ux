import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ExtensionContext } from 'vscode'

// Create mock instances FIRST
const mockExtensionContextAdapter = {
	subscriptions: [],
	push: vi.fn(),
}

const mockExtensionAPIAdapter = {
	registerCommand: vi.fn().mockReturnValue({
		dispose: vi.fn(),
	}),
}

const mockContainer = {
	resolve: vi.fn((service: string) => {
		switch (service) {
			case 'projectButlerService':
				return {
					updateTerminalPath: vi.fn().mockResolvedValue(undefined),
					createBackup: vi.fn().mockResolvedValue(undefined),
					enterPoetryShell: vi.fn().mockResolvedValue(undefined),
					formatPackageJson: vi.fn().mockResolvedValue(undefined),
				}
			case 'window':
				return {
					showErrorMessage: vi.fn(),
					showTimedInformationMessage: vi.fn(),
				}
			default:
				return {}
		}
	}),
}

// Mock the DI container creation
vi.mock('../src/injection.js', () => ({
	createDIContainer: vi.fn().mockResolvedValue(mockContainer),
}))

// Mock the shared adapters - return our mock instances
vi.mock('@fux/shared', () => ({
	ExtensionContextAdapter: vi.fn().mockImplementation(() => mockExtensionContextAdapter),
	ExtensionAPIAdapter: vi.fn().mockImplementation(() => mockExtensionAPIAdapter),
}))

// Mock the constants
vi.mock('../src/_config/constants.js', () => ({
	constants: {
		extension: {
			name: 'Project Butler',
		},
		commands: {
			updateTerminalPath: 'project-butler.updateTerminalPath',
			createBackup: 'project-butler.createBackup',
			enterPoetryShell: 'project-butler.enterPoetryShell',
			formatPackageJson: 'project-butler.formatPackageJson',
			hotswap: 'project-butler.hotswap',
		},
	},
}))

// Mock the hotswap module
vi.mock('../src/hotswap.js', () => ({
	hotswap: vi.fn().mockResolvedValue(undefined),
}))

describe('Extension Activation', () => {
	let mockContext: ExtensionContext

	beforeEach(async () => {
		// Reset all mocks
		vi.clearAllMocks()

		// Mock console.error for error testing
		vi.spyOn(console, 'error').mockImplementation(() => {})

		// Create mock context with mock subscriptions array
		mockContext = {
			subscriptions: {
				push: vi.fn() as any,
			},
			workspaceState: {
				get: vi.fn(),
				update: vi.fn(),
			},
			globalState: {
				get: vi.fn(),
				update: vi.fn(),
			},
			extensionPath: '/test/extension/path',
			extensionUri: { fsPath: '/test/extension/path' },
			environmentVariableCollection: {
				replace: vi.fn(),
				append: vi.fn(),
				prepend: vi.fn(),
				delete: vi.fn(),
			},
		} as any

		// Reset mock instances to clean state
		mockExtensionContextAdapter.subscriptions = []
		mockExtensionContextAdapter.push.mockClear()
		mockExtensionAPIAdapter.registerCommand.mockClear()
		mockContainer.resolve.mockClear()
		// Reset the mock context subscriptions
		;(mockContext.subscriptions.push as any).mockClear()
	})

	describe('activate function', () => {
		it('should activate successfully with all commands registered', async () => {
			const { activate } = await import('../src/extension.js')

			await activate(mockContext)

			// Verify ExtensionContextAdapter was created
			const { ExtensionContextAdapter } = await import('@fux/shared')

			expect(ExtensionContextAdapter).toHaveBeenCalledWith(mockContext)

			// Verify ExtensionAPIAdapter was created
			const { ExtensionAPIAdapter: ExtensionAPI } = await import('@fux/shared')

			expect(ExtensionAPI).toHaveBeenCalled()

			// Verify DI container was created
			const { createDIContainer } = await import('../src/injection.js')

			expect(createDIContainer).toHaveBeenCalledWith(mockContext)

			// Verify all commands were registered
			expect(mockExtensionAPIAdapter.registerCommand).toHaveBeenCalledTimes(5)
			expect(mockExtensionAPIAdapter.registerCommand).toHaveBeenCalledWith(
				'project-butler.updateTerminalPath',
				expect.any(Function),
			)
			expect(mockExtensionAPIAdapter.registerCommand).toHaveBeenCalledWith(
				'project-butler.createBackup',
				expect.any(Function),
			)
			expect(mockExtensionAPIAdapter.registerCommand).toHaveBeenCalledWith(
				'project-butler.enterPoetryShell',
				expect.any(Function),
			)
			expect(mockExtensionAPIAdapter.registerCommand).toHaveBeenCalledWith(
				'project-butler.formatPackageJson',
				expect.any(Function),
			)
			expect(mockExtensionAPIAdapter.registerCommand).toHaveBeenCalledWith(
				'project-butler.hotswap',
				expect.any(Function),
			)
		})

		it('should register commands with correct handlers', async () => {
			const { activate } = await import('../src/extension.js')

			await activate(mockContext)

			// Get the registered command handlers
			const registerCommandCalls = vi.mocked(mockExtensionAPIAdapter.registerCommand).mock.calls

			// Test updateTerminalPath command
			const updateTerminalPathHandler = registerCommandCalls.find(
				call => call[0] === 'project-butler.updateTerminalPath',
			)?.[1]

			expect(updateTerminalPathHandler).toBeDefined()

			// Test createBackup command
			const createBackupHandler = registerCommandCalls.find(
				call => call[0] === 'project-butler.createBackup',
			)?.[1]

			expect(createBackupHandler).toBeDefined()

			// Test enterPoetryShell command
			const enterPoetryShellHandler = registerCommandCalls.find(
				call => call[0] === 'project-butler.enterPoetryShell',
			)?.[1]

			expect(enterPoetryShellHandler).toBeDefined()

			// Test formatPackageJson command
			const formatPackageJsonHandler = registerCommandCalls.find(
				call => call[0] === 'project-butler.formatPackageJson',
			)?.[1]

			expect(formatPackageJsonHandler).toBeDefined()

			// Test hotswap command
			const hotswapHandler = registerCommandCalls.find(
				call => call[0] === 'project-butler.hotswap',
			)?.[1]

			expect(hotswapHandler).toBeDefined()
		})

		it('should add disposables to context subscriptions', async () => {
			const { activate } = await import('../src/extension.js')

			await activate(mockContext)

			// Debug: Check what was actually called
			console.log('mockExtensionContextAdapter.subscriptions:', mockExtensionContextAdapter.subscriptions)
			console.log('mockExtensionContextAdapter.subscriptions length:', mockExtensionContextAdapter.subscriptions.length)

			// Check if ExtensionContextAdapter was called
			const { ExtensionContextAdapter } = await import('@fux/shared')

			console.log('ExtensionContextAdapter calls:', vi.mocked(ExtensionContextAdapter).mock.calls)
			console.log('ExtensionContextAdapter mock implementation:', vi.mocked(ExtensionContextAdapter).getMockImplementation())

			// Get the actual instance that was created and check its subscriptions
			const extensionContextInstance = vi.mocked(ExtensionContextAdapter).mock.results[0]?.value

			console.log('ExtensionContextAdapter instance:', extensionContextInstance)
			console.log('ExtensionContextAdapter instance subscriptions:', extensionContextInstance?.subscriptions)

			// Verify disposables were added to subscriptions
			expect(mockExtensionContextAdapter.subscriptions).toHaveLength(5)
			expect(mockExtensionContextAdapter.subscriptions).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						dispose: expect.any(Function),
					}),
				]),
			)
		})

		it('should handle hotswap command without URI gracefully', async () => {
			const { activate } = await import('../src/extension.js')

			await activate(mockContext)

			// Get the hotswap command handler
			const registerCommandCalls = vi.mocked(mockExtensionAPIAdapter.registerCommand).mock.calls
			const hotswapHandler = registerCommandCalls.find(
				call => call[0] === 'project-butler.hotswap',
			)?.[1]

			expect(hotswapHandler).toBeDefined()

			// Test the handler with no URI
			if (hotswapHandler) {
				// Clear any previous calls to the window service
				mockContainer.resolve.mockClear()
				
				console.log('About to call hotswap handler with undefined URI')
				await hotswapHandler(undefined)
				console.log('Hotswap handler completed')

				// Debug: Check what was called
				console.log('mockContainer.resolve calls after hotswap:', mockContainer.resolve.mock.calls)
				console.log('mockContainer.resolve mock calls:', mockContainer.resolve.mock.calls)

				// Verify the window service was resolved from the container
				expect(mockContainer.resolve).toHaveBeenCalledWith('window')
				
				// Get the window service that was used in the command handler
				// We need to get it from the mock calls, not call resolve again
				const windowServiceCall = mockContainer.resolve.mock.calls.find(call => call[0] === 'window')
				expect(windowServiceCall).toBeDefined()
				
				// The window service should have been called with showErrorMessage
				// We need to check the mock implementation to see what was returned
				const windowService = mockContainer.resolve.mock.results.find(result => 
					result.type === 'return' && result.value && result.value.showErrorMessage
				)?.value
				
				expect(windowService).toBeDefined()
				expect(windowService.showErrorMessage).toHaveBeenCalledWith(
					'Hotswap command must be run from a VSIX file.',
				)
			}
		})

		it('should handle activation errors gracefully', async () => {
			// Mock container creation to fail
			const { createDIContainer } = await import('../src/injection.js')

			vi.mocked(createDIContainer).mockRejectedValueOnce(new Error('Container creation failed'))

			const { activate } = await import('../src/extension.js')

			// Should not throw
			await expect(activate(mockContext)).resolves.toBeUndefined()

			// Should log error (only if console.error is mocked)
			if (vi.isMockFunction(console.error)) {
				expect(console.error).toHaveBeenCalledWith(
					'[Project Butler] Failed to activate:',
					expect.any(Error),
				)
			}
		})

		it('should show error message when activation fails', async () => {
			// Mock container creation to fail
			const { createDIContainer } = await import('../src/injection.js')

			vi.mocked(createDIContainer).mockRejectedValueOnce(new Error('Container creation failed'))

			const { activate } = await import('../src/extension.js')

			await activate(mockContext)

			// Should show error message in console since container creation failed
			expect(console.error).toHaveBeenCalledWith(
				'[Project Butler] Failed to activate:',
				expect.any(Error),
			)
			expect(console.error).toHaveBeenCalledWith(
				'[Project Butler] Container creation failed, cannot show error message to user',
			)
		})
	})

	describe('deactivate function', () => {
		it('should exist and be callable', async () => {
			const { deactivate } = await import('../src/extension.js')

			expect(deactivate).toBeDefined()
			expect(typeof deactivate).toBe('function')

			// Should not throw when called
			expect(() => deactivate()).not.toThrow()
		})
	})
})
