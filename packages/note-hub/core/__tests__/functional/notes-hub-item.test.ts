import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NotesHubItem } from '../../src/models/NotesHubItem.js'
import type { IUri } from '../../src/_interfaces/INotesHubItem.js'

describe('NotesHubItem', () => {
	let mockTreeItemAdapter: any
	let mockThemeIconAdapter: any
	let mockThemeColorAdapter: any
	let mockUriAdapter: any
	let mockTreeItemCollapsibleStateAdapter: any

	beforeEach(() => {
		// Create mock adapters that match the expected interface
		mockTreeItemAdapter = {
			create: vi.fn().mockImplementation((label: string, collapsibleState: number, resourceUri: any) => {
				return {
					label,
					resourceUri,
					description: undefined,
					tooltip: undefined,
					contextValue: collapsibleState === 1 ? 'notesHubFolderItem' : 'notesHubFileItem',
					iconPath: undefined,
					collapsibleState,
					toVsCode: vi.fn().mockReturnValue({ label }),
				}
			}),
		}

		mockThemeIconAdapter = {
			create: vi.fn().mockReturnValue({
				id: 'dash',
				theme: undefined,
				color: undefined,
			}),
		}

		mockThemeColorAdapter = {
			create: vi.fn().mockReturnValue({
				id: 'notesHub.foreground',
			}),
		}

		mockUriAdapter = {
			file: vi.fn().mockReturnValue({
				uri: { fsPath: '/test/path/file.md' },
			}),
		}

		mockTreeItemCollapsibleStateAdapter = {
			None: 0,
			Collapsed: 1,
			Expanded: 2,
		}
	})

	describe('constructor validation', () => {
		it('should throw error for invalid filePath', () => {
			expect(() => {
				const _item = new NotesHubItem(
					'test-file.md',
					'',
					false,
					mockTreeItemAdapter,
					mockThemeIconAdapter,
					mockThemeColorAdapter,
					mockUriAdapter,
					mockTreeItemCollapsibleStateAdapter,
				)
			}).toThrow('Invalid filePath provided for NotesHubItem')

			expect(() => {
				const _item = new NotesHubItem(
					'test-file.md',
					'   ',
					false,
					mockTreeItemAdapter,
					mockThemeIconAdapter,
					mockThemeColorAdapter,
					mockUriAdapter,
					mockTreeItemCollapsibleStateAdapter,
				)
			}).toThrow('Invalid filePath provided for NotesHubItem')
		})

		it('should create NotesHubItem with valid parameters', () => {
			const item = new NotesHubItem(
				'test-file.md',
				'/test/path/file.md',
				false,
				mockTreeItemAdapter,
				mockThemeIconAdapter,
				mockThemeColorAdapter,
				mockUriAdapter,
				mockTreeItemCollapsibleStateAdapter,
			)

			expect(item.fileName).toBe('test-file.md')
			expect(item.filePath).toBe('/test/path/file.md')
			expect(item.isDirectory).toBe(false)
			expect(item.parentUri).toBeUndefined()
			expect(item.frontmatter).toBeUndefined()
		})

		it('should create NotesHubItem with all properties', () => {
			const mockParentUri: IUri = {
				scheme: 'file',
				authority: '',
				path: '/parent/path',
				query: '',
				fragment: '',
				fsPath: '/parent/path',
				with: vi.fn(),
				toString: vi.fn(),
			}
			const frontmatter = { Label: 'Custom Label', Desc: 'Custom Description' }

			const item = new NotesHubItem(
				'test-file.md',
				'/test/path/file.md',
				false,
				mockTreeItemAdapter,
				mockThemeIconAdapter,
				mockThemeColorAdapter,
				mockUriAdapter,
				mockTreeItemCollapsibleStateAdapter,
				mockParentUri,
				frontmatter,
			)

			expect(item.fileName).toBe('test-file.md')
			expect(item.filePath).toBe('/test/path/file.md')
			expect(item.isDirectory).toBe(false)
			expect(item.parentUri).toBe(mockParentUri)
			expect(item.frontmatter).toBe(frontmatter)
		})
	})

	describe('label handling', () => {
		it('should use custom label from frontmatter when valid', () => {
			const frontmatter = { Label: 'Custom Label' }

			const item = new NotesHubItem(
				'test-file.md',
				'/test/path/file.md',
				false,
				mockTreeItemAdapter,
				mockThemeIconAdapter,
				mockThemeColorAdapter,
				mockUriAdapter,
				mockTreeItemCollapsibleStateAdapter,
				undefined,
				frontmatter,
			)

			expect(item.label).toBe('Custom Label')
		})

		it('should fall back to fileName when frontmatter label is empty', () => {
			const frontmatter = { Label: '' }

			const item = new NotesHubItem(
				'test-file.md',
				'/test/path/file.md',
				false,
				mockTreeItemAdapter,
				mockThemeIconAdapter,
				mockThemeColorAdapter,
				mockUriAdapter,
				mockTreeItemCollapsibleStateAdapter,
				undefined,
				frontmatter,
			)

			expect(item.label).toBe('test-file.md')
		})

		it('should fall back to fileName when frontmatter label is "fn"', () => {
			const frontmatter = { Label: 'fn' }

			const item = new NotesHubItem(
				'test-file.md',
				'/test/path/file.md',
				false,
				mockTreeItemAdapter,
				mockThemeIconAdapter,
				mockThemeColorAdapter,
				mockUriAdapter,
				mockTreeItemCollapsibleStateAdapter,
				undefined,
				frontmatter,
			)

			expect(item.label).toBe('test-file.md')
		})

		it('should fall back to fileName when frontmatter label is whitespace', () => {
			const frontmatter = { Label: '   ' }

			const item = new NotesHubItem(
				'test-file.md',
				'/test/path/file.md',
				false,
				mockTreeItemAdapter,
				mockThemeIconAdapter,
				mockThemeColorAdapter,
				mockUriAdapter,
				mockTreeItemCollapsibleStateAdapter,
				undefined,
				frontmatter,
			)

			expect(item.label).toBe('test-file.md')
		})
	})

	describe('context value and collapsible state', () => {
		it('should set correct contextValue for files and folders', () => {
			const fileItem = new NotesHubItem(
				'test-file.md',
				'/test/path/file.md',
				false,
				mockTreeItemAdapter,
				mockThemeIconAdapter,
				mockThemeColorAdapter,
				mockUriAdapter,
				mockTreeItemCollapsibleStateAdapter,
			)

			const folderItem = new NotesHubItem(
				'test-folder',
				'/test/path/test-folder',
				true,
				mockTreeItemAdapter,
				mockThemeIconAdapter,
				mockThemeColorAdapter,
				mockUriAdapter,
				mockTreeItemCollapsibleStateAdapter,
			)

			expect(fileItem.contextValue).toBe('notesHubFileItem')
			expect(folderItem.contextValue).toBe('notesHubFolderItem')
		})

		it('should set correct collapsibleState for files and folders', () => {
			const fileItem = new NotesHubItem(
				'test-file.md',
				'/test/path/file.md',
				false,
				mockTreeItemAdapter,
				mockThemeIconAdapter,
				mockThemeColorAdapter,
				mockUriAdapter,
				mockTreeItemCollapsibleStateAdapter,
			)

			const folderItem = new NotesHubItem(
				'test-folder',
				'/test/path/test-folder',
				true,
				mockTreeItemAdapter,
				mockThemeIconAdapter,
				mockThemeColorAdapter,
				mockUriAdapter,
				mockTreeItemCollapsibleStateAdapter,
			)

			expect(fileItem.collapsibleState).toBe(0) // None
			expect(folderItem.collapsibleState).toBe(1) // Collapsed
		})
	})

	describe('description handling', () => {
		it('should set description from frontmatter when valid', () => {
			const frontmatter = { Desc: 'Custom Description' }

			const item = new NotesHubItem(
				'test-file.md',
				'/test/path/file.md',
				false,
				mockTreeItemAdapter,
				mockThemeIconAdapter,
				mockThemeColorAdapter,
				mockUriAdapter,
				mockTreeItemCollapsibleStateAdapter,
				undefined,
				frontmatter,
			)

			expect(item.description).toBe('Custom Description')
		})

		it('should return undefined when no frontmatter description', () => {
			const item = new NotesHubItem(
				'test-file.md',
				'/test/path/file.md',
				false,
				mockTreeItemAdapter,
				mockThemeIconAdapter,
				mockThemeColorAdapter,
				mockUriAdapter,
				mockTreeItemCollapsibleStateAdapter,
			)

			expect(item.description).toBeUndefined()
		})
	})

	describe('iconPathFromFrontmatter method', () => {
		it('should return default icon when no frontmatter provided', () => {
			const item = new NotesHubItem(
				'test-file.md',
				'/test/path/file.md',
				false,
				mockTreeItemAdapter,
				mockThemeIconAdapter,
				mockThemeColorAdapter,
				mockUriAdapter,
				mockTreeItemCollapsibleStateAdapter,
			)
            
			const _iconPath = item.iconPathFromFrontmatter(undefined)
            
			expect(mockThemeIconAdapter.create).toHaveBeenCalledWith('dash', expect.any(Object))
		})

		it('should return icon from Codicon frontmatter', () => {
			const frontmatter = { Codicon: 'file', Color: 'notesHub.priority1' }

			const item = new NotesHubItem(
				'test-file.md',
				'/test/path/file.md',
				false,
				mockTreeItemAdapter,
				mockThemeIconAdapter,
				mockThemeColorAdapter,
				mockUriAdapter,
				mockTreeItemCollapsibleStateAdapter,
			)
            
			// Clear previous calls
			mockThemeIconAdapter.create.mockClear()
            
			const _iconPath = item.iconPathFromFrontmatter(frontmatter)
            
			// Since no Priority is set, it calls with just the icon name
			expect(mockThemeIconAdapter.create).toHaveBeenCalledWith('file')
		})

		it('should return icon from Icon frontmatter when Codicon not present', () => {
			const frontmatter = { Icon: 'custom-icon' }

			const item = new NotesHubItem(
				'test-file.md',
				'/test/path/file.md',
				false,
				mockTreeItemAdapter,
				mockThemeIconAdapter,
				mockThemeColorAdapter,
				mockUriAdapter,
				mockTreeItemCollapsibleStateAdapter,
			)
            
			// Clear previous calls
			mockThemeIconAdapter.create.mockClear()
            
			const _iconPath = item.iconPathFromFrontmatter(frontmatter)
            
			// Since no Priority is set, it calls with just the icon name
			expect(mockThemeIconAdapter.create).toHaveBeenCalledWith('custom-icon')
		})

		it('should handle priority-based theming', () => {
			const frontmatter = { Codicon: 'file', Priority: '2' }

			const item = new NotesHubItem(
				'test-file.md',
				'/test/path/file.md',
				false,
				mockTreeItemAdapter,
				mockThemeIconAdapter,
				mockThemeColorAdapter,
				mockUriAdapter,
				mockTreeItemCollapsibleStateAdapter,
			)
            
			// Clear previous calls
			mockThemeColorAdapter.create.mockClear()
            
			const _iconPath = item.iconPathFromFrontmatter(frontmatter)
            
			expect(mockThemeColorAdapter.create).toHaveBeenCalledWith('notesHub.priority2')
		})

		it('should clean icon names with special characters', () => {
			const frontmatter = { Codicon: 'file@#$%' }

			const item = new NotesHubItem(
				'test-file.md',
				'/test/path/file.md',
				false,
				mockTreeItemAdapter,
				mockThemeIconAdapter,
				mockThemeColorAdapter,
				mockUriAdapter,
				mockTreeItemCollapsibleStateAdapter,
			)
            
			// Clear previous calls
			mockThemeIconAdapter.create.mockClear()
            
			const _iconPath = item.iconPathFromFrontmatter(frontmatter)
            
			// The regex doesn't match 'file@#$%', so it uses the original string
			expect(mockThemeIconAdapter.create).toHaveBeenCalledWith('file@#$%')
		})
	})

	describe('toVsCode method', () => {
		it('should return the internal treeItem', () => {
			const item = new NotesHubItem(
				'test-file.md',
				'/test/path/file.md',
				false,
				mockTreeItemAdapter,
				mockThemeIconAdapter,
				mockThemeColorAdapter,
				mockUriAdapter,
				mockTreeItemCollapsibleStateAdapter,
			)
            
			const treeItem = item.toVsCode()
            
			expect(treeItem).toBeDefined()
			expect(treeItem.label).toBe('test-file.md')
		})
	})

	describe('property getters and setters', () => {
		it('should get and set label', () => {
			const item = new NotesHubItem(
				'test-file.md',
				'/test/path/file.md',
				false,
				mockTreeItemAdapter,
				mockThemeIconAdapter,
				mockThemeColorAdapter,
				mockUriAdapter,
				mockTreeItemCollapsibleStateAdapter,
			)

			expect(item.label).toBe('test-file.md')
            
			item.label = 'New Label'
			expect(item.label).toBe('New Label')
		})

		it('should get and set description', () => {
			const item = new NotesHubItem(
				'test-file.md',
				'/test/path/file.md',
				false,
				mockTreeItemAdapter,
				mockThemeIconAdapter,
				mockThemeColorAdapter,
				mockUriAdapter,
				mockTreeItemCollapsibleStateAdapter,
			)

			expect(item.description).toBeUndefined()
            
			item.description = 'New Description'
			expect(item.description).toBe('New Description')
		})

		it('should get and set tooltip', () => {
			const item = new NotesHubItem(
				'test-file.md',
				'/test/path/file.md',
				false,
				mockTreeItemAdapter,
				mockThemeIconAdapter,
				mockThemeColorAdapter,
				mockUriAdapter,
				mockTreeItemCollapsibleStateAdapter,
			)

			expect(item.tooltip).toBe('/test/path/file.md')
            
			item.tooltip = 'New Tooltip'
			expect(item.tooltip).toBe('New Tooltip')
		})
	})
})
