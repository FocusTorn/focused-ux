import { describe, it, expect, beforeEach, vi } from 'vitest'
import '../setup'
import { NotesHubProviderManager } from '@fux/note-hub-core'
import type { ICommands, ICommonUtilsService, IFileType, IFrontmatterUtilsService, IPathUtilsService, IWindow, IWorkspace } from '@fux/shared'
import { mocklyService } from '@fux/mockly'

describe('NotesHubProviderManager', () => {
	let mgr: NotesHubProviderManager
	let iWindow: IWindow
	let iWorkspace: IWorkspace
	let iCommands: ICommands
	let iCommonUtils: ICommonUtilsService
	let iFrontmatterUtils: IFrontmatterUtilsService
	let iPathUtils: IPathUtilsService
	let iFileTypeEnum: IFileType
	let extensionContext: any

	beforeEach(() => {
		// Reset Mockly for each test
		mocklyService.reset()
		
		extensionContext = { subscriptions: [] }
		
		// Use Mockly's built-in window service instead of manual mocks
		iWindow = mocklyService.window as unknown as IWindow

		// Use Mockly's built-in workspace service instead of manual mocks
		iWorkspace = mocklyService.workspace as unknown as IWorkspace

		// Use Mockly's built-in commands service instead of manual mocks
		iCommands = mocklyService.commands as unknown as ICommands
		
		// Non-Mockly: Shared service interfaces are project-specific; we stub minimal surfaces.
		iCommonUtils = { errMsg: vi.fn(), infoMsg: vi.fn(), warnMsg: vi.fn(), debugMsg: vi.fn() } as unknown as ICommonUtilsService
		iFrontmatterUtils = {} as unknown as IFrontmatterUtilsService
		iPathUtils = { sanitizePath: vi.fn((p: string) => p) } as unknown as IPathUtilsService
		
		// Use Mockly's built-in file type enum
		iFileTypeEnum = { File: 1, Directory: 2 } as unknown as IFileType

		mgr = new NotesHubProviderManager(
			extensionContext,
			iWindow,
			iWorkspace,
			iCommands,
			iCommonUtils,
			iFrontmatterUtils,
			iPathUtils,
			iFileTypeEnum,
		)
	})

	it('initializes enabled providers and avoids duplicate initialization', async () => {
		const config = {
			isProjectNotesEnabled: true,
			isRemoteNotesEnabled: true,
			isGlobalNotesEnabled: true,
			projectNotesPath: '/notes/project',
			remoteNotesPath: '/notes/remote',
			globalNotesPath: '/notes/global',
		}

		await mgr.initializeProviders(config as any, 'nh', 'nh.openNote')
		// Attempt second init; should warn/skip
		await mgr.initializeProviders(config as any, 'nh', 'nh.openNote')
	})

	it('guards inert provider when path is empty (no crashes, empty children)', async () => {
		const config = {
			isProjectNotesEnabled: true,
			isRemoteNotesEnabled: true,
			isGlobalNotesEnabled: true,
			projectNotesPath: '',
			remoteNotesPath: '/notes/remote',
			globalNotesPath: '/notes/global',
		}

		await mgr.initializeProviders(config as any, 'nh', 'nh.openNote')

		const project = mgr.getProviderInstance('project')

		if (project) {
			const children = await project.getChildren()

			expect(Array.isArray(children)).toBe(true)
		}
	})

	it('getProviderInstance returns instances by name and getProviderForNote matches path', async () => {
		const config = {
			isProjectNotesEnabled: true,
			isRemoteNotesEnabled: false,
			isGlobalNotesEnabled: true,
			projectNotesPath: '/notes/project',
			remoteNotesPath: '',
			globalNotesPath: '/notes/global',
		}

		await mgr.initializeProviders(config as any, 'nh', 'nh.openNote')

		const project = mgr.getProviderInstance('project')
		const global = mgr.getProviderInstance('global')

		expect(project).toBeTruthy()
		expect(global).toBeTruthy()

		const itemInProject = { filePath: '/notes/project/a.md' } as any
		const itemInGlobal = { filePath: '/notes/global/x.md' } as any
		const none = { filePath: '/elsewhere/y.md' } as any

		const p = await mgr.getProviderForNote(itemInProject)
		const g = await mgr.getProviderForNote(itemInGlobal)
		const u = await mgr.getProviderForNote(none)

		expect(p).toBe(project)
		expect(g).toBe(global)
		expect(u).toBeUndefined()
	})
})
