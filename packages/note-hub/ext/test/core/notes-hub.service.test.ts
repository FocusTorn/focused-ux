import { describe, it, expect, beforeEach, vi } from 'vitest'
import '../setup'
import { NotesHubService } from '@fux/note-hub-core'
import type { ICommands, IWindow, IWorkspace } from '@fux/shared'

describe('NotesHubService', () => {
	let svc: NotesHubService
	let iWorkspace: IWorkspace
	let iWindow: IWindow
	let iCommands: ICommands
	let iConfigService: any
	let iActionService: any
	let iProviderManager: any

	beforeEach(() => {
		iWorkspace = {
			onDidChangeConfiguration: vi.fn().mockReturnValue({ dispose: vi.fn() }),
		} as unknown as IWorkspace
		iWindow = {
			showInformationMessage: vi.fn().mockResolvedValue('Later'),
		} as unknown as IWindow
		iCommands = { executeCommand: vi.fn() } as unknown as ICommands
		iConfigService = {
			getNotesHubConfig: vi.fn().mockReturnValue({
				projectNotesPath: '/notes/project',
				remoteNotesPath: '/notes/remote',
				globalNotesPath: '/notes/global',
				isProjectNotesEnabled: true,
				isRemoteNotesEnabled: true,
				isGlobalNotesEnabled: true,
			}),
			createDirectoryIfNeeded: vi.fn().mockResolvedValue(undefined),
		}
		iActionService = {}
		iProviderManager = {
			initializeProviders: vi.fn().mockResolvedValue(undefined),
			dispose: vi.fn(),
			refreshProviders: vi.fn(),
			revealNotesHubItem: vi.fn(),
			getProviderForNote: vi.fn(),
		}

		svc = new NotesHubService(iWorkspace, iWindow, iCommands, iConfigService, iActionService, iProviderManager)
	})

	it('initializes, creates dirs and sets config watcher', async () => {
		await svc.initializeNotesHub('nh', 'nh')
		expect(iConfigService.createDirectoryIfNeeded).toHaveBeenCalledTimes(3)
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
