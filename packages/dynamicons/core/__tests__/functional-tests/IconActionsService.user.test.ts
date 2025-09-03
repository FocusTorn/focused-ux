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
vi.mock('vscode', () =>
	({
		Uri: {
			file: (path: string) =>
				({
					fsPath: path,
					toString: () =>
						path,
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

describe('IconActionsService - User Assignments', () => {
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
})
