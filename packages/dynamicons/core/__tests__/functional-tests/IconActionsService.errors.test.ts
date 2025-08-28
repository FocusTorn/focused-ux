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

describe('IconActionsService - Error Handling', () => {
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

	describe('Edge Cases and Error Handling', () => {
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

		it('should handle invalid URIs gracefully', async () => {
			// Mock the regenerateAndApplyTheme method to avoid complex implementation
			const originalRegenerateAndApplyTheme = (service as any).regenerateAndApplyTheme

			;(service as any).regenerateAndApplyTheme = vi.fn().mockResolvedValue(undefined)

			const invalidUri = { fsPath: '' }

			;(mockFileSystem.stat as any).mockRejectedValue(new Error('Invalid URI'))
			;(mockIconPicker.showAvailableIconsQuickPick as any).mockResolvedValue('_typescript')
			;(mockConfigService.updateCustomMappings as any).mockImplementation(async (fn) => {
				const mappings = {}

				await fn(mappings)
				return mappings
			})

			await service.assignIconToResource([invalidUri as any])

			expect(mockCommonUtils.errMsg).toHaveBeenCalledWith(
				expect.stringContaining('Error getting resource stats'),
				expect.any(Error),
			)

			// Restore original method
			;(service as any).regenerateAndApplyTheme = originalRegenerateAndApplyTheme
		})
	})
})
