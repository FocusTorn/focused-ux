import { describe, it, expect, vi, beforeEach } from 'vitest'
import { IconPickerService } from '../../src/services/IconPickerService.js'
import type { IWindow } from '../../src/_interfaces/IWindow.js'
import type { IQuickPick } from '../../src/_interfaces/IQuickPick.js'
import type { IFileSystem } from '../../src/_interfaces/IFileSystem.js'
import type { ICommonUtils } from '../../src/_interfaces/ICommonUtils.js'
import type { IIconDiscoveryService } from '../../src/services/IconDiscoveryService.js'
import type { IConfigurationService } from '../../src/services/ConfigurationService.js'
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

const mockQuickPick: IQuickPick = {
	showQuickPickSingle: vi.fn(),
	showQuickPickMultiple: vi.fn(),
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

const mockCommonUtils: ICommonUtils = {
	delay: vi.fn(),
	errMsg: vi.fn(),
}

const mockIconDiscovery: IIconDiscoveryService = {
	getIconOptionsFromDirectory: vi.fn(),
	getBuiltInIconDirectories: vi.fn(),
}

const mockConfigService: IConfigurationService = {
	getUserIconsDirectory: vi.fn(),
	getCustomMappings: vi.fn(),
	getHideArrowsSetting: vi.fn(),
	updateCustomMappings: vi.fn(),
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

describe('IconPickerService', () => {
	let service: IconPickerService

	beforeEach(() => {
		vi.clearAllMocks()
		service = new IconPickerService(
			mockWindow,
			mockQuickPick,
			mockFileSystem,
			mockCommonUtils,
			mockIconDiscovery,
			mockConfigService,
			mockUriFactory,
		)
	})

	describe('showAvailableIconsQuickPick', () => {
		it('should show all icon types when no type specified', async () => {
			const fileIcons = [
				{ label: 'file1', iconNameInDefinitions: '_file1' },
				{ label: 'file2', iconNameInDefinitions: '_file2' },
			]
			const folderIcons = [
				{ label: 'folder1', iconNameInDefinitions: '_folder1' },
			]
			const userIcons = [
				{ label: 'user1', iconNameInDefinitions: 'usr-user1' },
			]

			;(mockIconDiscovery.getBuiltInIconDirectories as any).mockResolvedValue({
				fileIconsDir: '/test/file-icons',
				folderIconsDir: '/test/folder-icons',
			})
			;(mockConfigService.getUserIconsDirectory as any).mockResolvedValue('/test/user-icons')
			;(mockFileSystem.access as any).mockResolvedValue(undefined)
			;(mockIconDiscovery.getIconOptionsFromDirectory as any)
				.mockResolvedValueOnce(fileIcons) // file icons
				.mockResolvedValueOnce(folderIcons) // folder icons
				.mockResolvedValueOnce(userIcons) // user icons
			;(mockQuickPick.showQuickPickSingle as any).mockResolvedValue('_file1')

			const result = await service.showAvailableIconsQuickPick()

			expect(mockIconDiscovery.getIconOptionsFromDirectory).toHaveBeenCalledWith('/test/file-icons', 'file')
			expect(mockIconDiscovery.getIconOptionsFromDirectory).toHaveBeenCalledWith('/test/folder-icons', 'folder', expect.any(Function))
			expect(mockIconDiscovery.getIconOptionsFromDirectory).toHaveBeenCalledWith('/test/user-icons', 'user')
			expect(mockQuickPick.showQuickPickSingle).toHaveBeenCalledWith(
				expect.arrayContaining([
					...userIcons,
					...fileIcons,
					...folderIcons,
				]),
				expect.objectContaining({
					placeHolder: 'Select an icon definition',
					matchOnDescription: true,
					matchOnDetail: true,
				}),
				'iconNameInDefinitions',
			)
			expect(result).toBe('_file1')
		})

		it('should show only file icons when type specified as file', async () => {
			const fileIcons = [
				{ label: 'file1', iconNameInDefinitions: '_file1' },
				{ label: 'file2', iconNameInDefinitions: '_file2' },
			]

			;(mockIconDiscovery.getBuiltInIconDirectories as any).mockResolvedValue({
				fileIconsDir: '/test/file-icons',
				folderIconsDir: '/test/folder-icons',
			})
			;(mockConfigService.getUserIconsDirectory as any).mockResolvedValue('/test/user-icons')
			;(mockFileSystem.access as any).mockResolvedValue(undefined)
			;(mockIconDiscovery.getIconOptionsFromDirectory as any).mockResolvedValue(fileIcons)
			;(mockQuickPick.showQuickPickSingle as any).mockResolvedValue('_file1')

			const result = await service.showAvailableIconsQuickPick('file')

			expect(mockIconDiscovery.getIconOptionsFromDirectory).toHaveBeenCalledWith('/test/file-icons', 'file')
			expect(mockIconDiscovery.getIconOptionsFromDirectory).not.toHaveBeenCalledWith('/test/folder-icons', 'folder', expect.any(Function))
			expect(result).toBe('_file1')
		})

		it('should show only folder icons when type specified as folder', async () => {
			const folderIcons = [
				{ label: 'folder1', iconNameInDefinitions: '_folder1' },
			]

			;(mockIconDiscovery.getBuiltInIconDirectories as any).mockResolvedValue({
				fileIconsDir: '/test/file-icons',
				folderIconsDir: '/test/folder-icons',
			})
			;(mockConfigService.getUserIconsDirectory as any).mockResolvedValue('/test/user-icons')
			;(mockFileSystem.access as any).mockResolvedValue(undefined)
			;(mockIconDiscovery.getIconOptionsFromDirectory as any).mockResolvedValue(folderIcons)
			;(mockQuickPick.showQuickPickSingle as any).mockResolvedValue('_folder1')

			const result = await service.showAvailableIconsQuickPick('folder')

			expect(mockIconDiscovery.getIconOptionsFromDirectory).not.toHaveBeenCalledWith('/test/file-icons', 'file')
			expect(mockIconDiscovery.getIconOptionsFromDirectory).toHaveBeenCalledWith('/test/folder-icons', 'folder', expect.any(Function))
			expect(result).toBe('_folder1')
		})

		it('should handle user icons directory not found', async () => {
			const fileIcons = [{ label: 'file1', iconNameInDefinitions: '_file1' }]

			;(mockIconDiscovery.getBuiltInIconDirectories as any).mockResolvedValue({
				fileIconsDir: '/test/file-icons',
				folderIconsDir: '/test/folder-icons',
			})
			;(mockConfigService.getUserIconsDirectory as any).mockResolvedValue('/test/user-icons')
			;(mockFileSystem.access as any).mockRejectedValue({ code: 'ENOENT' })
			;(mockIconDiscovery.getIconOptionsFromDirectory as any).mockResolvedValue(fileIcons)
			;(mockQuickPick.showQuickPickSingle as any).mockResolvedValue('_file1')

			const result = await service.showAvailableIconsQuickPick()

			expect(mockWindow.showWarningMessage).toHaveBeenCalledWith(
				expect.stringContaining('User icons directory not found'),
			)
			expect(result).toBe('_file1')
		})

		it('should handle user icons directory access error', async () => {
			const fileIcons = [{ label: 'file1', iconNameInDefinitions: '_file1' }]
			const accessError = new Error('Permission denied')

			;(mockIconDiscovery.getBuiltInIconDirectories as any).mockResolvedValue({
				fileIconsDir: '/test/file-icons',
				folderIconsDir: '/test/folder-icons',
			})
			;(mockConfigService.getUserIconsDirectory as any).mockResolvedValue('/test/user-icons')
			;(mockFileSystem.access as any).mockRejectedValue(accessError)
			;(mockIconDiscovery.getIconOptionsFromDirectory as any).mockResolvedValue(fileIcons)
			;(mockQuickPick.showQuickPickSingle as any).mockResolvedValue('_file1')

			const result = await service.showAvailableIconsQuickPick()

			expect(mockCommonUtils.errMsg).toHaveBeenCalledWith(
				expect.stringContaining('Error accessing user icons directory'),
				accessError,
			)
			expect(result).toBe('_file1')
		})

		it('should apply current filter to all icon types', async () => {
			const fileIcons = [
				{ label: 'file1', iconNameInDefinitions: '_file1' },
				{ label: 'file2', iconNameInDefinitions: '_file2' },
			]
			const folderIcons = [
				{ label: 'folder1', iconNameInDefinitions: '_folder1' },
			]

			;(mockIconDiscovery.getBuiltInIconDirectories as any).mockResolvedValue({
				fileIconsDir: '/test/file-icons',
				folderIconsDir: '/test/folder-icons',
			})
			;(mockConfigService.getUserIconsDirectory as any).mockResolvedValue(undefined)
			;(mockIconDiscovery.getIconOptionsFromDirectory as any)
				.mockResolvedValueOnce(fileIcons)
				.mockResolvedValueOnce(folderIcons)
			;(mockQuickPick.showQuickPickSingle as any).mockResolvedValue('_file1')

			const filter = (name: string) => name.includes('1')

			const result = await service.showAvailableIconsQuickPick(undefined, filter)

			expect(mockQuickPick.showQuickPickSingle).toHaveBeenCalledWith(
				expect.arrayContaining([
					{ label: 'file1', iconNameInDefinitions: '_file1' },
					{ label: 'folder1', iconNameInDefinitions: '_folder1' },
				]),
				expect.any(Object),
				'iconNameInDefinitions',
			)
			expect(result).toBe('_file1')
		})

		it('should show no icons message when no icons found', async () => {
			(mockIconDiscovery.getBuiltInIconDirectories as any).mockResolvedValue({
				fileIconsDir: '/test/file-icons',
				folderIconsDir: '/test/folder-icons',
			})
			;(mockConfigService.getUserIconsDirectory as any).mockResolvedValue(undefined)
			;(mockIconDiscovery.getIconOptionsFromDirectory as any).mockResolvedValue([])

			const result = await service.showAvailableIconsQuickPick()

			expect(mockWindow.showInformationMessage).toHaveBeenCalledWith('No available icons match the criteria.')
			expect(result).toBeUndefined()
		})

		it('should not show user icons section when no user icons', async () => {
			const fileIcons = [{ label: 'file1', iconNameInDefinitions: '_file1' }]

			;(mockIconDiscovery.getBuiltInIconDirectories as any).mockResolvedValue({
				fileIconsDir: '/test/file-icons',
				folderIconsDir: '/test/folder-icons',
			})
			;(mockConfigService.getUserIconsDirectory as any).mockResolvedValue(undefined)
			;(mockIconDiscovery.getIconOptionsFromDirectory as any).mockResolvedValue(fileIcons)
			;(mockQuickPick.showQuickPickSingle as any).mockResolvedValue('_file1')

			const result = await service.showAvailableIconsQuickPick()

			expect(mockQuickPick.showQuickPickSingle).toHaveBeenCalledWith(
				expect.arrayContaining([
					...fileIcons,
				]),
				expect.any(Object),
				'iconNameInDefinitions',
			)
			expect(mockQuickPick.showQuickPickSingle).not.toHaveBeenCalledWith(
				expect.arrayContaining([
					{ label: 'User Icons', kind: -1 },
				]),
				expect.any(Object),
				'iconNameInDefinitions',
			)
			expect(result).toBe('_file1')
		})

		it('should handle quick pick cancellation', async () => {
			const fileIcons = [{ label: 'file1', iconNameInDefinitions: '_file1' }]

			;(mockIconDiscovery.getBuiltInIconDirectories as any).mockResolvedValue({
				fileIconsDir: '/test/file-icons',
				folderIconsDir: '/test/folder-icons',
			})
			;(mockConfigService.getUserIconsDirectory as any).mockResolvedValue(undefined)
			;(mockIconDiscovery.getIconOptionsFromDirectory as any).mockResolvedValue(fileIcons)
			;(mockQuickPick.showQuickPickSingle as any).mockResolvedValue(undefined)

			const result = await service.showAvailableIconsQuickPick()

			expect(result).toBeUndefined()
		})
	})
})
