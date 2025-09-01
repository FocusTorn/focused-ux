import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as vscode from 'vscode'
import { IconPickerService, IconDiscoveryService, ConfigurationService } from '@fux/dynamicons-core'
import { QuickPickAdapter, WindowAdapter, FileSystemAdapter, CommonUtilsAdapter, PathAdapter } from '../../src/adapters/index.js'

// Mock vscode
vi.mock('vscode', () => ({
	window: {
		showQuickPick: vi.fn(),
		showInformationMessage: vi.fn(),
		showWarningMessage: vi.fn(),
		showErrorMessage: vi.fn(),
	},
	Uri: {
		file: (path: string) => ({
			fsPath: path,
			toString: () => path,
		}),
	},
}))

describe('Icon Picker Functional Tests', () => {
	/* eslint-disable unused-imports/no-unused-vars */
	let iconPickerService: IconPickerService
	let mockVscodeWindow: any
	/* eslint-enable unused-imports/no-unused-vars */

	beforeEach(() => {
		vi.clearAllMocks()
		
		// Create real adapters
		const windowAdapter = new WindowAdapter()
		const quickPickAdapter = new QuickPickAdapter()
		const fileSystemAdapter = new FileSystemAdapter()
		const commonUtilsAdapter = new CommonUtilsAdapter(windowAdapter)
		const pathAdapter = new PathAdapter()
		
		// Create real services with mocked dependencies
		const iconDiscoveryService = new IconDiscoveryService(
			fileSystemAdapter,
			pathAdapter,
			commonUtilsAdapter,
			'/test/extension/path',
		)
		const configService = new ConfigurationService(
			{} as any, // workspace adapter
			commonUtilsAdapter,
		)

		iconPickerService = new IconPickerService(
			windowAdapter,
			quickPickAdapter,
			fileSystemAdapter,
			commonUtilsAdapter,
			iconDiscoveryService,
			configService,
		)

		mockVscodeWindow = vscode.window
	})

	describe('Icon Display in QuickPick', () => {
		it('should display icons with their visual representation', async () => {
			// Mock the icon discovery to return test icons
			const mockIconDiscovery = {
				getBuiltInIconDirectories: vi.fn().mockResolvedValue({
					fileIconsDir: '/test/file-icons',
					folderIconsDir: '/test/folder-icons',
				}),
				getIconOptionsFromDirectory: vi.fn().mockResolvedValue([
					{
						label: 'typescript',
						description: '(file) typescript.svg',
						iconPath: '/test/file-icons/typescript.svg',
						iconNameInDefinitions: '_typescript',
					},
					{
						label: 'javascript',
						description: '(file) javascript.svg',
						iconPath: '/test/file-icons/javascript.svg',
						iconNameInDefinitions: '_javascript',
					},
				]),
			}

			// Mock the config service
			const mockConfigService = {
				getUserIconsDirectory: vi.fn().mockResolvedValue(undefined),
			}

			// Mock the file system
			const mockFileSystem = {
				access: vi.fn().mockResolvedValue(undefined),
				readdir: vi.fn().mockResolvedValue([]),
			}

			// Create a test instance with mocked dependencies
			const testIconPicker = new IconPickerService(
				{} as any, // window
				{} as any, // quickPick
				mockFileSystem as any,
				{} as any, // commonUtils
				mockIconDiscovery as any,
				mockConfigService as any,
			)

			// Mock the quick pick to return a selection
			const mockQuickPick = {
				showQuickPickSingle: vi.fn().mockResolvedValue('_typescript'),
			}

			// Replace the quick pick adapter
			;(testIconPicker as any).quickPick = mockQuickPick

			// Call the method
			const result = await testIconPicker.showAvailableIconsQuickPick('file')

			// Verify the quick pick was called with items that have iconPath
			expect(mockQuickPick.showQuickPickSingle).toHaveBeenCalledWith(
				expect.arrayContaining([
					expect.objectContaining({
						label: 'typescript',
						description: '(file) typescript.svg',
						iconPath: '/test/file-icons/typescript.svg',
						iconNameInDefinitions: '_typescript',
					}),
				]),
				expect.any(Object),
				'iconNameInDefinitions',
			)

			expect(result).toBe('_typescript')
		})

		it('should show both file and folder icons when no type specified', async () => {
			const mockIconDiscovery = {
				getBuiltInIconDirectories: vi.fn().mockResolvedValue({
					fileIconsDir: '/test/file-icons',
					folderIconsDir: '/test/folder-icons',
				}),
				getIconOptionsFromDirectory: vi.fn()
					.mockResolvedValueOnce([ // file icons
						{
							label: 'typescript',
							description: '(file) typescript.svg',
							iconPath: '/test/file-icons/typescript.svg',
							iconNameInDefinitions: '_typescript',
						},
					])
					.mockResolvedValueOnce([ // folder icons
						{
							label: 'src',
							description: '(folder) folder-src.svg',
							iconPath: '/test/folder-icons/folder-src.svg',
							iconNameInDefinitions: '_folder-src',
						},
					]),
			}

			const mockConfigService = {
				getUserIconsDirectory: vi.fn().mockResolvedValue(undefined),
			}

			const mockFileSystem = {
				access: vi.fn().mockResolvedValue(undefined),
				readdir: vi.fn().mockResolvedValue([]),
			}

			const testIconPicker = new IconPickerService(
				{} as any,
				{} as any,
				mockFileSystem as any,
				{} as any,
				mockIconDiscovery as any,
				mockConfigService as any,
			)

			const mockQuickPick = {
				showQuickPickSingle: vi.fn().mockResolvedValue('_typescript'),
			}

			;(testIconPicker as any).quickPick = mockQuickPick

			const result = await testIconPicker.showAvailableIconsQuickPick()

			// Should have called getIconOptionsFromDirectory twice (once for files, once for folders)
			expect(mockIconDiscovery.getIconOptionsFromDirectory).toHaveBeenCalledTimes(2)
			expect(result).toBe('_typescript')
		})

		it('should filter out open folder icons when showing folder icons', async () => {
			const mockIconDiscovery = {
				getBuiltInIconDirectories: vi.fn().mockResolvedValue({
					fileIconsDir: '/test/file-icons',
					folderIconsDir: '/test/folder-icons',
				}),
				getIconOptionsFromDirectory: vi.fn().mockResolvedValue([
					{
						label: 'src',
						description: '(folder) folder-src.svg',
						iconPath: '/test/folder-icons/folder-src.svg',
						iconNameInDefinitions: '_folder-src',
					},
					{
						label: 'src-open',
						description: '(folder) folder-src-open.svg',
						iconPath: '/test/folder-icons/folder-src-open.svg',
						iconNameInDefinitions: '_folder-src-open',
					},
				]),
			}

			const mockConfigService = {
				getUserIconsDirectory: vi.fn().mockResolvedValue(undefined),
			}

			const mockFileSystem = {
				access: vi.fn().mockResolvedValue(undefined),
				readdir: vi.fn().mockResolvedValue([]),
			}

			const testIconPicker = new IconPickerService(
				{} as any,
				{} as any,
				mockFileSystem as any,
				{} as any,
				mockIconDiscovery as any,
				mockConfigService as any,
			)

			const mockQuickPick = {
				showQuickPickSingle: vi.fn().mockResolvedValue('_folder-src'),
			}

			;(testIconPicker as any).quickPick = mockQuickPick

			await testIconPicker.showAvailableIconsQuickPick('folder')

			// Verify that the filter was applied (open folder icons should be filtered out)
			expect(mockIconDiscovery.getIconOptionsFromDirectory).toHaveBeenCalledWith(
				'/test/folder-icons',
				'folder',
				expect.any(Function),
			)
		})

		it('should show user icons when user icons directory is configured', async () => {
			const mockIconDiscovery = {
				getBuiltInIconDirectories: vi.fn().mockResolvedValue({
					fileIconsDir: '/test/file-icons',
					folderIconsDir: '/test/folder-icons',
				}),
				getIconOptionsFromDirectory: vi.fn()
					.mockResolvedValueOnce([{ // file icons
						label: 'typescript',
						description: '(file) typescript.svg',
						iconPath: '/test/file-icons/typescript.svg',
						iconNameInDefinitions: '_typescript',
					}])
					.mockResolvedValueOnce([{ // folder icons
						label: 'folder',
						description: '(folder) folder.svg',
						iconPath: '/test/folder-icons/folder.svg',
						iconNameInDefinitions: '_folder',
					}])
					.mockResolvedValueOnce([ // user icons
						{
							label: 'custom-icon',
							description: '(user) custom-icon.svg',
							iconPath: '/test/user-icons/custom-icon.svg',
							iconNameInDefinitions: '_user_custom-icon',
						},
					]),
			}

			const mockConfigService = {
				getUserIconsDirectory: vi.fn().mockResolvedValue('/test/user-icons'),
			}

			const mockFileSystem = {
				access: vi.fn().mockResolvedValue(undefined),
				readdir: vi.fn().mockResolvedValue([]),
			}

			const mockCommonUtils = {
				errMsg: vi.fn(),
			}

			const mockWindow = {
				showInformationMessage: vi.fn(),
				showErrorMessage: vi.fn(),
				showWarningMessage: vi.fn(),
			}

			const mockUriFactory = {
				file: vi.fn().mockImplementation((path: string) => ({ fsPath: path })),
			}

			const testIconPicker = new IconPickerService(
				mockWindow as any,
				{} as any,
				mockFileSystem as any,
				mockCommonUtils as any,
				mockIconDiscovery as any,
				mockConfigService as any,
				mockUriFactory as any,
			)

			const mockQuickPick = {
				showQuickPickSingle: vi.fn().mockResolvedValue('_user_custom-icon'),
			}

			;(testIconPicker as any).quickPick = mockQuickPick

			const result = await testIconPicker.showAvailableIconsQuickPick()

			expect(mockIconDiscovery.getIconOptionsFromDirectory).toHaveBeenNthCalledWith(3, '/test/user-icons', 'user')
			expect(result).toBe('_user_custom-icon')
		})

		it('should handle cancellation gracefully', async () => {
			const mockIconDiscovery = {
				getBuiltInIconDirectories: vi.fn().mockResolvedValue({
					fileIconsDir: '/test/file-icons',
					folderIconsDir: '/test/folder-icons',
				}),
				getIconOptionsFromDirectory: vi.fn().mockResolvedValue([
					{
						label: 'typescript',
						description: '(file) typescript.svg',
						iconPath: '/test/file-icons/typescript.svg',
						iconNameInDefinitions: '_typescript',
					},
				]),
			}

			const mockConfigService = {
				getUserIconsDirectory: vi.fn().mockResolvedValue(undefined),
			}

			const mockFileSystem = {
				access: vi.fn().mockResolvedValue(undefined),
				readdir: vi.fn().mockResolvedValue([]),
			}

			const testIconPicker = new IconPickerService(
				{} as any,
				{} as any,
				mockFileSystem as any,
				{} as any,
				mockIconDiscovery as any,
				mockConfigService as any,
			)

			const mockQuickPick = {
				showQuickPickSingle: vi.fn().mockResolvedValue(undefined), // User cancelled
			}

			;(testIconPicker as any).quickPick = mockQuickPick

			const result = await testIconPicker.showAvailableIconsQuickPick()

			expect(result).toBeUndefined()
		})

		it('should show warning when no icons match criteria', async () => {
			const mockIconDiscovery = {
				getBuiltInIconDirectories: vi.fn().mockResolvedValue({
					fileIconsDir: '/test/file-icons',
					folderIconsDir: '/test/folder-icons',
				}),
				getIconOptionsFromDirectory: vi.fn().mockResolvedValue([]), // No icons
			}

			const mockConfigService = {
				getUserIconsDirectory: vi.fn().mockResolvedValue(undefined),
			}

			const mockFileSystem = {
				access: vi.fn().mockResolvedValue(undefined),
				readdir: vi.fn().mockResolvedValue([]),
			}

			const mockWindow = {
				showInformationMessage: vi.fn(),
			}

			const testIconPicker = new IconPickerService(
				mockWindow as any,
				{} as any,
				mockFileSystem as any,
				{} as any,
				mockIconDiscovery as any,
				mockConfigService as any,
			)

			const result = await testIconPicker.showAvailableIconsQuickPick()

			expect(mockWindow.showInformationMessage).toHaveBeenCalledWith(
				'No available icons match the criteria.',
			)
			expect(result).toBeUndefined()
		})
	})
})
