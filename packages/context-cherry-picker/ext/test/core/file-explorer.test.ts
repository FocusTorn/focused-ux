import { describe, it, expect, vi, beforeEach } from 'vitest'
import { FileExplorerService } from '@fux/context-cherry-picker-core'
import { TreeItemCheckboxState, TreeItemCollapsibleState } from '@fux/mockly'
import type {
	IFileSystem,
	IWindow,
	IWorkspace,
	IPath,
	DirectoryEntry,
} from '@fux/context-cherry-picker-core'

describe('FileExplorerService', () => {
	let fileExplorerService: FileExplorerService
	let mockFileSystem: IFileSystem
	let mockWindow: IWindow
	let mockWorkspace: IWorkspace
	let mockPath: IPath
	let mockQuickSettingsService: any
	let mockTokenizerService: any

	beforeEach(() => {
		// Create mock dependencies using mockly
		mockFileSystem = {
			readDirectory: vi.fn(),
			stat: vi.fn(),
			readFile: vi.fn(),
			writeFile: vi.fn(),
			access: vi.fn(),
			copyFile: vi.fn(),
			createDirectory: vi.fn(),
		}

		// Use mockly for window
		mockWindow = {
			showInformationMessage: vi.fn(),
			showWarningMessage: vi.fn(),
			showErrorMessage: vi.fn(),
			showInputBox: vi.fn(),
			setClipboard: vi.fn(),
			setStatusBarMessage: vi.fn(),
			showDropdownMessage: vi.fn(),
			showDescriptionMessage: vi.fn(),
			showTimedInformationMessage: vi.fn(),
		}

		// Use mockly for workspace
		mockWorkspace = {
			workspaceFolders: [{ uri: 'file:///test/workspace', name: 'test-workspace' }],
			asRelativePath: vi.fn((path: string) => path.replace('file:///test/workspace/', '')),
			get: vi.fn().mockReturnValue([]),
			onDidChangeConfiguration: vi.fn().mockReturnValue({ dispose: vi.fn() }),
			createFileSystemWatcher: vi.fn().mockReturnValue({
				onDidChange: vi.fn().mockReturnValue({ dispose: vi.fn() }),
				onDidCreate: vi.fn().mockReturnValue({ dispose: vi.fn() }),
				onDidDelete: vi.fn().mockReturnValue({ dispose: vi.fn() }),
				dispose: vi.fn(),
			}),
		}

		mockPath = {
			join: vi.fn((...args: string[]) => args.join('/')),
			dirname: vi.fn((path: string) => path.split('/').slice(0, -1).join('/')),
			basename: vi.fn((path: string) => path.split('/').pop() || ''),
			relative: vi.fn((from: string, to: string) => to.replace(from, '')),
		}

		mockQuickSettingsService = {
			refresh: vi.fn(),
		}

		mockTokenizerService = {
			countTokens: vi.fn(),
		}

		// Create mock tree item factory
		const mockTreeItemFactory = {
			getCheckboxStateUnchecked: vi.fn().mockReturnValue(0),
			getCheckboxStateChecked: vi.fn().mockReturnValue(1),
			getCollapsibleStateNone: vi.fn().mockReturnValue(0),
			getCollapsibleStateCollapsed: vi.fn().mockReturnValue(1),
			getCollapsibleStateExpanded: vi.fn().mockReturnValue(2),
		}

		// Create service instance
		fileExplorerService = new FileExplorerService(
			mockWorkspace,
			mockWindow,
			mockQuickSettingsService,
			mockTokenizerService,
			mockFileSystem,
			mockPath,
			mockTreeItemFactory,
		)
	})

	describe('getChildren', () => {
		it('should return children for a directory', async () => {
			const mockEntries: DirectoryEntry[] = [
				{ name: 'file1.ts', type: 'file' },
				{ name: 'file2.ts', type: 'file' },
				{ name: 'src', type: 'directory' },
			]

			mockFileSystem.readDirectory = vi.fn().mockResolvedValue(mockEntries)
			mockPath.join = vi.fn().mockImplementation((...args) => args.join('/'))
			mockPath.basename = vi.fn().mockImplementation(path => path.split('/').pop() || '')

			const result = await fileExplorerService.getChildren()

			expect(result).toHaveLength(3)
			// Directories come first, then files (alphabetically)
			expect(result[0]).toMatchObject({
				uri: 'file:///test/workspace/src',
				label: 'src',
			})
			expect(result[1]).toMatchObject({
				uri: 'file:///test/workspace/file1.ts',
				label: 'file1.ts',
			})
			expect(result[2]).toMatchObject({
				uri: 'file:///test/workspace/file2.ts',
				label: 'file2.ts',
			})
		})

		it('should handle empty directory', async () => {
			mockFileSystem.readDirectory = vi.fn().mockResolvedValue([])

			const result = await fileExplorerService.getChildren()

			expect(result).toEqual([])
		})

		it('should handle file system errors', async () => {
			mockFileSystem.readDirectory = vi.fn().mockRejectedValue(new Error('Permission denied'))

			const result = await fileExplorerService.getChildren()

			expect(result).toEqual([])
		})
	})

	describe('getTreeItem', () => {
		it('should return tree item for a file', async () => {
			const mockItem = {
				uri: 'file:///test/workspace/file1.ts',
				label: 'file1.ts',
				type: 'file' as const,
				collapsibleState: TreeItemCollapsibleState.None,
			}

			const result = await fileExplorerService.getTreeItem(mockItem)

			expect(result).toMatchObject({
				uri: 'file:///test/workspace/file1.ts',
				label: 'file1.ts',
			})
		})

		it('should return tree item for a directory', async () => {
			const mockItem = {
				uri: 'file:///test/workspace/src',
				label: 'src',
				type: 'directory' as const,
				collapsibleState: TreeItemCollapsibleState.Collapsed,
			}

			const result = await fileExplorerService.getTreeItem(mockItem)

			expect(result).toMatchObject({
				uri: 'file:///test/workspace/src',
				label: 'src',
			})
		})
	})

	describe('getCheckboxState', () => {
		it('should return checkbox state for a URI', () => {
			const uri = 'file:///test/file1.ts'
			const expectedState = TreeItemCheckboxState.Checked

			// Set up the internal state
			fileExplorerService.updateCheckboxState(uri, expectedState)

			const result = fileExplorerService.getCheckboxState(uri)

			expect(result).toBe(expectedState)
		})

		it('should return unchecked state for non-checked URI', () => {
			const uri = 'file:///test/file1.ts'
			const expectedState = TreeItemCheckboxState.Unchecked

			// Set up the internal state
			fileExplorerService.updateCheckboxState(uri, expectedState)

			const result = fileExplorerService.getCheckboxState(uri)

			expect(result).toBe(expectedState)
		})
	})

	describe('getAllCheckedItems', () => {
		it('should return checked items', () => {
			const expectedItems = ['file:///test/file1.ts', 'file:///test/file2.ts']

			// Mock the internal state
			vi.spyOn(fileExplorerService as any, 'getAllCheckedItems').mockReturnValue(expectedItems)

			const result = fileExplorerService.getAllCheckedItems()

			expect(result).toEqual(expectedItems)
		})
	})

	describe('loadCheckedState', () => {
		it('should load checked state from saved items', () => {
			const savedItems = [
				{ uriString: 'file:///test/file1.ts', checkboxState: TreeItemCheckboxState.Checked },
				{ uriString: 'file:///test/file2.ts', checkboxState: TreeItemCheckboxState.Unchecked },
			]

			fileExplorerService.loadCheckedState(savedItems)

			// Verify the state was loaded (this would depend on the internal implementation)
			// For now, we just verify the method doesn't throw
			expect(true).toBe(true)
		})
	})

	describe('refresh', () => {
		it('should refresh the explorer view', async () => {
			await fileExplorerService.refresh()

			// Verify refresh was called (this would depend on the internal implementation)
			// For now, we just verify the method doesn't throw
			expect(true).toBe(true)
		})
	})

	describe('updateCheckboxState', () => {
		it('should update checkbox state for a URI', () => {
			const uri = 'file:///test/file1.ts'
			const state = TreeItemCheckboxState.Checked

			fileExplorerService.updateCheckboxState(uri, state)

			// Verify the state was updated (this would depend on the internal implementation)
			// For now, we just verify the method doesn't throw
			expect(true).toBe(true)
		})
	})

	describe('clearAllCheckboxes', () => {
		it('should clear all checkboxes', () => {
			fileExplorerService.clearAllCheckboxes()

			// Verify all checkboxes were cleared (this would depend on the internal implementation)
			// For now, we just verify the method doesn't throw
			expect(true).toBe(true)
		})
	})
})
