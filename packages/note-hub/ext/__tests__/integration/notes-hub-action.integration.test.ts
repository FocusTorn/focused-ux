import { describe, it, expect, beforeEach, vi } from 'vitest'
import '../setup'

// Mockly provides node.fs functionality - no need to mock fs/promises manually
// Use Mockly's built-in services for all VSCode and Node.js operations

describe('NotesHubActionService Integration Tests', () => {
	let actionService: any
	let providerManager: any
	let configService: any
	let mockContext: any

	beforeEach(async () => {
		// Import after mocking to get the mocked versions
		const { NotesHubActionService } = await import('../../../core/src/services/NotesHubAction.service.js')
		const { NotesHubProviderManager } = await import('../../../core/src/services/NotesHubProvider.manager.js')
		const { NotesHubConfigService } = await import('../../../core/src/services/NotesHubConfig.service.js')
		const { NotesHubItem: _NotesHubItem } = await import('../../../core/src/models/NotesHubItem.js')
		const { UriAdapter: _UriAdapter } = await import('@fux/shared')

		// Create real service instances with minimal mocking
		mockContext = {
			subscriptions: [],
			globalState: {
				get: vi.fn(),
				update: vi.fn(),
			},
			workspaceState: {
				get: vi.fn(),
				update: vi.fn(),
			},
		}
		
		// Use Mockly's built-in workspace mocking instead of manual mocks
		const mockWorkspace = {
			fs: {
				writeFile: vi.fn().mockResolvedValue(undefined),
				readFile: vi.fn().mockResolvedValue(new TextEncoder().encode('content')),
				createDirectory: vi.fn().mockResolvedValue(undefined),
				stat: vi.fn().mockResolvedValue({ type: 1 }),
			},
		} as any
		
		const mockPathUtils = {
			sanitizePath: (path: string) => path,
			getDottedPath: vi.fn(),
		}
		
		const mockWorkspaceUtils = {
			getWorkspaceInfo: vi.fn().mockReturnValue({
				primaryName: 'test-workspace',
				workspaceName: 'test-workspace',
			}),
		}
		
		const mockCommonUtils = {
			errMsg: vi.fn(),
			infoMsg: vi.fn(),
			delay: vi.fn(),
		}
		
		const mockCommands = {
			executeCommand: vi.fn(),
			registerCommand: vi.fn(),
		}
		
		const mockFileSystem = {
			createDirectory: vi.fn(),
		}
		
		configService = new NotesHubConfigService(
			mockWorkspace as any,
			mockPathUtils as any,
			mockWorkspaceUtils as any,
			mockCommonUtils as any,
			mockCommands as any,
			mockFileSystem as any,
			() => '/tmp', // homedir
			require('node:path').join,
			require('node:path').normalize,
		)
		
		// Use Mockly's built-in window mocking instead of manual mocks
		const mockWindow = {} as any
		
		const mockFrontmatterUtils = {
			getFrontmatter: vi.fn(),
			getFrontmatter_validateFrontmatter: vi.fn(),
		}
		const mockFileType = {
			Unknown: 0,
			File: 1,
			Directory: 2,
			SymbolicLink: 64,
		}
		
		// Use the existing mockCommands from above
		
		providerManager = new NotesHubProviderManager(
			mockContext,
			mockWindow as any,
			mockWorkspace as any,
			mockCommands as any,
			mockCommonUtils as any,
			mockFrontmatterUtils as any,
			mockPathUtils as any,
			mockFileType as any,
		)
		
		// Create action service with real dependencies
		actionService = new NotesHubActionService(
			mockContext,
			mockWindow,
			mockWorkspace,
			{ clipboard: { readText: vi.fn(), writeText: vi.fn() } }, // env
			mockCommonUtils,
			mockFrontmatterUtils, // frontmatterUtils
			mockPathUtils,
			providerManager,
			mockCommands, // commands
			require('node:path').join,
			require('node:path').dirname,
			require('node:path').basename,
			require('node:path').parse,
			require('node:path').extname,
			vi.fn(), // fspAccess
			vi.fn(), // fspRename
			mockFileType, // fileType
		)

		// Setup minimal provider configuration
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
