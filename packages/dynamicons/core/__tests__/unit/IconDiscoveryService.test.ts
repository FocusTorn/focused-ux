import { describe, it, expect, vi, beforeEach } from 'vitest'
import { IconDiscoveryService } from '../../src/services/IconDiscoveryService.js'
import type { IFileSystem } from '../../src/_interfaces/IFileSystem.js'
import type { IPath } from '../../src/_interfaces/IPath.js'
import type { ICommonUtils } from '../../src/_interfaces/ICommonUtils.js'

// Mock vscode
vi.mock('vscode', () => ({
	Uri: {
		file: (path: string) => ({
			fsPath: path,
			toString: () => path
		})
	}
}))

// Mock dependencies
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

describe('IconDiscoveryService', () => {
	let service: IconDiscoveryService
	const extensionPath = '/test/extension'

	beforeEach(() => {
		vi.clearAllMocks()
		service = new IconDiscoveryService(mockFileSystem, mockPath, mockCommonUtils, extensionPath)
	})

	describe('getIconOptionsFromDirectory', () => {
		it('should return file icons from directory', async () => {
			const directoryPath = '/test/icons'
			const entries = [
				{ name: 'file-icon.svg', isFile: () => true },
				{ name: 'folder-icon.svg', isFile: () => true },
				{ name: 'not-an-icon.txt', isFile: () => true },
				{ name: 'subdir', isDirectory: () => true },
			]

			;(mockFileSystem.readdir as any).mockResolvedValue(entries)
			;(mockPath.parse as any).mockImplementation((name: string) => ({ name: name.replace('.svg', '') }))
			;(mockPath.join as any).mockImplementation((dir: string, file: string) => `${dir}/${file}`)

			const result = await service.getIconOptionsFromDirectory(directoryPath, 'file')

			expect(result).toHaveLength(2)
			expect(result[0]).toEqual({
				label: 'file-icon',
				description: '(file) file-icon.svg',
				iconPath: '/test/icons/file-icon.svg',
				iconNameInDefinitions: '_file-icon',
			})
			expect(result[1]).toEqual({
				label: 'icon',
				description: '(file) folder-icon.svg',
				iconPath: '/test/icons/folder-icon.svg',
				iconNameInDefinitions: '_folder-icon',
			})
		})

		it('should return folder icons with folder prefix removed', async () => {
			const directoryPath = '/test/icons'
			const entries = [
				{ name: 'folder-src.svg', isFile: () => true },
				{ name: 'folder-open.svg', isFile: () => true },
			]

			;(mockFileSystem.readdir as any).mockResolvedValue(entries)
			;(mockPath.parse as any).mockImplementation((name: string) => ({ name: name.replace('.svg', '') }))
			;(mockPath.join as any).mockImplementation((dir: string, file: string) => `${dir}/${file}`)

			const result = await service.getIconOptionsFromDirectory(directoryPath, 'folder')

			expect(result).toHaveLength(2)
			expect(result[0]).toEqual({
				label: 'open',
				description: '(folder) folder-open.svg',
				iconPath: '/test/icons/folder-open.svg',
				iconNameInDefinitions: '_folder-open',
			})
			expect(result[1]).toEqual({
				label: 'src',
				description: '(folder) folder-src.svg',
				iconPath: '/test/icons/folder-src.svg',
				iconNameInDefinitions: '_folder-src',
			})
		})

		it('should return user icons with user prefix', async () => {
			const directoryPath = '/test/user-icons'
			const entries = [
				{ name: 'custom-icon.svg', isFile: () => true },
				{ name: 'another-icon.svg', isFile: () => true },
			]

			;(mockFileSystem.readdir as any).mockResolvedValue(entries)
			;(mockPath.parse as any).mockImplementation((name: string) => ({ name: name.replace('.svg', '') }))
			;(mockPath.join as any).mockImplementation((dir: string, file: string) => `${dir}/${file}`)

			const result = await service.getIconOptionsFromDirectory(directoryPath, 'user')

			expect(result).toHaveLength(2)
			expect(result[0]).toEqual({
				label: 'another-icon',
				description: '(user) another-icon.svg',
				iconPath: '/test/user-icons/another-icon.svg',
				iconNameInDefinitions: '_user_another-icon',
			})
			expect(result[1]).toEqual({
				label: 'custom-icon',
				description: '(user) custom-icon.svg',
				iconPath: '/test/user-icons/custom-icon.svg',
				iconNameInDefinitions: '_user_custom-icon',
			})
		})

		it('should apply filter function', async () => {
			const directoryPath = '/test/icons'
			const entries = [
				{ name: 'icon1.svg', isFile: () => true },
				{ name: 'icon2.svg', isFile: () => true },
				{ name: 'icon3.svg', isFile: () => true },
			]

			;(mockFileSystem.readdir as any).mockResolvedValue(entries)
			;(mockPath.parse as any).mockImplementation((name: string) => ({ name: name.replace('.svg', '') }))
			;(mockPath.join as any).mockImplementation((dir: string, file: string) => `${dir}/${file}`)

			const filter = (name: string) => name.includes('2')

			const result = await service.getIconOptionsFromDirectory(directoryPath, 'file', filter)

			expect(result).toHaveLength(1)
			expect(result[0].label).toBe('icon2')
		})

		it('should handle directory read error', async () => {
			const directoryPath = '/test/icons'
			const error = new Error('Permission denied')
			error.code = 'EACCES'

			;(mockFileSystem.readdir as any).mockRejectedValue(error)

			const result = await service.getIconOptionsFromDirectory(directoryPath, 'file')

			expect(result).toEqual([])
			expect(mockCommonUtils.errMsg).toHaveBeenCalledWith(
				`Error reading icon directory ${directoryPath}`,
				error
			)
		})

		it('should ignore ENOENT errors', async () => {
			const directoryPath = '/test/icons'
			const error = new Error('Directory not found')
			error.code = 'ENOENT'

			;(mockFileSystem.readdir as any).mockRejectedValue(error)

			const result = await service.getIconOptionsFromDirectory(directoryPath, 'file')

			expect(result).toEqual([])
			expect(mockCommonUtils.errMsg).not.toHaveBeenCalled()
		})

		it('should sort icons alphabetically', async () => {
			const directoryPath = '/test/icons'
			const entries = [
				{ name: 'zebra.svg', isFile: () => true },
				{ name: 'apple.svg', isFile: () => true },
				{ name: 'banana.svg', isFile: () => true },
			]

			;(mockFileSystem.readdir as any).mockResolvedValue(entries)
			;(mockPath.parse as any).mockImplementation((name: string) => ({ name: name.replace('.svg', '') }))
			;(mockPath.join as any).mockImplementation((dir: string, file: string) => `${dir}/${file}`)

			const result = await service.getIconOptionsFromDirectory(directoryPath, 'file')

			expect(result).toHaveLength(3)
			expect(result[0].label).toBe('apple')
			expect(result[1].label).toBe('banana')
			expect(result[2].label).toBe('zebra')
		})

		it('should handle folder icons with open suffix removal', async () => {
			const directoryPath = '/test/icons'
			const entries = [
				{ name: 'folder-open.svg', isFile: () => true },
				{ name: 'folder-closed.svg', isFile: () => true },
			]

			;(mockFileSystem.readdir as any).mockResolvedValue(entries)
			;(mockPath.parse as any).mockImplementation((name: string) => ({ name: name.replace('.svg', '') }))
			;(mockPath.join as any).mockImplementation((dir: string, file: string) => `${dir}/${file}`)

			const result = await service.getIconOptionsFromDirectory(directoryPath, 'folder')

			expect(result).toHaveLength(2)
			expect(result[0]).toEqual({
				label: 'closed',
				description: '(folder) folder-closed.svg',
				iconPath: '/test/icons/folder-closed.svg',
				iconNameInDefinitions: '_folder-closed',
			})
			expect(result[1]).toEqual({
				label: 'open',
				description: '(folder) folder-open.svg',
				iconPath: '/test/icons/folder-open.svg',
				iconNameInDefinitions: '_folder-open',
			})
		})
	})

	describe('getBuiltInIconDirectories', () => {
		it('should return correct built-in icon directories', async () => {
			;(mockPath.join as any).mockImplementation((...args: string[]) => args.join('/'))

			const result = await service.getBuiltInIconDirectories()

			expect(result).toEqual({
				fileIconsDir: '/test/extension/assets/icons/file_icons',
				folderIconsDir: '/test/extension/assets/icons/folder_icons'
			})
			expect(mockPath.join).toHaveBeenCalledWith(extensionPath, 'assets/icons/file_icons')
			expect(mockPath.join).toHaveBeenCalledWith(extensionPath, 'assets/icons/folder_icons')
		})
	})
}) 