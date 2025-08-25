import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NotesHubProviderManager } from '../../src/services/NotesHubProvider.manager.js'

import type { ExtensionContext } from 'vscode'
import type { INotesHubItem } from '../../src/_interfaces/INotesHubItem.js'
import type { NotesHubConfig } from '../../src/_interfaces/INotesHubConfigService.js'

// Local interface definitions (guinea pig package compliance)
interface IWindow {
	showTextDocument: (document: any) => Promise<any>
	showInputBox: (options?: any) => Promise<string | undefined>
	showInformationMessage: (message: string) => Promise<string | undefined>
	showErrorMessage: (message: string) => Promise<string | undefined>
	showWarningMessage: (message: string) => Promise<string | undefined>
}

interface IWorkspace {
	openTextDocument: (uri: any) => Promise<any>
	fs: {
		readFile: (uri: any) => Promise<Uint8Array>
		writeFile: (uri: any, content: Uint8Array) => Promise<void>
		stat: (uri: any) => Promise<any>
	}
}

interface ICommonUtilsService {
	errMsg: (message: string) => string
}

interface IFrontmatterUtilsService {
	parseFrontmatter: (content: string) => any
	extractFrontmatter: (content: string) => any
}

interface IPathUtilsService {
	join: (...paths: string[]) => string
	dirname: (path: string) => string
	basename: (path: string, ext?: string) => string
	extname: (path: string) => string
	normalize: (path: string) => string
}

interface ICommands {
	executeCommand: (command: string, ...args: any[]) => Promise<any>
}

interface IFileType {
	File: number
	Directory: number
	SymbolicLink: number
}

// Mock the provider classes
vi.mock('../../src/providers/ProjectNotesDataProvider.js', () => ({
	ProjectNotesDataProvider: vi.fn().mockImplementation(() => ({
		notesDir: '/project/notes',
		providerName: 'project',
		initializeTreeView: vi.fn(),
		dispose: vi.fn(),
		refresh: vi.fn(),
	})),
}))

vi.mock('../../src/providers/RemoteNotesDataProvider.js', () => ({
	RemoteNotesDataProvider: vi.fn().mockImplementation(() => ({
		notesDir: '/remote/notes',
		providerName: 'remote',
		initializeTreeView: vi.fn(),
		dispose: vi.fn(),
		refresh: vi.fn(),
	})),
}))

vi.mock('../../src/providers/GlobalNotesDataProvider.js', () => ({
	GlobalNotesDataProvider: vi.fn().mockImplementation(() => ({
		notesDir: '/global/notes',
		providerName: 'global',
		initializeTreeView: vi.fn(),
		dispose: vi.fn(),
		refresh: vi.fn(),
	})),
}))

describe('NotesHubProviderManager', () => {
	let iContext: ExtensionContext
	let iWindow: IWindow
	let iWorkspace: IWorkspace
	let iCommands: ICommands
	let iCommonUtils: ICommonUtilsService
	let iFrontmatterUtils: IFrontmatterUtilsService
	let iPathUtils: IPathUtilsService
	let iFileTypeEnum: IFileType

	let manager: NotesHubProviderManager
	let mockConfig: NotesHubConfig

	beforeEach(() => {
		// Mock ExtensionContext
		iContext = {
			globalState: {
				get: vi.fn(),
				update: vi.fn(),
			},
		} as any

		// Mock IWindow
		iWindow = {
			showTextDocument: vi.fn(),
			showInputBox: vi.fn(),
			showInformationMessage: vi.fn(),
			showErrorMessage: vi.fn(),
			showWarningMessage: vi.fn(),
		} as any

		// Mock IWorkspace
		iWorkspace = {
			openTextDocument: vi.fn(),
			fs: {
				readFile: vi.fn(),
				writeFile: vi.fn(),
				stat: vi.fn(),
			},
		} as any

		// Mock ICommands
		iCommands = {
			executeCommand: vi.fn(),
		} as any

		// Mock ICommonUtilsService
		iCommonUtils = {
			errMsg: vi.fn(),
		} as any

		// Mock IFrontmatterUtilsService
		iFrontmatterUtils = {
			getFrontmatter_validateFrontmatter: vi.fn(),
		} as any

		// Mock IPathUtilsService
		iPathUtils = {
			sanitizePath: vi.fn(path => path),
		} as any

		// Mock IFileType enum
		iFileTypeEnum = {
			Directory: 'directory',
			File: 'file',
		} as any

		// Mock config
		mockConfig = {
			isProjectNotesEnabled: true,
			projectNotesPath: '/project/notes',
			isRemoteNotesEnabled: true,
			remoteNotesPath: '/remote/notes',
			isGlobalNotesEnabled: true,
			globalNotesPath: '/global/notes',
		} as any

		// Create manager instance
		manager = new NotesHubProviderManager(
			iContext,
			iWindow,
			iWorkspace,
			iCommands,
			iCommonUtils,
			iFrontmatterUtils,
			iPathUtils,
			iFileTypeEnum,
		)
	})

	describe('initializeProviders', () => {
		it('should initialize all providers when enabled', async () => {
			const commandPrefix = 'notesHub'
			const openNoteCommandId = 'notesHub.openNote'

			await manager.initializeProviders(mockConfig, commandPrefix, openNoteCommandId)

			// Verify providers were created and initialized
			expect(manager.getProviderInstance('project')).toBeDefined()
			expect(manager.getProviderInstance('remote')).toBeDefined()
			expect(manager.getProviderInstance('global')).toBeDefined()
		})

		it('should initialize only project provider when others are disabled', async () => {
			const limitedConfig = {
				...mockConfig,
				isRemoteNotesEnabled: false,
				isGlobalNotesEnabled: false,
				remoteNotesPath: undefined,
				globalNotesPath: undefined,
			}

			await manager.initializeProviders(limitedConfig, 'notesHub', 'notesHub.openNote')

			expect(manager.getProviderInstance('project')).toBeDefined()
			expect(manager.getProviderInstance('remote')).toBeUndefined()
			expect(manager.getProviderInstance('global')).toBeUndefined()
		})

		it('should skip initialization if providers already exist', async () => {
			const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

			// Initialize once
			await manager.initializeProviders(mockConfig, 'notesHub', 'notesHub.openNote')

			// Try to initialize again
			await manager.initializeProviders(mockConfig, 'notesHub', 'notesHub.openNote')

			expect(consoleSpy).toHaveBeenCalledWith('[NotesHub] Providers already initialized, skipping.')
			consoleSpy.mockRestore()
		})

		it('should handle missing paths gracefully', async () => {
			const configWithoutPaths = {
				...mockConfig,
				projectNotesPath: undefined,
				remoteNotesPath: undefined,
				globalNotesPath: undefined,
			}

			await manager.initializeProviders(configWithoutPaths, 'notesHub', 'notesHub.openNote')

			expect(manager.getProviderInstance('project')).toBeUndefined()
			expect(manager.getProviderInstance('remote')).toBeUndefined()
			expect(manager.getProviderInstance('global')).toBeUndefined()
		})
	})

	describe('dispose', () => {
		it('should dispose all providers and clear references', async () => {
			// Initialize providers first
			await manager.initializeProviders(mockConfig, 'notesHub', 'notesHub.openNote')

			// Verify providers exist
			expect(manager.getProviderInstance('project')).toBeDefined()
			expect(manager.getProviderInstance('remote')).toBeDefined()
			expect(manager.getProviderInstance('global')).toBeDefined()

			// Dispose
			manager.dispose()

			// Verify providers are cleared
			expect(manager.getProviderInstance('project')).toBeUndefined()
			expect(manager.getProviderInstance('remote')).toBeUndefined()
			expect(manager.getProviderInstance('global')).toBeUndefined()
		})

		it('should handle dispose when no providers exist', () => {
			// Should not throw when disposing without providers
			expect(() => manager.dispose()).not.toThrow()
		})
	})

	describe('getProviderForNote', () => {
		it('should return project provider for project notes', async () => {
			await manager.initializeProviders(mockConfig, 'notesHub', 'notesHub.openNote')

			const projectItem: INotesHubItem = {
				filePath: '/project/notes/test.md',
				fileName: 'test.md',
				label: 'test.md',
				isDirectory: false,
			} as any

			const provider = await manager.getProviderForNote(projectItem)

			expect(provider).toBeDefined()
			expect(provider?.providerName).toBe('project')
		})

		it('should return remote provider for remote notes', async () => {
			await manager.initializeProviders(mockConfig, 'notesHub', 'notesHub.openNote')

			const remoteItem: INotesHubItem = {
				filePath: '/remote/notes/test.md',
				fileName: 'test.md',
				label: 'test.md',
				isDirectory: false,
			} as any

			const provider = await manager.getProviderForNote(remoteItem)

			expect(provider).toBeDefined()
			expect(provider?.providerName).toBe('remote')
		})

		it('should return global provider for global notes', async () => {
			await manager.initializeProviders(mockConfig, 'notesHub', 'notesHub.openNote')

			const globalItem: INotesHubItem = {
				filePath: '/global/notes/test.md',
				fileName: 'test.md',
				label: 'test.md',
				isDirectory: false,
			} as any

			const provider = await manager.getProviderForNote(globalItem)

			expect(provider).toBeDefined()
			expect(provider?.providerName).toBe('global')
		})

		it('should return undefined for unknown path', async () => {
			await manager.initializeProviders(mockConfig, 'notesHub', 'notesHub.openNote')

			const unknownItem: INotesHubItem = {
				filePath: '/unknown/path/test.md',
				fileName: 'test.md',
				label: 'test.md',
				isDirectory: false,
			} as any

			const provider = await manager.getProviderForNote(unknownItem)

			expect(provider).toBeUndefined()
			expect(iCommonUtils.errMsg).toHaveBeenCalledWith('Could not determine provider for item: /unknown/path/test.md')
		})

		it('should handle items without filePath', async () => {
			await manager.initializeProviders(mockConfig, 'notesHub', 'notesHub.openNote')

			const itemWithoutPath: INotesHubItem = {
				filePath: undefined,
				fileName: 'test.md',
				label: 'test.md',
				isDirectory: false,
			} as any

			const provider = await manager.getProviderForNote(itemWithoutPath)

			expect(provider).toBeUndefined()
			expect(iCommonUtils.errMsg).toHaveBeenCalledWith('Could not determine provider for item: undefined')
		})
	})

	describe('getProviderInstance', () => {
		it('should return correct provider instances', async () => {
			await manager.initializeProviders(mockConfig, 'notesHub', 'notesHub.openNote')

			expect(manager.getProviderInstance('project')).toBeDefined()
			expect(manager.getProviderInstance('remote')).toBeDefined()
			expect(manager.getProviderInstance('global')).toBeDefined()
		})

		it('should return undefined for unknown provider names', async () => {
			await manager.initializeProviders(mockConfig, 'notesHub', 'notesHub.openNote')

			expect(manager.getProviderInstance('unknown' as any)).toBeUndefined()
		})

		it('should return undefined when providers not initialized', () => {
			expect(manager.getProviderInstance('project')).toBeUndefined()
			expect(manager.getProviderInstance('remote')).toBeUndefined()
			expect(manager.getProviderInstance('global')).toBeUndefined()
		})
	})

	describe('refreshProviders', () => {
		it('should refresh all providers when no specific providers specified', async () => {
			await manager.initializeProviders(mockConfig, 'notesHub', 'notesHub.openNote')

			const projectProvider = manager.getProviderInstance('project')
			const remoteProvider = manager.getProviderInstance('remote')
			const globalProvider = manager.getProviderInstance('global')

			manager.refreshProviders()

			expect(projectProvider?.refresh).toHaveBeenCalled()
			expect(remoteProvider?.refresh).toHaveBeenCalled()
			expect(globalProvider?.refresh).toHaveBeenCalled()
		})

		it('should refresh specific provider when specified', async () => {
			await manager.initializeProviders(mockConfig, 'notesHub', 'notesHub.openNote')

			const projectProvider = manager.getProviderInstance('project')
			const remoteProvider = manager.getProviderInstance('remote')

			manager.refreshProviders('project')

			expect(projectProvider?.refresh).toHaveBeenCalled()
			expect(remoteProvider?.refresh).not.toHaveBeenCalled()
		})

		it('should refresh multiple specific providers', async () => {
			await manager.initializeProviders(mockConfig, 'notesHub', 'notesHub.openNote')

			const projectProvider = manager.getProviderInstance('project')
			const remoteProvider = manager.getProviderInstance('remote')
			const globalProvider = manager.getProviderInstance('global')

			manager.refreshProviders(['project', 'global'])

			expect(projectProvider?.refresh).toHaveBeenCalled()
			expect(remoteProvider?.refresh).not.toHaveBeenCalled()
			expect(globalProvider?.refresh).toHaveBeenCalled()
		})

		it('should handle refresh when providers not initialized', () => {
			// Should not throw when refreshing without providers
			expect(() => manager.refreshProviders()).not.toThrow()
		})
	})

	describe('revealNotesHubItem', () => {
		it('should log warning about disabled feature', async () => {
			const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

			const mockProvider = {
				providerName: 'test-provider',
			} as any

			const mockItem: INotesHubItem = {
				filePath: '/test/path/item.md',
				fileName: 'item.md',
				label: 'item.md',
				isDirectory: false,
			} as any

			await manager.revealNotesHubItem(mockProvider, mockItem, true)

			expect(consoleSpy).toHaveBeenCalledWith(
				'[NotesHub] Attempted to reveal item \'/test/path/item.md\' on provider \'test-provider\', but this feature is disabled.',
			)
			consoleSpy.mockRestore()
		})

		it('should handle errors gracefully', async () => {
			const mockProvider = {
				providerName: 'test-provider',
			} as any

			const mockItem: INotesHubItem = {
				filePath: '/test/path/item.md',
				fileName: 'item.md',
				label: 'item.md',
				isDirectory: false,
			} as any

			// Mock console.warn to throw an error
			const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {
				throw new Error('Console error')
			})

			await manager.revealNotesHubItem(mockProvider, mockItem, true)

			expect(iCommonUtils.errMsg).toHaveBeenCalledWith('Error revealing item in Notes Hub', expect.any(Error))
			consoleSpy.mockRestore()
		})
	})
})
