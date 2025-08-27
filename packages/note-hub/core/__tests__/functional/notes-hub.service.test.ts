import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NotesHubService } from '../../src/services/NotesHub.service.js'
import {
	createMockProviderManager,
	mockWindow,
	mockCommands,
} from '../_setup.js'

describe('NotesHubService', () => {
	let service: NotesHubService
	let mockWorkspace: any
	let mockConfigService: any
	let mockActionService: any
	let mockProviderManager: ReturnType<typeof createMockProviderManager>

	beforeEach(() => {
		// Create comprehensive mocks
		mockWorkspace = {
			onDidChangeConfiguration: vi.fn().mockReturnValue({ dispose: vi.fn() }),
			getConfiguration: vi.fn().mockReturnValue({
				get: vi.fn().mockReturnValue('test-value'),
			}),
		}

		mockConfigService = {
			getNotesHubConfig: vi.fn().mockReturnValue({
				projectNotesPath: '/test/project',
				remoteNotesPath: '/test/remote',
				globalNotesPath: '/test/global',
			}),
			createDirectoryIfNeeded: vi.fn().mockResolvedValue(undefined),
		}

		mockActionService = {
			openNote: vi.fn().mockResolvedValue(undefined),
			renameItem: vi.fn().mockResolvedValue(undefined),
			addFrontmatter: vi.fn().mockResolvedValue(undefined),
			openNotePreview: vi.fn().mockResolvedValue(undefined),
			deleteItem: vi.fn().mockResolvedValue(undefined),
			copyItem: vi.fn().mockResolvedValue(undefined),
			cutItem: vi.fn().mockResolvedValue(undefined),
			pasteItem: vi.fn().mockResolvedValue(undefined),
			newNoteInFolder: vi.fn().mockResolvedValue(undefined),
			newFolderInFolder: vi.fn().mockResolvedValue(undefined),
			newNoteAtRoot: vi.fn().mockResolvedValue(undefined),
			newFolderAtRoot: vi.fn().mockResolvedValue(undefined),
		}

		mockProviderManager = createMockProviderManager()

		service = new NotesHubService(
			mockWorkspace,
			mockWindow,
			mockCommands,
			mockConfigService,
			mockActionService,
			mockProviderManager,
		)
	})

	describe('initialization', () => {
		it('should initialize NotesHub with default prefixes', async () => {
			await service.initializeNotesHub()

			expect(mockConfigService.createDirectoryIfNeeded).toHaveBeenCalledWith('/test/project')
			expect(mockConfigService.createDirectoryIfNeeded).toHaveBeenCalledWith('/test/remote')
			expect(mockConfigService.createDirectoryIfNeeded).toHaveBeenCalledWith('/test/global')
			expect(mockProviderManager.initializeProviders).toHaveBeenCalled()
		})

		it('should initialize NotesHub with custom prefixes', async () => {
			await service.initializeNotesHub('custom', 'custom')

			expect(mockConfigService.getNotesHubConfig).toHaveBeenCalledWith('custom')
			expect(mockProviderManager.initializeProviders).toHaveBeenCalledWith(
				expect.any(Object),
				'custom',
				'custom.openNote',
			)
		})

		it('should set up configuration change watcher', async () => {
			await service.initializeNotesHub()

			expect(mockWorkspace.onDidChangeConfiguration).toHaveBeenCalled()
		})
	})

	describe('configuration management', () => {
		it('should get NotesHub configuration', () => {
			const config = service.getNotesHubConfig()

			expect(mockConfigService.getNotesHubConfig).toHaveBeenCalledWith('nh')
			expect(config).toEqual({
				projectNotesPath: '/test/project',
				remoteNotesPath: '/test/remote',
				globalNotesPath: '/test/global',
			})
		})
	})

	describe('provider management', () => {
		it('should get provider for note', async () => {
			const mockItem = { filePath: '/test/file.md' }
			const mockProvider = { name: 'test-provider' }

			mockProviderManager.getProviderForNote.mockResolvedValue(mockProvider)

			const result = await service.getProviderForNote(mockItem as any)

			expect(mockProviderManager.getProviderForNote).toHaveBeenCalledWith(mockItem)
			expect(result).toBe(mockProvider)
		})

		it('should refresh all providers by default', () => {
			service.refreshProviders()

			expect(mockProviderManager.refreshProviders).toHaveBeenCalledWith(undefined)
		})

		it('should refresh specific providers', () => {
			service.refreshProviders(['project', 'global'])

			expect(mockProviderManager.refreshProviders).toHaveBeenCalledWith(['project', 'global'])
		})

		it('should refresh single provider', () => {
			service.refreshProviders('remote')

			expect(mockProviderManager.refreshProviders).toHaveBeenCalledWith('remote')
		})

		it('should reveal NotesHub item', async () => {
			const mockProvider = { name: 'test-provider' }
			const mockItem = { filePath: '/test/file.md' }

			await service.revealNotesHubItem(mockProvider as any, mockItem as any, true)

			expect(mockProviderManager.revealNotesHubItem).toHaveBeenCalledWith(mockProvider, mockItem, true)
		})
	})

	describe('note actions', () => {
		it('should open note', async () => {
			const mockItem = { filePath: '/test/file.md' }

			await service.openNote(mockItem as any)

			expect(mockActionService.openNote).toHaveBeenCalledWith(mockItem)
		})

		it('should rename item', async () => {
			const mockItem = { filePath: '/test/file.md' }

			await service.renameItem(mockItem as any)

			expect(mockActionService.renameItem).toHaveBeenCalledWith(mockItem)
		})

		it('should add frontmatter to note', async () => {
			const mockItem = { filePath: '/test/file.md' }

			await service.addFrontmatter(mockItem as any)

			expect(mockActionService.addFrontmatter).toHaveBeenCalledWith(mockItem)
		})
	})

	describe('lifecycle management', () => {
		it('should dispose resources properly', async () => {
			// Initialize first to set up disposables
			await service.initializeNotesHub()
            
			service.dispose()

			// The provider manager dispose is called through the disposables array
			expect(mockProviderManager.dispose).toHaveBeenCalled()
		})

		it('should clear disposables after disposal', async () => {
			// Initialize first to set up disposables
			await service.initializeNotesHub()
            
			service.dispose()
			service.dispose() // Should not call dispose again since disposables are cleared

			// After initialization, dispose should be called once
			expect(mockProviderManager.dispose).toHaveBeenCalledTimes(1)
		})
	})

	describe('error handling', () => {
		it('should handle provider initialization errors', async () => {
			mockProviderManager.initializeProviders.mockRejectedValue(new Error('Init failed'))

			await expect(service.initializeNotesHub()).rejects.toThrow('Init failed')
		})

		it('should handle configuration errors', async () => {
			mockConfigService.createDirectoryIfNeeded.mockRejectedValue(new Error('Config failed'))

			await expect(service.initializeNotesHub()).rejects.toThrow('Config failed')
		})
	})
})
