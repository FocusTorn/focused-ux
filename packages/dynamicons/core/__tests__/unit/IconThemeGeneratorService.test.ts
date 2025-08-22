import { describe, it, expect, vi, beforeEach } from 'vitest'
import { IconThemeGeneratorService } from '../../src/services/IconThemeGeneratorService.js'
import type { IFileSystem } from '../../src/_interfaces/IFileSystem.js'
import type { IPath } from '../../src/_interfaces/IPath.js'
import type { ICommonUtils } from '../../src/_interfaces/ICommonUtils.js'

// Mock vscode
vi.mock('vscode', () => ({
	Uri: {
		file: (path: string) => ({
			fsPath: path,
			scheme: 'file',
			authority: '',
			path,
			query: '',
			fragment: '',
			toString: () => path,
		}),
	},
}))

// Mock strip-json-comments
vi.mock('strip-json-comments', () => ({
	default: (content: string) => content.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, ''),
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

describe('IconThemeGeneratorService', () => {
	let service: IconThemeGeneratorService
	let baseManifestUri: any
	let generatedThemeDirUri: any

	beforeEach(() => {
		vi.clearAllMocks()
		service = new IconThemeGeneratorService(mockFileSystem, mockPath, mockCommonUtils)
		baseManifestUri = {
			fsPath: '/test/base.theme.json',
			toString: () => '/test/base.theme.json',
		}
		generatedThemeDirUri = {
			fsPath: '/test/themes',
			toString: () => '/test/themes',
		}
	})

	describe('generateIconThemeManifest', () => {
		it('should generate manifest from base theme', async () => {
			const baseManifest = {
				iconDefinitions: {
					_file: { iconPath: 'file.svg' },
					_folder: { iconPath: 'folder.svg' },
				},
				file: '_file',
				folder: '_folder',
			}

			;(mockFileSystem.readFile as any).mockResolvedValue(JSON.stringify(baseManifest))

			const result = await service.generateIconThemeManifest(baseManifestUri, generatedThemeDirUri)

			expect(result).toEqual({
				...baseManifest,
				_lastUpdated: expect.any(String),
				_watch: true,
			})
			expect(mockFileSystem.readFile).toHaveBeenCalledWith(baseManifestUri, 'utf-8')
		})

		it('should handle missing base manifest', async () => {
			(mockFileSystem.readFile as any).mockRejectedValue(new Error('File not found'))

			const result = await service.generateIconThemeManifest(baseManifestUri, generatedThemeDirUri)

			expect(result).toBeUndefined()
			expect(mockCommonUtils.errMsg).toHaveBeenCalledWith(
				expect.stringContaining('Error reading or parsing JSON file'),
				expect.any(Error),
			)
			expect(mockCommonUtils.errMsg).toHaveBeenCalledWith(
				expect.stringContaining('Base manifest not found or failed to parse'),
			)
		})

		it('should handle invalid JSON in base manifest', async () => {
			(mockFileSystem.readFile as any).mockResolvedValue('invalid json')

			const result = await service.generateIconThemeManifest(baseManifestUri, generatedThemeDirUri)

			expect(result).toBeUndefined()
			expect(mockCommonUtils.errMsg).toHaveBeenCalledWith(
				expect.stringContaining('Error reading or parsing JSON file'),
				expect.any(Error),
			)
		})

		it('should include user icons from directory', async () => {
			const baseManifest = {
				iconDefinitions: { _file: { iconPath: 'file.svg' } },
				file: '_file',
			}

			const userIconsDir = '/test/user-icons'
			const userIconFiles = [
				{ name: 'custom-icon.svg', isFile: () => true },
				{ name: 'another-icon.svg', isFile: () => true },
				{ name: 'not-an-icon.txt', isFile: () => true },
			]

			;(mockFileSystem.readFile as any).mockResolvedValue(JSON.stringify(baseManifest))
			;(mockFileSystem.access as any).mockResolvedValue(undefined)
			;(mockFileSystem.readdir as any).mockResolvedValue(userIconFiles)
			;(mockPath.join as any).mockImplementation((...args: string[]) => args.join('/'))
			;(mockPath.relative as any).mockReturnValue('../../user-icons/custom-icon.svg')

			const result = await service.generateIconThemeManifest(
				baseManifestUri,
				generatedThemeDirUri,
				userIconsDir,
			)

			expect(result?.iconDefinitions).toHaveProperty('_user_custom-icon')
			expect(result?.iconDefinitions).toHaveProperty('_user_another-icon')
			expect(result?.iconDefinitions).not.toHaveProperty('_user_not-an-icon')
			expect(mockFileSystem.access).toHaveBeenCalledWith(expect.objectContaining({
				fsPath: userIconsDir,
				scheme: 'file',
				authority: '',
				path: userIconsDir,
				query: '',
				fragment: '',
				toString: expect.any(Function),
			}), 4)
		})

		it('should handle user icons directory access error', async () => {
			const baseManifest = { iconDefinitions: {}, file: '_file' }
			const userIconsDir = '/test/user-icons'

			;(mockFileSystem.readFile as any).mockResolvedValue(JSON.stringify(baseManifest))
			;(mockFileSystem.access as any).mockRejectedValue(new Error('Access denied'))

			const result = await service.generateIconThemeManifest(
				baseManifestUri,
				generatedThemeDirUri,
				userIconsDir,
			)

			expect(result).toBeDefined()
			expect(mockCommonUtils.errMsg).toHaveBeenCalledWith(
				expect.stringContaining('Error accessing user icons directory'),
				expect.any(Error),
			)
		})

		it('should apply custom mappings for file associations', async () => {
			const baseManifest = {
				iconDefinitions: { _file: { iconPath: 'file.svg' } },
				file: '_file',
			}

			const customMappings = {
				'file:ts': '_typescript',
				'file:package.json': '_package',
			}

			;(mockFileSystem.readFile as any).mockResolvedValue(JSON.stringify(baseManifest))

			const result = await service.generateIconThemeManifest(
				baseManifestUri,
				generatedThemeDirUri,
				undefined,
				customMappings,
			)

			expect(result?.fileExtensions).toEqual({ ts: '_typescript' })
			expect(result?.fileNames).toEqual({ 'package.json': '_package' })
		})

		it('should apply custom mappings for folder associations', async () => {
			const baseManifest = {
				iconDefinitions: { _folder: { iconPath: 'folder.svg' } },
				folder: '_folder',
			}

			const customMappings = {
				'folder:src': '_source',
				'folder:node_modules': '_node',
			}

			;(mockFileSystem.readFile as any).mockResolvedValue(JSON.stringify(baseManifest))

			const result = await service.generateIconThemeManifest(
				baseManifestUri,
				generatedThemeDirUri,
				undefined,
				customMappings,
			)

			expect(result?.folderNames).toEqual({
				src: '_source',
				node_modules: '_node',
			})
		})

		it('should apply custom mappings for language associations', async () => {
			const baseManifest = {
				iconDefinitions: { _file: { iconPath: 'file.svg' } },
				file: '_file',
			}

			const customMappings = {
				'language:typescript': '_typescript',
				'language:javascript': '_javascript',
			}

			;(mockFileSystem.readFile as any).mockResolvedValue(JSON.stringify(baseManifest))

			const result = await service.generateIconThemeManifest(
				baseManifestUri,
				generatedThemeDirUri,
				undefined,
				customMappings,
			)

			expect(result?.languageIds).toEqual({
				typescript: '_typescript',
				javascript: '_javascript',
			})
		})

		it('should set hideExplorerArrows when provided', async () => {
			const baseManifest = { iconDefinitions: {}, file: '_file' }

			;(mockFileSystem.readFile as any).mockResolvedValue(JSON.stringify(baseManifest))

			const result = await service.generateIconThemeManifest(
				baseManifestUri,
				generatedThemeDirUri,
				undefined,
				undefined,
				true,
			)

			expect(result?.hidesExplorerArrows).toBe(true)
		})

		it('should remove hideExplorerArrows when set to false', async () => {
			const baseManifest = {
				iconDefinitions: {},
				file: '_file',
				hidesExplorerArrows: true,
			}

			;(mockFileSystem.readFile as any).mockResolvedValue(JSON.stringify(baseManifest))

			const result = await service.generateIconThemeManifest(
				baseManifestUri,
				generatedThemeDirUri,
				undefined,
				undefined,
				false,
			)

			expect(result?.hidesExplorerArrows).toBe(false)
		})

		it('should preserve hideExplorerArrows when not specified', async () => {
			const baseManifest = {
				iconDefinitions: {},
				file: '_file',
				hidesExplorerArrows: true,
			}

			;(mockFileSystem.readFile as any).mockResolvedValue(JSON.stringify(baseManifest))

			const result = await service.generateIconThemeManifest(
				baseManifestUri,
				generatedThemeDirUri,
			)

			expect(result?.hidesExplorerArrows).toBeUndefined()
		})
	})

	describe('writeIconThemeFile', () => {
		it('should write manifest to file', async () => {
			const manifest = {
				iconDefinitions: { _file: { iconPath: 'file.svg' } },
				file: '_file',
			}
			const outputPath = {
				fsPath: '/test/output.theme.json',
				toString: () => '/test/output.theme.json',
			} as any

			await service.writeIconThemeFile(manifest, outputPath)

			expect(mockFileSystem.writeFile).toHaveBeenCalledWith(
				outputPath,
				expect.stringContaining('"iconDefinitions"'),
				'utf-8',
			)
		})

		it('should handle write error', async () => {
			const manifest = { iconDefinitions: {}, file: '_file' }
			const outputPath = {
				fsPath: '/test/output.theme.json',
				toString: () => '/test/output.theme.json',
			} as any
			const writeError = new Error('Write failed')

			;(mockFileSystem.writeFile as any).mockRejectedValue(writeError)

			await expect(service.writeIconThemeFile(manifest, outputPath)).rejects.toThrow('Write failed')
			expect(mockCommonUtils.errMsg).toHaveBeenCalledWith(
				expect.stringContaining('Failed to write icon theme manifest'),
				writeError,
			)
		})
	})
})
