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

describe('IconActionsService - QuickPick', () => {
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
})
