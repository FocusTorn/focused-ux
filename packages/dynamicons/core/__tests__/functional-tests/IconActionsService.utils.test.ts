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

const mockUriFactory: IUriFactory = {
	file: vi.fn((path: string) =>
		({
			fsPath: path,
			scheme: 'file',
			authority: '',
			path,
			query: '',
			fragment: '',
			toString: () =>
				path,
			with: vi.fn(),
		})),
	parse: vi.fn(),
	create: vi.fn(),
	joinPath: vi.fn(),
}

describe('IconActionsService - Utils', () => {
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

	describe('getResourceName', () => {
		it('should get file name from file URI', async () => {
			const fileUri = { fsPath: '/test/path/file.ts', toString: () =>
				'/test/path/file.ts' } as any

			;(mockFileSystem.stat as any).mockResolvedValue({ isFile: () =>
				true, isDirectory: () =>
				false })
			;(mockPath.basename as any).mockReturnValue('file.ts')

			const result = await service.getResourceName(fileUri)

			expect(result).toBe('file.ts')
			expect(mockPath.basename).toHaveBeenCalledWith('/test/path/file.ts')
		})

		it('should get folder name from folder URI', async () => {
			const folderUri = { fsPath: '/test/path/folder', toString: () =>
				'/test/path/folder' } as any

			;(mockFileSystem.stat as any).mockResolvedValue({ isDirectory: () =>
				true, isFile: () =>
				false })
			;(mockPath.basename as any).mockReturnValue('folder')

			const result = await service.getResourceName(folderUri)

			expect(result).toBe('folder')
			expect(mockPath.basename).toHaveBeenCalledWith('/test/path/folder')
		})

		it('should handle stat error gracefully', async () => {
			const uri = { fsPath: '/test/path/file.ts', toString: () =>
				'/test/path/file.ts' } as any

			;(mockFileSystem.stat as any).mockRejectedValue(new Error('Stat failed'))
			;(mockPath.basename as any).mockReturnValue('file.ts')

			const result = await service.getResourceName(uri)

			expect(result).toBeUndefined()
			expect(mockCommonUtils.errMsg).toHaveBeenCalledWith(
				expect.stringContaining('Error getting resource stats'),
				expect.any(Error),
			)
		})
	})

	describe('getAssociationKey', () => {
		it('should generate file association key', async () => {
			const result = await service.getAssociationKey('file.ts', 'file')

			expect(result).toBe('file:file.ts')
		})

		it('should generate folder association key', async () => {
			const result = await service.getAssociationKey('folder', 'folder')

			expect(result).toBe('folder:folder')
		})

		it('should generate language association key', async () => {
			const result = await service.getAssociationKey('typescript', 'language')

			expect(result).toBe('language:typescript')
		})
	})
})
