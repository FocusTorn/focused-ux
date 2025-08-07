import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ContextDataCollectorService } from '@fux/context-cherry-picker-core'
import type {
	IFileSystem,
	IPath,
} from '@fux/context-cherry-picker-core'

describe('ContextDataCollectorService', () => {
	let contextDataCollector: ContextDataCollectorService
	let mockWorkspace: any
	let mockFileSystem: IFileSystem
	let mockPath: IPath

	beforeEach(() => {
		// Create mock dependencies
		mockWorkspace = {
			getWorkspaceFolders: vi.fn(),
			getConfiguration: vi.fn(),
		}

		mockFileSystem = {
			readDirectory: vi.fn(),
			stat: vi.fn(),
			readFile: vi.fn(),
			writeFile: vi.fn(),
			access: vi.fn(),
			copyFile: vi.fn(),
		}

		mockPath = {
			join: vi.fn((...args: string[]) => args.join('/')),
			dirname: vi.fn((path: string) => path.split('/').slice(0, -1).join('/')),
			basename: vi.fn((path: string) => path.split('/').pop() || ''),
			extname: vi.fn((path: string) => {
				const ext = path.split('.').pop()

				return ext ? `.${ext}` : ''
			}),
			isAbsolute: vi.fn((path: string) => path.startsWith('/')),
			relative: vi.fn((from: string, to: string) => {
				// Simple relative path implementation
				if (to.startsWith(from)) {
					return to.substring(from.length).replace(/^\/+/, '')
				}
				return to
			}),
			resolve: vi.fn((...args: string[]) => args.join('/')),
		}

		// Create service instance
		contextDataCollector = new ContextDataCollectorService(
			mockWorkspace,
			mockFileSystem,
			mockPath,
		)
	})

	describe('collectContextData', () => {
		it('should collect context data from multiple files', async () => {
			const mode = 'selected' as const
			const initialCheckedUris = ['file:///test/file1.ts', 'file:///test/file2.ts']
			const projectRootUri = 'file:///test'
			const coreScanIgnoreGlobs: string[] = []
			const coreScanDirHideAndContentsGlobs: string[] = []
			const coreScanDirShowDirHideContentsGlobs: string[] = []

			mockFileSystem.stat = vi.fn().mockResolvedValue({ size: 100 })
			mockPath.basename = vi.fn().mockReturnValue('file1.ts')
			mockPath.relative = vi.fn().mockReturnValue('file1.ts')

			const result = await contextDataCollector.collectContextData(
				mode,
				initialCheckedUris,
				projectRootUri,
				coreScanIgnoreGlobs,
				coreScanDirHideAndContentsGlobs,
				coreScanDirShowDirHideContentsGlobs,
			)

			expect(result).toHaveProperty('treeEntries')
			expect(result).toHaveProperty('contentFileUris')
			expect(result.treeEntries).toBeInstanceOf(Map)
			expect(result.contentFileUris).toBeInstanceOf(Set)
		})

		it('should handle empty URI list', async () => {
			const mode = 'selected' as const
			const initialCheckedUris: string[] = []
			const projectRootUri = 'file:///test'
			const coreScanIgnoreGlobs: string[] = []
			const coreScanDirHideAndContentsGlobs: string[] = []
			const coreScanDirShowDirHideContentsGlobs: string[] = []

			const result = await contextDataCollector.collectContextData(
				mode,
				initialCheckedUris,
				projectRootUri,
				coreScanIgnoreGlobs,
				coreScanDirHideAndContentsGlobs,
				coreScanDirShowDirHideContentsGlobs,
			)

			expect(result.treeEntries.size).toBe(0)
			expect(result.contentFileUris.size).toBe(0)
		})

		it('should handle file system errors', async () => {
			const mode = 'selected' as const
			const initialCheckedUris = ['file:///test/file1.ts']
			const projectRootUri = 'file:///test'
			const coreScanIgnoreGlobs: string[] = []
			const coreScanDirHideAndContentsGlobs: string[] = []
			const coreScanDirShowDirHideContentsGlobs: string[] = []

			mockFileSystem.stat = vi.fn().mockRejectedValue(new Error('File not found'))

			const result = await contextDataCollector.collectContextData(
				mode,
				initialCheckedUris,
				projectRootUri,
				coreScanIgnoreGlobs,
				coreScanDirHideAndContentsGlobs,
				coreScanDirShowDirHideContentsGlobs,
			)

			// Should handle errors gracefully and continue
			expect(result).toHaveProperty('treeEntries')
			expect(result).toHaveProperty('contentFileUris')
		})
	})
})
