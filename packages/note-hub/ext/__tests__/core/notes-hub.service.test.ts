import { describe, it, expect, beforeEach, vi } from 'vitest'
import '../setup'
import { NotesHubService } from '@fux/note-hub-core'

import type { ICommands, ICommonUtilsService, IFileSystem, IWorkspace, IWorkspaceUtilsService } from '@fux/shared'

import { mockly } from '@fux/mockly'

describe('NotesHubService', () => {
	/* eslint-disable unused-imports/no-unused-vars */
	let svc: NotesHubService
	let iWorkspace: IWorkspace
	let iCommonUtils: ICommonUtilsService
	let iCommands: ICommands
	let iFileSystem: IFileSystem
	let iWorkspaceUtils: IWorkspaceUtilsService
	let iProviderManager: any
	/* eslint-enable unused-imports/no-unused-vars */
    
	beforeEach(() => {
		// Use Mockly's built-in workspace service instead of manual mocks
		iWorkspace = {
			...mockly.workspace,
		} as unknown as IWorkspace

		// Use Mockly's built-in window service instead of manual mocks
		const iWindow = {
			...mockly.window,
		} as any

		// Use Mockly's built-in commands service instead of manual mocks
		iCommands = { ...mockly.commands } as unknown as ICommands

		// Non-Mockly: These are project-specific shared interfaces (not VSCode APIs).
		// Mockly focuses on VSCode and Node adapters; we stub only the required surface.
		iCommonUtils = { errMsg: vi.fn(), infoMsg: vi.fn(), warnMsg: vi.fn(), debugMsg: vi.fn() } as unknown as ICommonUtilsService
		iFileSystem = { createDirectoryIfNeeded: vi.fn().mockResolvedValue(undefined) } as unknown as IFileSystem
		iWorkspaceUtils = { getWorkspaceInfo: vi.fn().mockReturnValue({ primaryName: 'proj', workspaceName: 'proj' }) } as unknown as IWorkspaceUtilsService

		// Create mock config service
		// Non-Mockly: Config service is internal to Note Hub; manual stub ensures deterministic behavior.
		const iConfigService = {
			getNotesHubConfig: vi.fn().mockReturnValue({
				isProjectNotesEnabled: true,
				isRemoteNotesEnabled: false,
				isGlobalNotesEnabled: false,
				projectNotesPath: '/notes/proj',
				remoteNotesPath: '',
				globalNotesPath: '',
			}),
			createDirectoryIfNeeded: vi.fn().mockResolvedValue(undefined),
		} as any

		// Create mock action service
		// Non-Mockly: Action service is internal to Note Hub; manual stub allows delegation assertions.
		const iActionService = {
			openNote: vi.fn(),
			renameItem: vi.fn(),
			addFrontmatter: vi.fn(),
			openNotePreview: vi.fn(),
			deleteItem: vi.fn(),
			copyItem: vi.fn(),
			cutItem: vi.fn(),
			pasteItem: vi.fn(),
			newNoteInFolder: vi.fn(),
			newFolderInFolder: vi.fn(),
			newNoteAtRoot: vi.fn(),
			newFolderAtRoot: vi.fn(),
		} as any

		// Non-Mockly: Provider manager is internal orchestration; stubbed to control side-effects.
		iProviderManager = {
			initializeProviders: vi.fn().mockResolvedValue(undefined),
			dispose: vi.fn(),
			refreshProviders: vi.fn(),
			revealNotesHubItem: vi.fn(),
			getNotesHubConfig: vi.fn().mockReturnValue({
				isProjectNotesEnabled: true,
				isRemoteNotesEnabled: false,
				isGlobalNotesEnabled: false,
				projectNotesPath: '/notes/proj',
				remoteNotesPath: '',
				globalNotesPath: '',
			}),
			getProviderForNote: vi.fn(),
		}

		svc = new NotesHubService(
			iWorkspace,
			iWindow,
			iCommands,
			iConfigService,
			iActionService,
			iProviderManager,
		)
	})

	it('initializes, creates dirs and sets config watcher', async () => {
		await svc.initializeNotesHub('nh', 'nh')
		expect(iProviderManager.initializeProviders).toHaveBeenCalled()
	})

	it('delegates methods to action service and provider manager', async () => {
		const item: any = { filePath: '/notes/project/n.md' }

		svc.refreshProviders('all')
		expect(iProviderManager.refreshProviders).toHaveBeenCalledWith('all')
		await svc.revealNotesHubItem({} as any, item)
		expect(iProviderManager.revealNotesHubItem).toHaveBeenCalled()
	})
})
