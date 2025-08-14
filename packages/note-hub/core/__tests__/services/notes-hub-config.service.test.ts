import { describe, it, expect, beforeEach, vi } from 'vitest'

// Shared interfaces
import type {
	ICommands,
	ICommonUtilsService,
	IFileSystem,
	IPathUtilsService,
	IWorkspace,
	IWorkspaceUtilsService,
} from '@fux/shared'

// Node API types used by the service
import type * as nodeOs from 'node:os'
import type * as nodePath from 'node:path'

// Avoid importing the service before mocks are in place
let NotesHubConfigService: any

// Provide a minimal stub for @fux/shared UriAdapter to avoid pulling full index
vi.mock('@fux/shared', () => ({
	UriAdapter: {
		file: (path: string) => ({ uri: { fsPath: path, path, toString: () => `file://${path}` } }),
	},
}))

describe('NotesHubConfigService', () => {
	let iWorkspace: IWorkspace
	let iPathUtils: IPathUtilsService
	let iWorkspaceUtils: IWorkspaceUtilsService
	let iCommonUtils: ICommonUtilsService
	let iCommands: ICommands
	let iFileSystem: IFileSystem
	let iOsHomedir: typeof nodeOs.homedir
	let iPathJoin: typeof nodePath.join
	let iPathNormalize: typeof nodePath.normalize

	beforeEach(() => {
		iWorkspace = {
			getConfiguration: vi.fn().mockReturnValue({
				get: vi.fn((key: string, _default?: unknown) => {
					// Return undefined for explicit paths to let service compute defaults
					if (key.endsWith('.projectNotesPath') || key.endsWith('.remoteNotesPath') || key.endsWith('.globalNotesPath'))
						return undefined
					// feature toggles default to true
					return true
				}),
			}),
			fs: {
				stat: vi.fn(),
				createDirectory: vi.fn(),
			} as any,
			onDidChangeConfiguration: vi.fn(),
		} as unknown as IWorkspace

		iPathUtils = {
			sanitizePath: (p: string) => p.replace(/\\/g, '/'),
		} as unknown as IPathUtilsService

		iWorkspaceUtils = {
			getWorkspaceInfo: vi.fn().mockReturnValue({ primaryName: 'proj', workspaceName: 'ws' }),
		} as unknown as IWorkspaceUtilsService

		iCommonUtils = {
			errMsg: vi.fn(),
		} as unknown as ICommonUtilsService

		iCommands = {
			executeCommand: vi.fn(),
		} as unknown as ICommands

		iFileSystem = {
			createDirectory: vi.fn(),
		} as unknown as IFileSystem

		iOsHomedir = vi.fn().mockReturnValue('/home/user') as unknown as typeof nodeOs.homedir
		iPathJoin = ((...parts: string[]) => parts.filter(Boolean).join('/')) as unknown as typeof nodePath.join
		iPathNormalize = ((p: string) => p.replace(/\\/g, '/')) as unknown as typeof nodePath.normalize
	})

	it('computes default paths and sets context only once', () => {
		const svc = new NotesHubConfigService(
			iWorkspace,
			iPathUtils,
			iWorkspaceUtils,
			iCommonUtils,
			iCommands,
			iFileSystem,
			iOsHomedir,
			iPathJoin,
			iPathNormalize,
		)

		const cfg = svc.getNotesHubConfig('nh')

		expect(cfg.projectNotesPath).toContain('/home/user/.fux_note-hub/project/proj(ws)')
		expect(cfg.remoteNotesPath).toBe('/home/user/.fux_note-hub/remote')
		expect(cfg.globalNotesPath).toBe('/home/user/.fux_note-hub/global')
		expect(cfg.isProjectNotesEnabled).toBe(true)
		expect(cfg.isRemoteNotesEnabled).toBe(true)
		expect(cfg.isGlobalNotesEnabled).toBe(true)

		// context set only once
		expect(iCommands.executeCommand).toHaveBeenCalledWith('setContext', 'config.nh.enableProjectNotes', true)
		expect(iCommands.executeCommand).toHaveBeenCalledWith('setContext', 'config.nh.enableRemoteNotes', true)
		expect(iCommands.executeCommand).toHaveBeenCalledWith('setContext', 'config.nh.enableGlobalNotes', true)

		vi.clearAllMocks()
		void svc.getNotesHubConfig('nh')
		expect(iCommands.executeCommand).not.toHaveBeenCalled()
	})

	it('createDirectoryIfNeeded creates when missing and uses FileSystem first', async () => {
		// Arrange
		const svc = new NotesHubConfigService(
			iWorkspace,
			iPathUtils,
			iWorkspaceUtils,
			iCommonUtils,
			iCommands,
			iFileSystem,
			iOsHomedir,
			iPathJoin,
			iPathNormalize,
		)

		;(iWorkspace.fs.stat as any).mockRejectedValueOnce(Object.assign(new Error('not found'), { code: 'ENOENT' }))

		// Act
		await svc.createDirectoryIfNeeded('/home/user/.fux_note-hub/global')

		// Assert: prefers FileSystemAdapter then no fallback needed
		expect(iFileSystem.createDirectory).toHaveBeenCalledWith('/home/user/.fux_note-hub/global')
		expect(iWorkspace.fs.createDirectory).not.toHaveBeenCalled()
	})
})

beforeAll(async () => {
	// Ensure the module is loaded after mocks
	NotesHubConfigService = (await import('../../src/services/NotesHubConfig.service.js')).NotesHubConfigService
})
