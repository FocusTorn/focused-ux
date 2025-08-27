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
import type { IUriFactory } from '../../src/_interfaces/IUri.js'

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

const mockUriFactory: IUriFactory = {
	file: vi.fn((path: string) => ({
		fsPath: path,
		scheme: 'file',
		authority: '',
		path,
		query: '',
		fragment: '',
		toString: () => path,
		with: vi.fn(),
	})),
	parse: vi.fn(),
	create: vi.fn(),
	joinPath: vi.fn(),
}

describe('IconActionsService - Assign', () => {
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
			mockUriFactory,
		)
	})

	describe('assignIconToResource', () => {
		it('should assign icon to single resource', async () => {
			// Mock the regenerateAndApplyTheme method to avoid complex implementation
			const originalRegenerateAndApplyTheme = (service as any).regenerateAndApplyTheme

			;(service as any).regenerateAndApplyTheme = vi.fn().mockResolvedValue(undefined)

			const resourceUri = { fsPath: '/test/file.ts', toString: () => '/test/file.ts' } as any
			const selectedIcon = '_typescript'

			;(mockFileSystem.stat as any).mockResolvedValue({ isFile: () => true, isDirectory: () => false })
			;(mockPath.basename as any).mockReturnValue('file.ts')
			;(mockIconPicker.showAvailableIconsQuickPick as any).mockResolvedValue(selectedIcon)
			;(mockConfigService.updateCustomMappings as any).mockResolvedValue(undefined)

			await service.assignIconToResource([resourceUri])

			expect(mockIconPicker.showAvailableIconsQuickPick).toHaveBeenCalledWith('file', undefined)
			expect(mockConfigService.updateCustomMappings).toHaveBeenCalledWith(expect.any(Function))
			expect(mockWindow.showInformationMessage).toHaveBeenCalledWith('Icon assigned to 1 resource(s).')
			expect((service as any).regenerateAndApplyTheme).toHaveBeenCalled()

			// Restore original method
			;(service as any).regenerateAndApplyTheme = originalRegenerateAndApplyTheme
		})

		it('should assign icon to multiple resources', async () => {
			// Mock the regenerateAndApplyTheme method to avoid complex implementation
			const originalRegenerateAndApplyTheme = (service as any).regenerateAndApplyTheme

			;(service as any).regenerateAndApplyTheme = vi.fn().mockResolvedValue(undefined)

			const resourceUris = [
				{ fsPath: '/test/file1.ts', toString: () => '/test/file1.ts' } as any,
				{ fsPath: '/test/file2.ts', toString: () => '/test/file2.ts' } as any,
			]
			const selectedIcon = '_typescript'

			;(mockFileSystem.stat as any).mockResolvedValue({ isFile: () => true, isDirectory: () => false })
			;(mockPath.basename as any).mockReturnValue('file.ts')
			;(mockIconPicker.showAvailableIconsQuickPick as any).mockResolvedValue(selectedIcon)
			;(mockConfigService.updateCustomMappings as any).mockResolvedValue(undefined)

			await service.assignIconToResource(resourceUris)

			expect(mockWindow.showInformationMessage).toHaveBeenCalledWith('Icon assigned to 2 resource(s).')
			expect((service as any).regenerateAndApplyTheme).toHaveBeenCalled()

			// Restore original method
			;(service as any).regenerateAndApplyTheme = originalRegenerateAndApplyTheme
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
			// Mock the regenerateAndApplyTheme method to avoid complex implementation
			const originalRegenerateAndApplyTheme = (service as any).regenerateAndApplyTheme

			;(service as any).regenerateAndApplyTheme = vi.fn().mockResolvedValue(undefined)

			const resourceUri = { fsPath: '/test/file.ts', toString: () => '/test/file.ts' } as any
			const selectedIcon = '_typescript'

			;(mockFileSystem.stat as any).mockRejectedValue(new Error('Stat failed'))
			;(mockIconPicker.showAvailableIconsQuickPick as any).mockResolvedValue(selectedIcon)
			;(mockConfigService.updateCustomMappings as any).mockResolvedValue(undefined)

			await service.assignIconToResource([resourceUri])

			// The service handles the error gracefully and continues processing
			expect(mockConfigService.updateCustomMappings).toHaveBeenCalledWith(expect.any(Function))
			expect(mockWindow.showInformationMessage).toHaveBeenCalledWith('Icon assigned to 1 resource(s).')
			expect((service as any).regenerateAndApplyTheme).toHaveBeenCalled()

			// Restore original method
			;(service as any).regenerateAndApplyTheme = originalRegenerateAndApplyTheme
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
})
