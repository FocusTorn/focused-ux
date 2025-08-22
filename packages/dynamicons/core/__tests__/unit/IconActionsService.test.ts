import { describe, it, expect, vi, beforeEach } from 'vitest'
import { IconActionsService } from '../../src/services/IconActionsService.js'
import type { IWindow } from '../../src/_interfaces/IWindow.js'
import type { ICommands } from '../../src/_interfaces/ICommands.js'
import type { IContext } from '../../src/_interfaces/IContext.js'
import type { IPath } from '../../src/_interfaces/IPath.js'
import type { ICommonUtils } from '../../src/_interfaces/ICommonUtils.js'
import type { IFileSystem } from '../../src/_interfaces/IFileSystem.js'
import type { IIconThemeGeneratorService } from '../../src/_interfaces/IIconThemeGeneratorService.js'
import type { IConfigurationService } from '../../src/services/ConfigurationService.js'
import type { IIconPickerService } from '../../src/services/IconPickerService.js'

// Mock vscode
vi.mock('vscode', () => ({
	Uri: {
		file: (path: string) => ({
			fsPath: path,
			toString: () => path,
		}),
	},
}))

// Mock dependencies
const mockWindow: IWindow = {
	showInformationMessage: vi.fn(),
	showWarningMessage: vi.fn(),
	showErrorMessage: vi.fn(),
	showTimedInformationMessage: vi.fn(),
}

const mockCommands: ICommands = {
	executeCommand: vi.fn(),
	registerCommand: vi.fn(),
}

const mockContext: IContext = {
	extensionPath: '/test/extension',
	subscriptions: [],
}

const mockPath: IPath = {
	join: vi.fn(),
	relative: vi.fn(),
	basename: vi.fn(),
	dirname: vi.fn(),
	parse: vi.fn(),
}

const mockCommonUtils: ICommonUtils = {
	delay: vi.fn(),
	errMsg: vi.fn(),
}

const mockFileSystem: IFileSystem = {
	stat: vi.fn(),
	readdir: vi.fn(),
	readFile: vi.fn(),
	writeFile: vi.fn(),
	access: vi.fn(),
	mkdir: vi.fn(),
	copyFile: vi.fn(),
	readFileSync: vi.fn(),
}

const mockIconThemeGenerator: IIconThemeGeneratorService = {
	generateIconThemeManifest: vi.fn(),
	writeIconThemeFile: vi.fn(),
}

const mockConfigService: IConfigurationService = {
	getUserIconsDirectory: vi.fn(),
	getCustomMappings: vi.fn(),
	getHideArrowsSetting: vi.fn(),
	updateCustomMappings: vi.fn(),
	updateHideArrowsSetting: vi.fn(),
}

const mockIconPicker: IIconPickerService = {
	showAvailableIconsQuickPick: vi.fn(),
}

describe('IconActionsService', () => {
	let service: IconActionsService

	beforeEach(() => {
		vi.clearAllMocks()
		service = new IconActionsService(
			mockContext,
			mockWindow,
			mockCommands,
			mockPath,
			mockCommonUtils,
			mockFileSystem,
			mockIconThemeGenerator,
			mockConfigService,
			mockIconPicker,
		)
	})

	describe('showAvailableIconsQuickPick', () => {
		it('should delegate to icon picker service', async () => {
			(mockIconPicker.showAvailableIconsQuickPick as any).mockResolvedValue('_selected-icon')

			const result = await service.showAvailableIconsQuickPick('file')

			expect(mockIconPicker.showAvailableIconsQuickPick).toHaveBeenCalledWith('file', undefined)
			expect(result).toBe('_selected-icon')
		})

		it('should pass filter function to icon picker', async () => {
			const filter = (name: string) => name.includes('test')

			;(mockIconPicker.showAvailableIconsQuickPick as any).mockResolvedValue('_filtered-icon')

			const result = await service.showAvailableIconsQuickPick('folder', filter)

			expect(mockIconPicker.showAvailableIconsQuickPick).toHaveBeenCalledWith('folder', filter)
			expect(result).toBe('_filtered-icon')
		})
	})

	describe('assignIconToResource', () => {
		it('should assign icon to single resource', async () => {
			const resourceUri = { fsPath: '/test/file.ts', toString: () => '/test/file.ts' } as any
			const selectedIcon = '_typescript'

			;(mockFileSystem.stat as any).mockResolvedValue({ isFile: () => true, isDirectory: () => false })
			;(mockPath.basename as any).mockReturnValue('file.ts')
			;(mockIconPicker.showAvailableIconsQuickPick as any).mockResolvedValue(selectedIcon)
			;(mockConfigService.updateCustomMappings as any).mockResolvedValue(undefined)
			;(mockIconThemeGenerator.generateIconThemeManifest as any).mockResolvedValue({ iconDefinitions: {} })
			;(mockIconThemeGenerator.writeIconThemeFile as any).mockResolvedValue(undefined)
			;(mockCommands.executeCommand as any).mockResolvedValue(undefined)

			await service.assignIconToResource([resourceUri])

			expect(mockIconPicker.showAvailableIconsQuickPick).toHaveBeenCalledWith(undefined, undefined)
			expect(mockConfigService.updateCustomMappings).toHaveBeenCalledWith(expect.any(Function))
			expect(mockWindow.showInformationMessage).toHaveBeenCalledWith('Icon assigned to 1 resource(s).')
		})

		it('should assign icon to multiple resources', async () => {
			const resourceUris = [
				{ fsPath: '/test/file1.ts', toString: () => '/test/file1.ts' } as any,
				{ fsPath: '/test/file2.ts', toString: () => '/test/file2.ts' } as any,
			]
			const selectedIcon = '_typescript'

			;(mockFileSystem.stat as any).mockResolvedValue({ isFile: () => true, isDirectory: () => false })
			;(mockPath.basename as any).mockReturnValue('file.ts')
			;(mockIconPicker.showAvailableIconsQuickPick as any).mockResolvedValue(selectedIcon)
			;(mockConfigService.updateCustomMappings as any).mockResolvedValue(undefined)
			;(mockIconThemeGenerator.generateIconThemeManifest as any).mockResolvedValue({ iconDefinitions: {} })
			;(mockIconThemeGenerator.writeIconThemeFile as any).mockResolvedValue(undefined)
			;(mockCommands.executeCommand as any).mockResolvedValue(undefined)

			await service.assignIconToResource(resourceUris)

			expect(mockWindow.showInformationMessage).toHaveBeenCalledWith('Icon assigned to 2 resource(s).')
		})

		it('should show warning when no resources provided', async () => {
			await service.assignIconToResource([])

			expect(mockWindow.showWarningMessage).toHaveBeenCalledWith('No resources selected for icon assignment.')
			expect(mockIconPicker.showAvailableIconsQuickPick).not.toHaveBeenCalled()
		})

		it('should handle icon picker cancellation', async () => {
			const resourceUri = { fsPath: '/test/file.ts', toString: () => '/test/file.ts' } as any

			;(mockIconPicker.showAvailableIconsQuickPick as any).mockResolvedValue(undefined)

			await service.assignIconToResource([resourceUri])

			expect(mockConfigService.updateCustomMappings).not.toHaveBeenCalled()
			expect(mockWindow.showInformationMessage).not.toHaveBeenCalled()
		})

		it('should handle resource stat error', async () => {
			const resourceUri = { fsPath: '/test/file.ts', toString: () => '/test/file.ts' } as any
			const selectedIcon = '_typescript'

			;(mockFileSystem.stat as any).mockRejectedValue(new Error('Stat failed'))
			;(mockIconPicker.showAvailableIconsQuickPick as any).mockResolvedValue(selectedIcon)
			;(mockConfigService.updateCustomMappings as any).mockResolvedValue(undefined)
			;(mockIconThemeGenerator.generateIconThemeManifest as any).mockResolvedValue({ iconDefinitions: {} })
			;(mockIconThemeGenerator.writeIconThemeFile as any).mockResolvedValue(undefined)
			;(mockCommands.executeCommand as any).mockResolvedValue(undefined)

			await service.assignIconToResource([resourceUri])

			// The service handles the error gracefully and continues processing
			expect(mockConfigService.updateCustomMappings).toHaveBeenCalledWith(expect.any(Function))
			expect(mockWindow.showInformationMessage).toHaveBeenCalledWith('Icon assigned to 1 resource(s).')
		})

		it('should assign icon with specific type scope', async () => {
			const resourceUri = { fsPath: '/test/folder', toString: () => '/test/folder' } as any
			const selectedIcon = '_folder'

			;(mockFileSystem.stat as any).mockResolvedValue({ isDirectory: () => true, isFile: () => false })
			;(mockPath.basename as any).mockReturnValue('folder')
			;(mockIconPicker.showAvailableIconsQuickPick as any).mockResolvedValue(selectedIcon)
			;(mockConfigService.updateCustomMappings as any).mockResolvedValue(undefined)
			;(mockIconThemeGenerator.generateIconThemeManifest as any).mockResolvedValue({ iconDefinitions: {} })
			;(mockIconThemeGenerator.writeIconThemeFile as any).mockResolvedValue(undefined)
			;(mockCommands.executeCommand as any).mockResolvedValue(undefined)

			await service.assignIconToResource([resourceUri], 'folder')

			expect(mockIconPicker.showAvailableIconsQuickPick).toHaveBeenCalledWith('folder', undefined)
		})
	})

	describe('revertIconAssignment', () => {
		it('should revert icon assignment for single resource', async () => {
			const resourceUri = { fsPath: '/test/file.ts', toString: () => '/test/file.ts' } as any

			;(mockFileSystem.stat as any).mockResolvedValue({ isFile: () => true, isDirectory: () => false })
			;(mockPath.basename as any).mockReturnValue('file.ts')
			;(mockConfigService.updateCustomMappings as any).mockResolvedValue(undefined)
			;(mockIconThemeGenerator.generateIconThemeManifest as any).mockResolvedValue({ iconDefinitions: {} })
			;(mockIconThemeGenerator.writeIconThemeFile as any).mockResolvedValue(undefined)
			;(mockCommands.executeCommand as any).mockResolvedValue(undefined)

			await service.revertIconAssignment([resourceUri])

			expect(mockConfigService.updateCustomMappings).toHaveBeenCalledWith(expect.any(Function))
			expect(mockWindow.showInformationMessage).toHaveBeenCalledWith('Icon assignments reverted for 1 resource(s).')
		})

		it('should show warning when no resources provided', async () => {
			await service.revertIconAssignment([])

			expect(mockWindow.showWarningMessage).toHaveBeenCalledWith('No resources selected for icon reversion.')
			expect(mockConfigService.updateCustomMappings).not.toHaveBeenCalled()
		})

		it('should handle resource stat error during reversion', async () => {
			const resourceUri = { fsPath: '/test/file.ts', toString: () => '/test/file.ts' } as any

			;(mockFileSystem.stat as any).mockRejectedValue(new Error('Stat failed'))
			;(mockConfigService.updateCustomMappings as any).mockResolvedValue(undefined)
			;(mockIconThemeGenerator.generateIconThemeManifest as any).mockResolvedValue({ iconDefinitions: {} })
			;(mockIconThemeGenerator.writeIconThemeFile as any).mockResolvedValue(undefined)
			;(mockCommands.executeCommand as any).mockResolvedValue(undefined)

			await service.revertIconAssignment([resourceUri])

			// The service handles the error gracefully and continues processing
			expect(mockConfigService.updateCustomMappings).toHaveBeenCalledWith(expect.any(Function))
			expect(mockWindow.showInformationMessage).toHaveBeenCalledWith('Icon assignments reverted for 1 resource(s).')
		})
	})

	describe('showUserIconAssignments', () => {
		it('should show file icon assignments', async () => {
			const mappings = {
				'file:test.ts': '_typescript',
				'file:package.json': '_package',
				'folder:src': '_source',
			}

			;(mockConfigService.getCustomMappings as any).mockResolvedValue(mappings)

			await service.showUserIconAssignments('file')

			expect(mockWindow.showInformationMessage).toHaveBeenCalledWith(
				expect.stringContaining('File Icon Assignments:'),
			)
		})

		it('should show folder icon assignments', async () => {
			const mappings = {
				'folder:src': '_source',
				'folder:node_modules': '_node',
			}

			;(mockConfigService.getCustomMappings as any).mockResolvedValue(mappings)

			await service.showUserIconAssignments('folder')

			expect(mockWindow.showInformationMessage).toHaveBeenCalledWith(
				expect.stringContaining('Folder Icon Assignments:'),
			)
		})

		it('should show language icon assignments', async () => {
			const mappings = {
				'language:typescript': '_typescript',
				'language:javascript': '_javascript',
			}

			;(mockConfigService.getCustomMappings as any).mockResolvedValue(mappings)

			await service.showUserIconAssignments('language')

			expect(mockWindow.showInformationMessage).toHaveBeenCalledWith(
				expect.stringContaining('Language Icon Assignments:'),
			)
		})

		it('should show no assignments message when no mappings', async () => {
			(mockConfigService.getCustomMappings as any).mockResolvedValue(undefined)

			await service.showUserIconAssignments('file')

			expect(mockWindow.showInformationMessage).toHaveBeenCalledWith('No custom icon assignments found.')
		})

		it('should show no assignments message when no relevant mappings', async () => {
			const mappings = {
				'folder:src': '_source',
			}

			;(mockConfigService.getCustomMappings as any).mockResolvedValue(mappings)

			await service.showUserIconAssignments('file')

			expect(mockWindow.showInformationMessage).toHaveBeenCalledWith('No file icon assignments found.')
		})
	})

	describe('regenerateAndApplyTheme', () => {
		it('should regenerate theme successfully', async () => {
			(mockPath.join as any).mockImplementation((...args: string[]) => args.join('/'))
			;(mockConfigService.getUserIconsDirectory as any).mockResolvedValue('/test/user-icons')
			;(mockConfigService.getCustomMappings as any).mockResolvedValue({ 'file:.ts': '_typescript' })
			;(mockConfigService.getHideArrowsSetting as any).mockResolvedValue(true)
			;(mockIconThemeGenerator.generateIconThemeManifest as any).mockResolvedValue({ iconDefinitions: {} })
			;(mockIconThemeGenerator.writeIconThemeFile as any).mockResolvedValue(undefined)
			;(mockCommands.executeCommand as any).mockResolvedValue(undefined)

			// Access private method through any
			await (service as any).regenerateAndApplyTheme()

			expect(mockIconThemeGenerator.generateIconThemeManifest).toHaveBeenCalledWith(
				expect.any(Object),
				expect.any(Object),
				'/test/user-icons',
				{ 'file:.ts': '_typescript' },
				true,
			)
			expect(mockIconThemeGenerator.writeIconThemeFile).toHaveBeenCalled()
			expect(mockCommands.executeCommand).toHaveBeenCalledWith('workbench.files.action.refreshFilesExplorer')
		})

		it('should handle theme generation failure', async () => {
			(mockPath.join as any).mockImplementation((...args: string[]) => args.join('/'))
			;(mockConfigService.getUserIconsDirectory as any).mockResolvedValue(undefined)
			;(mockConfigService.getCustomMappings as any).mockResolvedValue(undefined)
			;(mockConfigService.getHideArrowsSetting as any).mockResolvedValue(undefined)
			;(mockIconThemeGenerator.generateIconThemeManifest as any).mockResolvedValue(undefined)

			// Access private method through any
			await (service as any).regenerateAndApplyTheme()

			expect(mockCommonUtils.errMsg).toHaveBeenCalledWith(
				'Failed to regenerate icon theme',
				expect.any(Error),
			)
			expect(mockWindow.showErrorMessage).toHaveBeenCalledWith(
				'Failed to regenerate icon theme. Check the console for details.',
			)
		})

		it('should handle theme write failure', async () => {
			const writeError = new Error('Write failed')

			;(mockPath.join as any).mockImplementation((...args: string[]) => args.join('/'))
			;(mockConfigService.getUserIconsDirectory as any).mockResolvedValue(undefined)
			;(mockConfigService.getCustomMappings as any).mockResolvedValue(undefined)
			;(mockConfigService.getHideArrowsSetting as any).mockResolvedValue(undefined)
			;(mockIconThemeGenerator.generateIconThemeManifest as any).mockResolvedValue({ iconDefinitions: {} })
			;(mockIconThemeGenerator.writeIconThemeFile as any).mockRejectedValue(writeError)

			// Access private method through any
			await (service as any).regenerateAndApplyTheme()

			expect(mockCommonUtils.errMsg).toHaveBeenCalledWith(
				'Failed to regenerate icon theme',
				writeError,
			)
		})
	})

	describe('toggleExplorerArrows', () => {
		it('should toggle explorer arrows setting from false to true', async () => {
			(mockConfigService.getHideArrowsSetting as any).mockResolvedValue(false)
			;(mockConfigService.updateHideArrowsSetting as any).mockResolvedValue(undefined)
			;(mockIconThemeGenerator.generateIconThemeManifest as any).mockResolvedValue({ iconDefinitions: {} })
			;(mockIconThemeGenerator.writeIconThemeFile as any).mockResolvedValue(undefined)
			;(mockCommands.executeCommand as any).mockResolvedValue(undefined)
			;(mockPath.join as any)
				.mockReturnValueOnce('/test/extension/assets/themes/base.theme.json')
				.mockReturnValueOnce('/test/extension/assets/themes')
				.mockReturnValueOnce('/test/extension/assets/themes/generated.theme.json')
			;(mockConfigService.getUserIconsDirectory as any).mockResolvedValue('/test/user-icons')
			;(mockConfigService.getCustomMappings as any).mockResolvedValue({})
			;(mockConfigService.getHideArrowsSetting as any)
				.mockResolvedValueOnce(false) // First call for getHideArrowsSetting
				.mockResolvedValueOnce(false) // Second call in regenerateAndApplyTheme

			await service.toggleExplorerArrows()

			expect(mockConfigService.getHideArrowsSetting).toHaveBeenCalled()
			expect(mockConfigService.updateHideArrowsSetting).toHaveBeenCalledWith(true)
			expect(mockWindow.showInformationMessage).toHaveBeenCalledWith('Explorer arrows are now hidden.')
		})

		it('should toggle explorer arrows setting from true to false', async () => {
			(mockConfigService.getHideArrowsSetting as any).mockResolvedValue(true)
			;(mockConfigService.updateHideArrowsSetting as any).mockResolvedValue(undefined)
			;(mockIconThemeGenerator.generateIconThemeManifest as any).mockResolvedValue({ iconDefinitions: {} })
			;(mockIconThemeGenerator.writeIconThemeFile as any).mockResolvedValue(undefined)
			;(mockCommands.executeCommand as any).mockResolvedValue(undefined)
			;(mockPath.join as any)
				.mockReturnValueOnce('/test/extension/assets/themes/base.theme.json')
				.mockReturnValueOnce('/test/extension/assets/themes')
				.mockReturnValueOnce('/test/extension/assets/themes/generated.theme.json')
			;(mockConfigService.getUserIconsDirectory as any).mockResolvedValue('/test/user-icons')
			;(mockConfigService.getCustomMappings as any).mockResolvedValue({})
			;(mockConfigService.getHideArrowsSetting as any)
				.mockResolvedValueOnce(true) // First call for getHideArrowsSetting
				.mockResolvedValueOnce(true) // Second call in regenerateAndApplyTheme

			await service.toggleExplorerArrows()

			expect(mockConfigService.getHideArrowsSetting).toHaveBeenCalled()
			expect(mockConfigService.updateHideArrowsSetting).toHaveBeenCalledWith(false)
			expect(mockWindow.showInformationMessage).toHaveBeenCalledWith('Explorer arrows are now visible.')
		})

		it('should regenerate theme after toggling arrows', async () => {
			(mockConfigService.getHideArrowsSetting as any).mockResolvedValue(false)
			;(mockConfigService.updateHideArrowsSetting as any).mockResolvedValue(undefined)
			;(mockIconThemeGenerator.generateIconThemeManifest as any).mockResolvedValue({ iconDefinitions: {} })
			;(mockIconThemeGenerator.writeIconThemeFile as any).mockResolvedValue(undefined)
			;(mockCommands.executeCommand as any).mockResolvedValue(undefined)
			;(mockPath.join as any)
				.mockReturnValueOnce('/test/extension/assets/themes/base.theme.json')
				.mockReturnValueOnce('/test/extension/assets/themes')
				.mockReturnValueOnce('/test/extension/assets/themes/generated.theme.json')
			;(mockConfigService.getUserIconsDirectory as any).mockResolvedValue('/test/user-icons')
			;(mockConfigService.getCustomMappings as any).mockResolvedValue({})
			;(mockConfigService.getHideArrowsSetting as any)
				.mockResolvedValueOnce(false) // First call for getHideArrowsSetting
				.mockResolvedValueOnce(false) // Second call in regenerateAndApplyTheme

			await service.toggleExplorerArrows()

			expect(mockIconThemeGenerator.generateIconThemeManifest).toHaveBeenCalled()
			expect(mockIconThemeGenerator.writeIconThemeFile).toHaveBeenCalled()
			expect(mockCommands.executeCommand).toHaveBeenCalledWith('workbench.files.action.refreshFilesExplorer')
		})

		it('should handle configuration update errors', async () => {
			(mockConfigService.getHideArrowsSetting as any).mockResolvedValue(false)
			;(mockConfigService.updateHideArrowsSetting as any).mockRejectedValue(new Error('Config update failed'))

			await expect(service.toggleExplorerArrows()).rejects.toThrow('Config update failed')

			expect(mockConfigService.updateHideArrowsSetting).toHaveBeenCalledWith(true)
			// Should not show success message if config update fails
			expect(mockWindow.showInformationMessage).not.toHaveBeenCalled()
		})
	})

	describe('refreshIconTheme', () => {
		it('should regenerate and apply theme successfully', async () => {
			(mockIconThemeGenerator.generateIconThemeManifest as any).mockResolvedValue({ iconDefinitions: {} })
			;(mockIconThemeGenerator.writeIconThemeFile as any).mockResolvedValue(undefined)
			;(mockCommands.executeCommand as any).mockResolvedValue(undefined)
			;(mockPath.join as any)
				.mockReturnValueOnce('/test/extension/assets/themes/base.theme.json')
				.mockReturnValueOnce('/test/extension/assets/themes')
				.mockReturnValueOnce('/test/extension/assets/themes/generated.theme.json')
			;(mockConfigService.getUserIconsDirectory as any).mockResolvedValue('/test/user-icons')
			;(mockConfigService.getCustomMappings as any).mockResolvedValue({})
			;(mockConfigService.getHideArrowsSetting as any).mockResolvedValue(false)

			await service.refreshIconTheme()

			expect(mockIconThemeGenerator.generateIconThemeManifest).toHaveBeenCalled()
			expect(mockIconThemeGenerator.writeIconThemeFile).toHaveBeenCalled()
			expect(mockCommands.executeCommand).toHaveBeenCalledWith('workbench.files.action.refreshFilesExplorer')
			expect(mockWindow.showInformationMessage).toHaveBeenCalledWith('Icon theme refreshed successfully.')
		})

		it('should handle theme regeneration errors', async () => {
			(mockIconThemeGenerator.generateIconThemeManifest as any).mockResolvedValue(null)
			;(mockPath.join as any)
				.mockReturnValueOnce('/test/extension/assets/themes/base.theme.json')
				.mockReturnValueOnce('/test/extension/assets/themes')
			;(mockConfigService.getUserIconsDirectory as any).mockResolvedValue('/test/user-icons')
			;(mockConfigService.getCustomMappings as any).mockResolvedValue({})
			;(mockConfigService.getHideArrowsSetting as any).mockResolvedValue(false)

			await service.refreshIconTheme()

			expect(mockCommonUtils.errMsg).toHaveBeenCalledWith('Failed to regenerate icon theme', expect.any(Error))
			expect(mockWindow.showErrorMessage).toHaveBeenCalledWith('Failed to regenerate icon theme. Check the console for details.')
			// The method still shows success message even when regeneration fails (this is the actual behavior)
			expect(mockWindow.showInformationMessage).toHaveBeenCalledWith('Icon theme refreshed successfully.')
		})
	})

	describe('getResourceName', () => {
		it('should return basename for directory', async () => {
			const mockUri = { fsPath: '/test/path/folder' }
			const mockStat = { isDirectory: () => true, isFile: () => false }

			;(mockFileSystem.stat as any).mockResolvedValue(mockStat)
			;(mockPath.basename as any).mockReturnValue('folder')

			const result = await service.getResourceName(mockUri as any)

			expect(mockFileSystem.stat).toHaveBeenCalledWith(mockUri)
			expect(mockPath.basename).toHaveBeenCalledWith('/test/path/folder')
			expect(result).toBe('folder')
		})

		it('should return basename for file', async () => {
			const mockUri = { fsPath: '/test/path/file.ts' }
			const mockStat = { isDirectory: () => false, isFile: () => true }

			;(mockFileSystem.stat as any).mockResolvedValue(mockStat)
			;(mockPath.basename as any).mockReturnValue('file.ts')

			const result = await service.getResourceName(mockUri as any)

			expect(mockFileSystem.stat).toHaveBeenCalledWith(mockUri)
			expect(mockPath.basename).toHaveBeenCalledWith('/test/path/file.ts')
			expect(result).toBe('file.ts')
		})

		it('should return undefined for non-file/non-directory', async () => {
			const mockUri = { fsPath: '/test/path/symlink' }
			const mockStat = { isDirectory: () => false, isFile: () => false }

			;(mockFileSystem.stat as any).mockResolvedValue(mockStat)

			const result = await service.getResourceName(mockUri as any)

			expect(mockFileSystem.stat).toHaveBeenCalledWith(mockUri)
			expect(result).toBeUndefined()
		})

		it('should handle file system errors gracefully', async () => {
			const mockUri = { fsPath: '/test/path/nonexistent' }

			;(mockFileSystem.stat as any).mockRejectedValue(new Error('File not found'))

			const result = await service.getResourceName(mockUri as any)

			expect(mockFileSystem.stat).toHaveBeenCalledWith(mockUri)
			expect(mockCommonUtils.errMsg).toHaveBeenCalledWith(
				'Error getting resource stats for /test/path/nonexistent',
				expect.any(Error),
			)
			expect(result).toBeUndefined()
		})
	})

	describe('getAssociationKey', () => {
		it('should generate correct association key for file type', async () => {
			const result = await service.getAssociationKey('test.ts', 'file')

			expect(result).toBe('file:test.ts')
		})

		it('should generate correct association key for folder type', async () => {
			const result = await service.getAssociationKey('src', 'folder')

			expect(result).toBe('folder:src')
		})

		it('should generate correct association key for language type', async () => {
			const result = await service.getAssociationKey('typescript', 'language')

			expect(result).toBe('language:typescript')
		})
	})

	describe('Edge Cases and Error Handling', () => {
		it('should handle empty resource names in assignIconToResource', async () => {
			const mockUri = { fsPath: '/test/path/file.ts' }

			;(mockFileSystem.stat as any).mockRejectedValue(new Error('File not found'))
			;(mockIconPicker.showAvailableIconsQuickPick as any).mockResolvedValue('_typescript')
			;(mockConfigService.updateCustomMappings as any).mockImplementation(async (fn) => {
				const mappings = {}

				await fn(mappings)
				return mappings
			})
			;(mockIconThemeGenerator.generateIconThemeManifest as any).mockResolvedValue({ iconDefinitions: {} })
			;(mockIconThemeGenerator.writeIconThemeFile as any).mockResolvedValue(undefined)
			;(mockCommands.executeCommand as any).mockResolvedValue(undefined)
			;(mockPath.join as any)
				.mockReturnValueOnce('/test/extension/assets/themes/base.theme.json')
				.mockReturnValueOnce('/test/extension/assets/themes')
				.mockReturnValueOnce('/test/extension/assets/themes/generated.theme.json')
			;(mockConfigService.getUserIconsDirectory as any).mockResolvedValue('/test/user-icons')
			;(mockConfigService.getCustomMappings as any).mockResolvedValue({})
			;(mockConfigService.getHideArrowsSetting as any).mockResolvedValue(false)

			await service.assignIconToResource([mockUri as any])

			expect(mockFileSystem.stat).toHaveBeenCalledWith(mockUri)
			expect(mockCommonUtils.errMsg).toHaveBeenCalledWith(
				'Error getting resource stats for /test/path/file.ts',
				expect.any(Error),
			)
			// Should still show success message because the method continues even with errors
			expect(mockWindow.showInformationMessage).toHaveBeenCalledWith('Icon assigned to 1 resource(s).')
		})

		it('should handle empty resource names in revertIconAssignment', async () => {
			const mockUri = { fsPath: '/test/path/file.ts' }

			;(mockFileSystem.stat as any).mockRejectedValue(new Error('File not found'))
			;(mockConfigService.updateCustomMappings as any).mockImplementation(async (fn) => {
				const mappings = {}

				await fn(mappings)
				return mappings
			})
			;(mockIconThemeGenerator.generateIconThemeManifest as any).mockResolvedValue({ iconDefinitions: {} })
			;(mockIconThemeGenerator.writeIconThemeFile as any).mockResolvedValue(undefined)
			;(mockCommands.executeCommand as any).mockResolvedValue(undefined)
			;(mockPath.join as any)
				.mockReturnValueOnce('/test/extension/assets/themes/base.theme.json')
				.mockReturnValueOnce('/test/extension/assets/themes')
				.mockReturnValueOnce('/test/extension/assets/themes/generated.theme.json')
			;(mockConfigService.getUserIconsDirectory as any).mockResolvedValue('/test/user-icons')
			;(mockConfigService.getCustomMappings as any).mockResolvedValue({})
			;(mockConfigService.getHideArrowsSetting as any).mockResolvedValue(false)

			await service.revertIconAssignment([mockUri as any])

			expect(mockFileSystem.stat).toHaveBeenCalledWith(mockUri)
			expect(mockCommonUtils.errMsg).toHaveBeenCalledWith(
				'Error getting resource stats for /test/path/file.ts',
				expect.any(Error),
			)
			// Should still show success message because the method continues even with errors
			expect(mockWindow.showInformationMessage).toHaveBeenCalledWith('Icon assignments reverted for 1 resource(s).')
		})

		it('should handle configuration update errors in assignIconToResource', async () => {
			const mockUri = { fsPath: '/test/path/file.ts' }
			const mockStat = { isDirectory: () => false, isFile: () => true }

			;(mockFileSystem.stat as any).mockResolvedValue(mockStat)
			;(mockPath.basename as any).mockReturnValue('file.ts')
			;(mockIconPicker.showAvailableIconsQuickPick as any).mockResolvedValue('_typescript')
			;(mockConfigService.updateCustomMappings as any).mockRejectedValue(new Error('Config update failed'))

			await expect(service.assignIconToResource([mockUri as any])).rejects.toThrow('Config update failed')

			expect(mockConfigService.updateCustomMappings).toHaveBeenCalled()
			// Should not show success message if config update fails
			expect(mockWindow.showInformationMessage).not.toHaveBeenCalledWith(expect.stringContaining('Icon assigned'))
		})

		it('should handle configuration update errors in revertIconAssignment', async () => {
			const mockUri = { fsPath: '/test/path/file.ts' }
			const mockStat = { isDirectory: () => false, isFile: () => true }

			;(mockFileSystem.stat as any).mockResolvedValue(mockStat)
			;(mockPath.basename as any).mockReturnValue('file.ts')
			;(mockConfigService.updateCustomMappings as any).mockRejectedValue(new Error('Config update failed'))

			await expect(service.revertIconAssignment([mockUri as any])).rejects.toThrow('Config update failed')

			expect(mockConfigService.updateCustomMappings).toHaveBeenCalled()
			// Should not show success message if config update fails
			expect(mockWindow.showInformationMessage).not.toHaveBeenCalledWith(expect.stringContaining('Icon assignments reverted'))
		})

		it('should handle large resource arrays efficiently', async () => {
			const mockUris = Array.from({ length: 100 }, (_, i) => ({ fsPath: `/test/path/file${i}.ts` }))
			const mockStat = { isDirectory: () => false, isFile: () => true }

			;(mockFileSystem.stat as any).mockResolvedValue(mockStat)
			;(mockPath.basename as any).mockImplementation(path => path.split('/').pop())
			;(mockIconPicker.showAvailableIconsQuickPick as any).mockResolvedValue('_typescript')
			;(mockConfigService.updateCustomMappings as any).mockImplementation(async (fn) => {
				const mappings = {}

				await fn(mappings)
				return mappings
			})
			;(mockIconThemeGenerator.generateIconThemeManifest as any).mockResolvedValue({ iconDefinitions: {} })
			;(mockIconThemeGenerator.writeIconThemeFile as any).mockResolvedValue(undefined)
			;(mockCommands.executeCommand as any).mockResolvedValue(undefined)
			;(mockPath.join as any)
				.mockReturnValueOnce('/test/extension/assets/themes/base.theme.json')
				.mockReturnValueOnce('/test/extension/assets/themes')
				.mockReturnValueOnce('/test/extension/assets/themes/generated.theme.json')
			;(mockConfigService.getUserIconsDirectory as any).mockResolvedValue('/test/user-icons')
			;(mockConfigService.getCustomMappings as any).mockResolvedValue({})
			;(mockConfigService.getHideArrowsSetting as any).mockResolvedValue(false)

			await service.assignIconToResource(mockUris as any)

			expect(mockFileSystem.stat).toHaveBeenCalledTimes(100)
			expect(mockConfigService.updateCustomMappings).toHaveBeenCalled()
			expect(mockWindow.showInformationMessage).toHaveBeenCalledWith('Icon assigned to 100 resource(s).')
		})

		it('should handle invalid URIs gracefully', async () => {
			const invalidUris = [
				{ fsPath: '' },
				{ fsPath: null },
				{ fsPath: undefined },
			]

			for (const invalidUri of invalidUris) {
				(mockFileSystem.stat as any).mockRejectedValue(new Error('Invalid URI'))
				;(mockIconPicker.showAvailableIconsQuickPick as any).mockResolvedValue('_typescript')
				;(mockConfigService.updateCustomMappings as any).mockImplementation(async (fn) => {
					const mappings = {}

					await fn(mappings)
					return mappings
				})
				;(mockIconThemeGenerator.generateIconThemeManifest as any).mockResolvedValue({ iconDefinitions: {} })
				;(mockIconThemeGenerator.writeIconThemeFile as any).mockResolvedValue(undefined)
				;(mockCommands.executeCommand as any).mockResolvedValue(undefined)
				;(mockPath.join as any)
					.mockReturnValueOnce('/test/extension/assets/themes/base.theme.json')
					.mockReturnValueOnce('/test/extension/assets/themes')
					.mockReturnValueOnce('/test/extension/assets/themes/generated.theme.json')
				;(mockConfigService.getUserIconsDirectory as any).mockResolvedValue('/test/user-icons')
				;(mockConfigService.getCustomMappings as any).mockResolvedValue({})
				;(mockConfigService.getHideArrowsSetting as any).mockResolvedValue(false)

				await service.assignIconToResource([invalidUri as any])

				expect(mockCommonUtils.errMsg).toHaveBeenCalledWith(
					expect.stringContaining('Error getting resource stats'),
					expect.any(Error),
				)
			}
		})
	})
})
