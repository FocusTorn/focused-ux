import { describe, it, expect } from 'vitest'
import { WorkspaceUtilsService } from '../../src/services/WorkspaceUtils.service.js'
import { createMockWorkspace } from '../_setup.js'

describe('WorkspaceUtilsService', () => {
	describe('constructor', () => {
		it('should create instance with workspace dependency', () => {
			const mockWorkspace = createMockWorkspace()
			const service = new WorkspaceUtilsService(mockWorkspace)
			
			expect(service).toBeInstanceOf(WorkspaceUtilsService)
		})
	})

	describe('getWorkspaceInfo', () => {
		it('should return default workspace info when no workspace folders', () => {
			const mockWorkspace = createMockWorkspace()

			mockWorkspace.workspaceFolders = undefined
			
			const service = new WorkspaceUtilsService(mockWorkspace)
			const info = service.getWorkspaceInfo()
			
			expect(info.inWorkspace).toBe(false)
			expect(info.workspaceName).toBeUndefined()
			expect(info.multiRoot).toBe(false)
			expect(info.primaryUri).toBeUndefined()
			expect(info.primaryName).toBeUndefined()
			expect(info.multiRootByIndex).toEqual([])
			expect(info.multiRootByName).toEqual({})
			expect(info.workspaceFolders).toBeUndefined()
			expect(info.safeWorkspaceName).toBe('no_workspace_open')
			expect(info.isRemote).toBe(false)
			expect(info.remoteUserAndHost).toBeUndefined()
		})

		it('should return workspace info for single folder workspace', () => {
			const mockWorkspace = createMockWorkspace()
			const mockUri = { fsPath: '/test/workspace', scheme: 'file' }

			mockWorkspace.workspaceFolders = [
				{ uri: mockUri, name: 'test-workspace', index: 0 },
			]
			
			const service = new WorkspaceUtilsService(mockWorkspace)
			const info = service.getWorkspaceInfo()
			
			expect(info.inWorkspace).toBe(true)
			expect(info.workspaceName).toBe('workspace')
			expect(info.multiRoot).toBe(false)
			expect(info.primaryUri).toBe(mockUri)
			expect(info.primaryName).toBe('test-workspace')
			expect(info.multiRootByIndex).toEqual([mockUri])
			expect(info.multiRootByName).toEqual({ 'test-workspace': mockUri })
			expect(info.workspaceFolders).toEqual(mockWorkspace.workspaceFolders)
			expect(info.safeWorkspaceName).toBe('workspace')
			expect(info.isRemote).toBe(false)
			expect(info.remoteUserAndHost).toBeUndefined()
		})

		it('should return workspace info for multi-root workspace', () => {
			const mockWorkspace = createMockWorkspace()
			const mockUri1 = { fsPath: '/test/workspace1', scheme: 'file' }
			const mockUri2 = { fsPath: '/test/workspace2', scheme: 'file' }

			mockWorkspace.workspaceFolders = [
				{ uri: mockUri1, name: 'workspace1', index: 0 },
				{ uri: mockUri2, name: 'workspace2', index: 1 },
			]
			
			const service = new WorkspaceUtilsService(mockWorkspace)
			const info = service.getWorkspaceInfo()
			
			expect(info.inWorkspace).toBe(true)
			expect(info.workspaceName).toBe('workspace')
			expect(info.multiRoot).toBe(true)
			expect(info.primaryUri).toBe(mockUri1)
			expect(info.primaryName).toBe('workspace1')
			expect(info.multiRootByIndex).toEqual([mockUri1, mockUri2])
			expect(info.multiRootByName).toEqual({
				workspace1: mockUri1,
				workspace2: mockUri2,
			})
			expect(info.workspaceFolders).toEqual(mockWorkspace.workspaceFolders)
			expect(info.safeWorkspaceName).toBe('workspace')
		})

		it('should detect remote workspace from URI scheme', () => {
			const mockWorkspace = createMockWorkspace()
			const mockUri = { fsPath: '/test/workspace', scheme: 'vscode-remote' }

			mockWorkspace.workspaceFolders = [
				{ uri: mockUri, name: 'remote-workspace', index: 0 },
			]
			
			const service = new WorkspaceUtilsService(mockWorkspace)
			const info = service.getWorkspaceInfo()
			
			expect(info.isRemote).toBe(true)
			expect(info.remoteUserAndHost).toBe('remote-workspace')
		})
	})

	describe('property getters', () => {
		it('should return correct workspaceName', () => {
			const mockWorkspace = createMockWorkspace()

			mockWorkspace.workspaceFolders = [
				{ uri: { fsPath: '/test', scheme: 'file' }, name: 'test', index: 0 },
			]
			
			const service = new WorkspaceUtilsService(mockWorkspace)

			expect(service.workspaceName).toBe('workspace')
		})

		it('should return correct multiRoot status', () => {
			const mockWorkspace = createMockWorkspace()

			mockWorkspace.workspaceFolders = [
				{ uri: { fsPath: '/test1', scheme: 'file' }, name: 'test1', index: 0 },
				{ uri: { fsPath: '/test2', scheme: 'file' }, name: 'test2', index: 1 },
			]
			
			const service = new WorkspaceUtilsService(mockWorkspace)

			expect(service.multiRoot).toBe(true)
		})

		it('should return correct primaryUri', () => {
			const mockWorkspace = createMockWorkspace()
			const primaryUri = { fsPath: '/test/primary', scheme: 'file' }

			mockWorkspace.workspaceFolders = [
				{ uri: primaryUri, name: 'primary', index: 0 },
			]
			
			const service = new WorkspaceUtilsService(mockWorkspace)

			expect(service.primaryUri).toBe(primaryUri)
		})

		it('should return correct primaryName', () => {
			const mockWorkspace = createMockWorkspace()

			mockWorkspace.workspaceFolders = [
				{ uri: { fsPath: '/test', scheme: 'file' }, name: 'primary-name', index: 0 },
			]
			
			const service = new WorkspaceUtilsService(mockWorkspace)

			expect(service.primaryName).toBe('primary-name')
		})

		it('should return correct multiRootByIndex', () => {
			const mockWorkspace = createMockWorkspace()
			const uri1 = { fsPath: '/test1', scheme: 'file' }
			const uri2 = { fsPath: '/test2', scheme: 'file' }

			mockWorkspace.workspaceFolders = [
				{ uri: uri1, name: 'test1', index: 0 },
				{ uri: uri2, name: 'test2', index: 1 },
			]
			
			const service = new WorkspaceUtilsService(mockWorkspace)

			expect(service.multiRootByIndex).toEqual([uri1, uri2])
		})

		it('should return correct multiRootByName', () => {
			const mockWorkspace = createMockWorkspace()
			const uri1 = { fsPath: '/test1', scheme: 'file' }
			const uri2 = { fsPath: '/test2', scheme: 'file' }

			mockWorkspace.workspaceFolders = [
				{ uri: uri1, name: 'folder1', index: 0 },
				{ uri: uri2, name: 'folder2', index: 1 },
			]
			
			const service = new WorkspaceUtilsService(mockWorkspace)

			expect(service.multiRootByName).toEqual({
				folder1: uri1,
				folder2: uri2,
			})
		})

		it('should return correct workspaceFolders', () => {
			const mockWorkspace = createMockWorkspace()
			const folders = [
				{ uri: { fsPath: '/test', scheme: 'file' }, name: 'test', index: 0 },
			]

			mockWorkspace.workspaceFolders = folders
			
			const service = new WorkspaceUtilsService(mockWorkspace)

			expect(service.workspaceFolders).toBe(folders)
		})

		it('should return correct safeWorkspaceName', () => {
			const mockWorkspace = createMockWorkspace()

			mockWorkspace.workspaceFolders = [
				{ uri: { fsPath: '/test', scheme: 'file' }, name: 'safe-name', index: 0 },
			]
			
			const service = new WorkspaceUtilsService(mockWorkspace)

			expect(service.safeWorkspaceName).toBe('workspace')
		})

		it('should return correct isRemote status', () => {
			const mockWorkspace = createMockWorkspace()

			mockWorkspace.workspaceFolders = [
				{ uri: { fsPath: '/test', scheme: 'vscode-remote' }, name: 'remote', index: 0 },
			]
			
			const service = new WorkspaceUtilsService(mockWorkspace)

			expect(service.isRemote).toBe(true)
		})

		it('should return correct remoteUserAndHost', () => {
			const mockWorkspace = createMockWorkspace()

			mockWorkspace.workspaceFolders = [
				{ uri: { fsPath: '/test', scheme: 'vscode-remote' }, name: 'user@host', index: 0 },
			]
			
			const service = new WorkspaceUtilsService(mockWorkspace)

			expect(service.remoteUserAndHost).toBe('user@host')
		})
	})

	describe('edge cases', () => {
		it('should handle empty workspace folders array', () => {
			const mockWorkspace = createMockWorkspace()

			mockWorkspace.workspaceFolders = []
			
			const service = new WorkspaceUtilsService(mockWorkspace)
			const info = service.getWorkspaceInfo()
			
			expect(info.inWorkspace).toBe(false)
			expect(info.multiRoot).toBe(false)
			expect(info.safeWorkspaceName).toBe('no_workspace_open')
		})

		it('should handle workspace folder without name', () => {
			const mockWorkspace = createMockWorkspace()

			mockWorkspace.workspaceFolders = [
				{ uri: { fsPath: '/test', scheme: 'file' }, name: '', index: 0 },
			]
			
			const service = new WorkspaceUtilsService(mockWorkspace)
			const info = service.getWorkspaceInfo()
			
			expect(info.safeWorkspaceName).toBe('workspace')
		})

		it('should handle missing workspace name', () => {
			const mockWorkspace = createMockWorkspace()

			mockWorkspace.workspaceFolders = [
				{ uri: { fsPath: '/test', scheme: 'file' }, name: undefined as any, index: 0 },
			]
			
			const service = new WorkspaceUtilsService(mockWorkspace)
			const info = service.getWorkspaceInfo()
			
			expect(info.safeWorkspaceName).toBe('workspace')
		})
	})
})
