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

describe('IconActionsService - Theme', () => {
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

	describe('refreshIconTheme', () => {
		it('should regenerate and apply theme successfully', async () => {
			// Mock the complex implementation to avoid timeouts
			const mockManifest = { iconDefinitions: { _test: {} } }
			const mockMappings = { 'file:test.ts': '_test' }

			;(mockConfigService.getCustomMappings as any).mockResolvedValue(mockMappings)
			;(mockConfigService.getHideArrowsSetting as any).mockResolvedValue(false)
			;(mockConfigService.getUserIconsDirectory as any).mockResolvedValue('/test/user-icons')
			;(mockIconThemeGenerator.generateIconThemeManifest as any).mockResolvedValue(mockManifest)
			;(mockIconThemeGenerator.writeIconThemeFile as any).mockResolvedValue(undefined)
			;(mockCommands.executeCommand as any).mockResolvedValue(undefined)
			;(mockPath.join as any)
				.mockReturnValueOnce('/test/extension/assets/themes/base.theme.json')
				.mockReturnValueOnce('/test/extension/assets/themes')
				.mockReturnValueOnce('/test/extension/assets/themes/dynamicons.theme.json')

			// Mock setTimeout to avoid delays
			const originalSetTimeout = globalThis.setTimeout

			globalThis.setTimeout = vi.fn((callback) => {
				callback()
				return 0 as any
			}) as any

			await service.refreshIconTheme()

			expect(mockIconThemeGenerator.generateIconThemeManifest).toHaveBeenCalled()
			expect(mockIconThemeGenerator.writeIconThemeFile).toHaveBeenCalled()
			expect(mockWindow.showInformationMessage).toHaveBeenCalledWith('Icon theme refreshed successfully.')

			// Restore original setTimeout
			globalThis.setTimeout = originalSetTimeout
		})

		it('should handle theme generation error', async () => {
			(mockConfigService.getCustomMappings as any).mockResolvedValue({})
			;(mockConfigService.getHideArrowsSetting as any).mockResolvedValue(false)
			;(mockConfigService.getUserIconsDirectory as any).mockResolvedValue('/test/user-icons')
			;(mockIconThemeGenerator.generateIconThemeManifest as any).mockRejectedValue(new Error('Generation failed'))

			await service.refreshIconTheme()

			expect(mockWindow.showErrorMessage).toHaveBeenCalledWith(
				'Failed to regenerate icon theme. Check the console for details.',
			)
		})
	})
})
