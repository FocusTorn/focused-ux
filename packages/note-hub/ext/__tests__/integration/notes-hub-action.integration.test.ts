import { describe, it, expect, beforeEach, vi } from 'vitest'
import '../setup'
import { mockly } from '@fux/mockly'
import { createDIContainer } from '../../src/injection.js'
import { asValue } from 'awilix'

// Mockly provides node.fs functionality - no need to mock fs/promises manually
// Use Mockly's built-in services for all VSCode and Node.js operations

describe('NotesHubActionService Integration Tests', () => {
	let actionService: any
	let providerManager: any
	let configService: any
	let mockContext: any
	let container: any

	beforeEach(async () => {
		// Non-Mockly: Extension context is a VSCode runtime object; we only need a minimal shape for DI.
		// Mockly does not provide extension context; manual vi.fn() is sufficient/stable here.
		mockContext = {
			subscriptions: [],
			globalState: { get: vi.fn(), update: vi.fn() },
			workspaceState: { get: vi.fn(), update: vi.fn() },
		}

		container = await createDIContainer(mockContext as any)
		// Override workspace and window with Mockly shims to avoid real VSCode
		container.register({
			iWorkspace: asValue(mockly.workspace as any),
			iWindow: asValue(mockly.window as any),
		})

		// Resolve services from DI
		actionService = container.resolve('iActionService')
		providerManager = container.resolve('iProviderManager')
		configService = container.resolve('iConfigService')

		// Configure provider paths for tests
		vi.spyOn(configService, 'getNotesHubConfig').mockReturnValue({
			projectNotesPath: '/tmp/test-notes',
			remoteNotesPath: '/tmp/remote-notes',
			globalNotesPath: '/tmp/global-notes',
			isProjectNotesEnabled: true,
			isRemoteNotesEnabled: false,
			isGlobalNotesEnabled: false,
		})
		vi.spyOn(configService, 'createDirectoryIfNeeded').mockResolvedValue(undefined)
	})

	describe('newNoteAtRoot Integration', () => {
		it('should create a root item and call newNoteInFolder without throwing', async () => {
			// This test will catch constructor errors, dependency injection issues,
			// and basic service chain problems
			
			// Mock the provider to return a valid instance
			// Non-Mockly: Provider interfaces are project-specific, not VSCode APIs.
			// We stub only the contract used by the service; Mockly does not define these.
			const mockProvider = {
				notesDir: '/tmp/test-notes',
				refresh: vi.fn(),
				getNotesHubItem: vi.fn(),
			}
			
			vi.spyOn(providerManager, 'getProviderInstance').mockReturnValue(mockProvider)
			
			// Mock the input box to return a valid filename
			vi.spyOn(actionService, 'getNewFileNameWithExtension')
				.mockResolvedValue({ newName: 'TestNote', newExtension: '.md' })
			
			// This should not throw - if it does, we've found a real integration issue
			await expect(actionService.newNoteAtRoot('project')).resolves.not.toThrow()
		})

		it('should handle NotesHubItem creation correctly', async () => {
			// Import after mocking to get the mocked versions
			const { NotesHubItem } = await import('../../../core/src/models/NotesHubItem.js')
			
			// Test the actual NotesHubItem constructor with real UriAdapter
			const item = new NotesHubItem('TestFolder', '/tmp/test-notes', true)
			
			expect(item.fileName).toBe('TestFolder')
			expect(item.filePath).toBe('/tmp/test-notes')
			expect(item.isDirectory).toBe(true)
			expect(item.resourceUri).toBeDefined()
			expect(item.resourceUri?.toString()).toContain('file://')
		})

		it('should handle UriAdapter.file calls correctly', async () => {
		// Import after mocking to get the mocked versions
			const { UriAdapter } = await import('@fux/shared')
		
			// Test the actual UriAdapter with real paths
			const uri = UriAdapter.file('/tmp/test-notes/TestNote.md')
		
			expect(uri.fsPath).toBe('/tmp/test-notes/TestNote.md')
			// The mock returns a function for toString, so we need to call it
			expect(typeof uri.toString).toBe('function')
			expect(uri.toString()).toContain('file://')
		})
	})

	describe('Service Chain Integration', () => {
		it('should properly chain service calls without breaking', async () => {
			// Test that the service chain works end-to-end
			// Non-Mockly: Provider interfaces are project-specific; manual stub is clearer than overfitting Mockly.
			const mockProvider = {
				notesDir: '/tmp/test-notes',
				refresh: vi.fn(),
				getNotesHubItem: vi.fn(),
			}
			
			vi.spyOn(providerManager, 'getProviderInstance').mockReturnValue(mockProvider)
			vi.spyOn(providerManager, 'getProviderForNote').mockResolvedValue(mockProvider)
			
			// Mock the input box
			vi.spyOn(actionService, 'getNewFileNameWithExtension')
				.mockResolvedValue({ newName: 'TestNote', newExtension: '.md' })
			
			// Mock file operations - the mockWorkspace is already set up in beforeEach
			// No need to spy again since it's already mocked
			
			// This should complete the full chain without errors
			await expect(actionService.newNoteAtRoot('project')).resolves.not.toThrow()
		})
	})
})
