import { describe, it, expect, beforeEach, vi } from 'vitest'
import '../setup'
import { NotesHubConfigService } from '@fux/note-hub-core'
import type { ICommands, ICommonUtilsService, IFileSystem, IPathUtilsService, IWorkspace, IWorkspaceUtilsService } from '@fux/shared'
import { mockly } from '@fux/mockly'

describe('NotesHubConfigService', () => {
	let svc: NotesHubConfigService
	let iWorkspace: IWorkspace
	let iPathUtils: IPathUtilsService
	let iWorkspaceUtils: IWorkspaceUtilsService
	let iCommonUtils: ICommonUtilsService
	let iCommands: ICommands
	let iFileSystem: IFileSystem

	beforeEach(() => {
		// Use Mockly's built-in workspace service instead of manual mocks
		iWorkspace = {
			...mockly.workspace,
		} as unknown as IWorkspace

		// Non-Mockly: These are project-specific shared services; Mockly does not provide them.
		// We create minimal stubs to drive the unit under test deterministically.
		iPathUtils = { sanitizePath: vi.fn((p: string) => p) } as unknown as IPathUtilsService
		iWorkspaceUtils = { getWorkspaceInfo: vi.fn().mockReturnValue({ primaryName: 'proj', workspaceName: 'proj' }) } as unknown as IWorkspaceUtilsService
		iCommonUtils = { errMsg: vi.fn(), infoMsg: vi.fn(), warnMsg: vi.fn(), debugMsg: vi.fn() } as unknown as ICommonUtilsService
		
		// Use Mockly's built-in commands service instead of manual mocks
		iCommands = {
			...mockly.commands,
			executeCommand: vi.fn().mockResolvedValue(undefined),
		} as unknown as ICommands
		
		// Non-Mockly: FileSystem here is a shared wrapper, not VSCode workspace.fs. Minimal stub suffices.
		iFileSystem = { createDirectory: vi.fn().mockResolvedValue(undefined) } as unknown as IFileSystem

		svc = new NotesHubConfigService(
			iWorkspace,
			iPathUtils,
			iWorkspaceUtils,
			iCommonUtils,
			iCommands,
			iFileSystem,
			() => '/home/user',
			// Use Mockly's Node path utilities per testing strategy
			mockly.node.path.join,
			mockly.node.path.normalize,
		)
	})

	it('computes default paths when config is empty and sets context flags once', () => {
		const cfg = svc.getNotesHubConfig('nh')

		expect(cfg.projectNotesPath).toContain('/home/user/.fux_note-hub/project/')
		expect(cfg.remoteNotesPath).toBe('/home/user/.fux_note-hub/remote')
		expect(cfg.globalNotesPath).toBe('/home/user/.fux_note-hub/global')

		expect(iCommands.executeCommand).toHaveBeenCalledWith('setContext', 'config.nh.enableProjectNotes', true)
		expect(iCommands.executeCommand).toHaveBeenCalledWith('setContext', 'config.nh.enableRemoteNotes', true)
		expect(iCommands.executeCommand).toHaveBeenCalledWith('setContext', 'config.nh.enableGlobalNotes', true)

		// Second call should not re-set context
		;(iCommands.executeCommand as any).mockClear()
		svc.getNotesHubConfig('nh')
		expect(iCommands.executeCommand).not.toHaveBeenCalled()
	})

	it('expands ~ in configured paths', () => {
		// Non-Mockly: Workspace configuration read is simulated via a spy/stub; Mockly forwards getConfiguration
		// but we override return values to test expansion behavior.
		(iWorkspace.getConfiguration as any) = vi.fn().mockReturnValue({
			get: vi.fn((key: string, def?: any) => {
				if (key === 'projectNotesPath')
					return '~/custom/project'
				if (key === 'remoteNotesPath')
					return '~/custom/remote'
				if (key === 'globalNotesPath')
					return '~/custom/global'
				return def
			}),
		})

		const cfg = svc.getNotesHubConfig('nh')

		expect(cfg.projectNotesPath).toBe('/home/user/custom/project')
		expect(cfg.remoteNotesPath).toBe('/home/user/custom/remote')
		expect(cfg.globalNotesPath).toBe('/home/user/custom/global')
	})

	it('createDirectoryIfNeeded creates dir when ENOENT', async () => {
		const statErr = Object.assign(new Error('not found'), { code: 'ENOENT' })

    ;(iWorkspace.fs as any) = {
			stat: vi.fn().mockRejectedValue(statErr),
			createDirectory: vi.fn().mockResolvedValue(undefined),
		}

		await svc.createDirectoryIfNeeded('/home/user/.fux_note-hub/project/my')
		expect(iFileSystem.createDirectory).toHaveBeenCalled()
	})
})
