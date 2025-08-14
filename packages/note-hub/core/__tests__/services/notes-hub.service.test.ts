import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NotesHubService } from '../../src/services/NotesHub.service.js'

// Shared types
import type { ICommands, IWindow, IWorkspace } from '@fux/shared'
import type { INotesHubConfigService, NotesHubConfig } from '../../src/_interfaces/INotesHubConfigService.js'
import type { INotesHubActionService } from '../../src/_interfaces/INotesHubActionService.js'
import type { INotesHubProviderManager } from '../../src/_interfaces/INotesHubProviderManager.js'
import type { INotesHubItem } from '../../src/_interfaces/INotesHubItem.js'

describe('NotesHubService', () => {
	let iWorkspace: IWorkspace
	let iWindow: IWindow
	let iCommands: ICommands
	let iConfigService: INotesHubConfigService
	let iActionService: INotesHubActionService
	let iProviderManager: INotesHubProviderManager

	beforeEach(() => {
		iWorkspace = {
			onDidChangeConfiguration: vi.fn().mockReturnValue({ dispose: vi.fn() }),
		} as unknown as IWorkspace

		iWindow = {
			showInformationMessage: vi.fn().mockResolvedValue('Later'),
		} as unknown as IWindow

		iCommands = {
			executeCommand: vi.fn(),
		} as unknown as ICommands

		const defaultCfg: NotesHubConfig = {
			projectNotesPath: '/p',
			remoteNotesPath: '/r',
			globalNotesPath: '/g',
			isProjectNotesEnabled: true,
			isRemoteNotesEnabled: true,
			isGlobalNotesEnabled: true,
		}

		iConfigService = {
			getNotesHubConfig: vi.fn().mockReturnValue(defaultCfg),
			createDirectoryIfNeeded: vi.fn(),
		} as unknown as INotesHubConfigService

		iActionService = {
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
		} as unknown as INotesHubActionService

		iProviderManager = {
			initializeProviders: vi.fn(),
			dispose: vi.fn(),
			getProviderForNote: vi.fn(),
			refreshProviders: vi.fn(),
			revealNotesHubItem: vi.fn(),
		} as unknown as INotesHubProviderManager
	})

	it('initializeNotesHub wires config, directories and provider manager', async () => {
		const svc = new NotesHubService(iWorkspace, iWindow, iCommands, iConfigService, iActionService, iProviderManager)

		await svc.initializeNotesHub('nh', 'nh')

		expect(iConfigService.getNotesHubConfig).toHaveBeenCalledWith('nh')
		expect(iConfigService.createDirectoryIfNeeded).toHaveBeenCalledTimes(3)
		expect(iProviderManager.initializeProviders).toHaveBeenCalled()
	})

	it('delegates actions to action service', async () => {
		const svc = new NotesHubService(iWorkspace, iWindow, iCommands, iConfigService, iActionService, iProviderManager)
		const item = { filePath: '/p/a.md' } as INotesHubItem

		await svc.openNote(item)
		expect(iActionService.openNote).toHaveBeenCalledWith(item)

		await svc.renameItem(item)
		expect(iActionService.renameItem).toHaveBeenCalledWith(item)

		await svc.addFrontmatter(item)
		expect(iActionService.addFrontmatter).toHaveBeenCalledWith(item)

		await svc.openNotePreview(item)
		expect(iActionService.openNotePreview).toHaveBeenCalledWith(item)

		await svc.deleteItem(item)
		expect(iActionService.deleteItem).toHaveBeenCalledWith(item)

		await svc.copyItem(item)
		expect(iActionService.copyItem).toHaveBeenCalledWith(item)

		await svc.cutItem(item)
		expect(iActionService.cutItem).toHaveBeenCalledWith(item)

		await svc.pasteItem(item)
		expect(iActionService.pasteItem).toHaveBeenCalledWith(item)

		await svc.newNoteInFolder(item)
		expect(iActionService.newNoteInFolder).toHaveBeenCalledWith(item)

		await svc.newFolderInFolder(item)
		expect(iActionService.newFolderInFolder).toHaveBeenCalledWith(item)

		await svc.newNoteAtRoot('project')
		expect(iActionService.newNoteAtRoot).toHaveBeenCalledWith('project')

		await svc.newFolderAtRoot('remote')
		expect(iActionService.newFolderAtRoot).toHaveBeenCalledWith('remote')
	})

	it('dispose clears disposables and disposes provider manager', () => {
		const svc = new NotesHubService(iWorkspace, iWindow, iCommands, iConfigService, iActionService, iProviderManager)

		svc.disposables = [{ dispose: vi.fn() } as any]
		svc.dispose()
		expect(svc.disposables.length).toBe(0)
	})
})
