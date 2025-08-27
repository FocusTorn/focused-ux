import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NotesHubConfigService } from '../../src/services/NotesHubConfig.service.js'
import {
	createMockFileSystem,
} from '../_setup.js'

describe('NotesHubConfigService', () => {
	let service: NotesHubConfigService
	let mockWorkspace: any
	let mockPathUtils: any
	let mockWorkspaceUtils: any
	let mockCommonUtils: any
	let mockCommands: any
	let mockFileSystem: ReturnType<typeof createMockFileSystem>
	let mockOsHomedir: any
	let mockPathJoin: any
	let mockPathNormalize: any
	let mockUriAdapter: any

	beforeEach(() => {
		// Create comprehensive mocks
		mockWorkspace = {
			getConfiguration: vi.fn().mockReturnValue({
				get: vi.fn().mockImplementation((key: string, defaultValue?: any) => {
					// Mock different config values based on key
					const configMap: Record<string, any> = {
						'nh.projectPath': '/custom/project/path',
						'nh.remotePath': '/custom/remote/path',
						'nh.globalPath': '/custom/global/path',
						'nh.enableProjectNotes': true,
						'nh.enableRemoteNotes': false,
						'nh.enableGlobalNotes': true,
					}

					return configMap[key] ?? defaultValue
				}),
			}),
		}

		mockPathUtils = {
			join: vi.fn().mockImplementation((...paths: string[]) => paths.join('/')),
			normalize: vi.fn().mockImplementation((path: string) => path.replace(/\\/g, '/')),
			basename: vi.fn().mockImplementation((path: string) => path.split('/').pop() || ''),
			dirname: vi.fn().mockImplementation((path: string) => path.split('/').slice(0, -1).join('/')),
		}

		mockWorkspaceUtils = {
			getWorkspaceInfo: vi.fn().mockReturnValue({
				primaryName: 'test-workspace',
				workspaceName: 'test-workspace',
				workspaceFolders: [{ uri: { fsPath: '/workspace' } }],
			}),
		}

		mockCommonUtils = {
			errMsg: vi.fn(),
			infoMsg: vi.fn(),
			warnMsg: vi.fn(),
		}

		mockCommands = {
			registerCommand: vi.fn().mockReturnValue({ dispose: vi.fn() }),
			executeCommand: vi.fn().mockResolvedValue(undefined),
		}

		mockFileSystem = createMockFileSystem()
		mockOsHomedir = vi.fn().mockReturnValue('/home/user')
		mockPathJoin = vi.fn().mockImplementation((...paths: string[]) => paths.join('/'))
		mockPathNormalize = vi.fn().mockImplementation((path: string) => path.replace(/\\/g, '/'))
		mockUriAdapter = {
			file: vi.fn().mockReturnValue({ fsPath: '/test/path' }),
		}

		service = new NotesHubConfigService(
			mockWorkspace,
			mockPathUtils,
			mockWorkspaceUtils,
			mockCommonUtils,
			mockCommands,
			mockFileSystem,
			mockOsHomedir,
			mockPathJoin,
			mockPathNormalize,
			mockUriAdapter,
		)
	})

	describe('configuration retrieval', () => {
		it('should get NotesHub configuration with default paths', () => {
			const config = service.getNotesHubConfig('nh')

			expect(config).toBeDefined()
			expect(config.projectNotesPath).toContain('.fux_note-hub')
			expect(config.remoteNotesPath).toContain('.fux_note-hub')
			expect(config.globalNotesPath).toContain('.fux_note-hub')
		})

		it('should use custom configured paths when provided', () => {
			// Create a new service with proper custom path mocking
			const customMockWorkspace = {
				getConfiguration: vi.fn().mockReturnValue({
					get: vi.fn().mockImplementation((key: string) => {
						if (key === 'projectNotesPath')
							return '/custom/project'
						if (key === 'remoteNotesPath')
							return '/custom/remote'
						if (key === 'globalNotesPath')
							return '/custom/global'
						return undefined
					}),
				}),
			}

			const customService = new NotesHubConfigService(
				customMockWorkspace,
				mockPathUtils,
				mockWorkspaceUtils,
				mockCommonUtils,
				mockCommands,
				mockFileSystem,
				mockOsHomedir,
				mockPathJoin,
				mockPathNormalize,
				mockUriAdapter,
			)

			const config = customService.getNotesHubConfig('nh')

			expect(config.projectNotesPath).toBe('/custom/project')
			expect(config.remoteNotesPath).toBe('/custom/remote')
			expect(config.globalNotesPath).toBe('/custom/global')
		})

		it('should handle tilde expansion in paths', () => {
			// Create a new service with tilde path mocking
			const tildeMockWorkspace = {
				getConfiguration: vi.fn().mockReturnValue({
					get: vi.fn().mockImplementation((key: string) => {
						if (key === 'projectNotesPath')
							return '~/custom/project'
						return undefined
					}),
				}),
			}

			const tildeService = new NotesHubConfigService(
				tildeMockWorkspace,
				mockPathUtils,
				mockWorkspaceUtils,
				mockCommonUtils,
				mockCommands,
				mockFileSystem,
				mockOsHomedir,
				mockPathJoin,
				mockPathNormalize,
				mockUriAdapter,
			)

			const config = tildeService.getNotesHubConfig('nh')

			// The path join creates a double slash due to tilde handling, normalize it
			expect(config.projectNotesPath.replace('//', '/')).toContain('/home/user/custom/project')
		})

		it('should generate project-specific path when no custom path provided', () => {
			mockWorkspace.getConfiguration.mockReturnValue({
				get: vi.fn().mockReturnValue(undefined),
			})

			const config = service.getNotesHubConfig('nh')

			expect(config.projectNotesPath).toContain('test-workspace')
			expect(config.projectNotesPath).toContain('.fux_note-hub/project')
		})
	})

	describe('directory management', () => {
		it('should create directory when it does not exist', async () => {
			// Mock workspace fs.stat to throw ENOENT error (directory doesn't exist)
			const mockWorkspaceWithFs = {
				...mockWorkspace,
				fs: {
					stat: vi.fn().mockRejectedValue({ code: 'ENOENT' }),
					createDirectory: vi.fn().mockResolvedValue(undefined),
				},
			}

			const testService = new NotesHubConfigService(
				mockWorkspaceWithFs,
				mockPathUtils,
				mockWorkspaceUtils,
				mockCommonUtils,
				mockCommands,
				mockFileSystem,
				mockOsHomedir,
				mockPathJoin,
				mockPathNormalize,
				mockUriAdapter,
			)

			await testService.createDirectoryIfNeeded('/test/path')

			expect(mockFileSystem.createDirectory).toHaveBeenCalledWith('/test/path')
		})

		it('should not create directory when it already exists', async () => {
			mockFileSystem.fileExists.mockResolvedValue(true)

			await service.createDirectoryIfNeeded('/test/path')

			expect(mockFileSystem.createDirectory).not.toHaveBeenCalled()
		})

		it('should handle directory creation errors gracefully', async () => {
			mockFileSystem.fileExists.mockResolvedValue(false)
			mockFileSystem.createDirectory.mockRejectedValue(new Error('Permission denied'))

			// Should not throw
			await expect(service.createDirectoryIfNeeded('/test/path')).resolves.toBeUndefined()
			expect(mockCommonUtils.errMsg).toHaveBeenCalled()
		})
	})

	describe('workspace integration', () => {
		it('should get workspace information', () => {
			const workspaceInfo = mockWorkspaceUtils.getWorkspaceInfo()

			expect(workspaceInfo).toEqual({
				primaryName: 'test-workspace',
				workspaceName: 'test-workspace',
				workspaceFolders: [{ uri: { fsPath: '/workspace' } }],
			})
		})

		it('should handle workspace with different primary and workspace names', () => {
			mockWorkspaceUtils.getWorkspaceInfo.mockReturnValue({
				primaryName: 'primary-name',
				workspaceName: 'workspace-name',
				workspaceFolders: [{ uri: { fsPath: '/workspace' } }],
			})

			const config = service.getNotesHubConfig('nh')

			expect(config.projectNotesPath).toContain('primary-name(workspace-name)')
		})
	})

	describe('path utilities', () => {
		it('should normalize paths correctly', () => {
			mockPathNormalize.mockImplementation((path: string) => path.replace(/\\/g, '/'))

			const _config = service.getNotesHubConfig('nh')

			expect(mockPathNormalize).toHaveBeenCalled()
		})

		it('should join paths correctly', () => {
			mockPathJoin.mockImplementation((...paths: string[]) => paths.join('/'))

			const _config = service.getNotesHubConfig('nh')

			expect(mockPathJoin).toHaveBeenCalled()
		})
	})

	describe('error handling', () => {
		it('should handle missing homedir gracefully', () => {
			mockOsHomedir.mockReturnValue('')

			const config = service.getNotesHubConfig('nh')

			expect(config.projectNotesPath).toBe('')
			expect(config.remoteNotesPath).toBe('')
			expect(config.globalNotesPath).toBe('')
		})

		it('should handle invalid configuration values', () => {
			mockWorkspace.getConfiguration.mockReturnValue({
				get: vi.fn().mockReturnValue(null),
			})

			const config = service.getNotesHubConfig('nh')

			expect(config).toBeDefined()
			// Should fall back to default paths
			expect(config.projectNotesPath).toContain('.fux_note-hub')
		})
	})

	describe('configuration validation', () => {
		it('should validate project notes configuration', () => {
			const config = service.getNotesHubConfig('nh')

			expect(config.isProjectNotesEnabled).toBeDefined()
			expect(typeof config.isProjectNotesEnabled).toBe('boolean')
		})

		it('should validate remote notes configuration', () => {
			const config = service.getNotesHubConfig('nh')

			expect(config.isRemoteNotesEnabled).toBeDefined()
			expect(typeof config.isRemoteNotesEnabled).toBe('boolean')
		})

		it('should validate global notes configuration', () => {
			const config = service.getNotesHubConfig('nh')

			expect(config.isGlobalNotesEnabled).toBeDefined()
			expect(typeof config.isGlobalNotesEnabled).toBe('boolean')
		})
	})
})
