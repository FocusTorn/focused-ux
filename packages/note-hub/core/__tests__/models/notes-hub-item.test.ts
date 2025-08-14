import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NotesHubItem } from '../../src/models/NotesHubItem.js'

// Shared types
import type { ITreeItem, IThemeIcon, IThemeColor } from '@fux/shared'
import type { Uri } from 'vscode'

// Mock the shared adapters
vi.mock('@fux/shared', () => ({
	TreeItemAdapter: {
		create: vi.fn(),
	},
	ThemeIconAdapter: {
		create: vi.fn(),
	},
	ThemeColorAdapter: {
		create: vi.fn(),
	},
	UriAdapter: {
		file: vi.fn(),
		create: vi.fn(),
	},
	TreeItemCollapsibleStateAdapter: vi.fn().mockImplementation(() => ({
		None: 0,
		Collapsed: 1,
		Expanded: 2,
	})),
}))

describe('NotesHubItem', () => {
	let mockTreeItem: ITreeItem
	let mockUri: Uri
	let mockThemeIcon: IThemeIcon
	let mockThemeColor: IThemeColor

	beforeEach(() => {
		// Mock Uri
		mockUri = {
			fsPath: '/test/path/file.md',
			path: '/test/path/file.md',
			toString: () => 'file:///test/path/file.md',
		} as any

		// Mock ThemeIcon
		mockThemeIcon = {
			id: 'test-icon',
			themeIcon: 'test-icon',
		} as any

		// Mock ThemeColor
		mockThemeColor = {
			id: 'test-color',
		} as any

		// Mock TreeItem
		mockTreeItem = {
			label: 'test-file.md',
			resourceUri: mockUri,
			description: undefined,
			tooltip: undefined,
			contextValue: undefined,
			iconPath: undefined,
			collapsibleState: 0,
		} as any

		// Mock TreeItemAdapter.create
		const { TreeItemAdapter } = require('@fux/shared')

		vi.mocked(TreeItemAdapter.create).mockReturnValue(mockTreeItem)

		// Mock UriAdapter.file
		const { UriAdapter } = require('@fux/shared')

		vi.mocked(UriAdapter.file).mockReturnValue(mockUri)

		// Mock ThemeIconAdapter.create
		const { ThemeIconAdapter } = require('@fux/shared')

		vi.mocked(ThemeIconAdapter.create).mockReturnValue(mockThemeIcon)

		// Mock ThemeColorAdapter.create
		const { ThemeColorAdapter } = require('@fux/shared')

		vi.mocked(ThemeColorAdapter.create).mockReturnValue(mockThemeColor)
	})

	describe('constructor', () => {
		it('should create a NotesHubItem with basic properties', () => {
			const item = new NotesHubItem('test-file.md', '/test/path/file.md', false)

			expect(item.fileName).toBe('test-file.md')
			expect(item.filePath).toBe('/test/path/file.md')
			expect(item.isDirectory).toBe(false)
			expect(item.parentUri).toBeUndefined()
			expect(item.frontmatter).toBeUndefined()
		})

		it('should create a NotesHubItem with all properties', () => {
			const frontmatter = { Label: 'Custom Label', Desc: 'Custom Description' }
			const item = new NotesHubItem('test-file.md', '/test/path/file.md', false, mockUri, frontmatter)

			expect(item.fileName).toBe('test-file.md')
			expect(item.filePath).toBe('/test/path/file.md')
			expect(item.isDirectory).toBe(false)
			expect(item.parentUri).toBe(mockUri)
			expect(item.frontmatter).toBe(frontmatter)
		})

		it('should use custom label from frontmatter when valid', () => {
			const frontmatter = { Label: 'Custom Label' }
			const item = new NotesHubItem('test-file.md', '/test/path/file.md', false, undefined, frontmatter)

			expect(item.label).toBe('Custom Label')
		})

		it('should fall back to fileName when frontmatter label is empty', () => {
			const frontmatter = { Label: '' }
			const item = new NotesHubItem('test-file.md', '/test/path/file.md', false, undefined, frontmatter)

			expect(item.label).toBe('test-file.md')
		})

		it('should fall back to fileName when frontmatter label is "fn"', () => {
			const frontmatter = { Label: 'fn' }
			const item = new NotesHubItem('test-file.md', '/test/path/file.md', false, undefined, frontmatter)

			expect(item.label).toBe('test-file.md')
		})

		it('should fall back to fileName when frontmatter label is whitespace', () => {
			const frontmatter = { Label: '   ' }
			const item = new NotesHubItem('test-file.md', '/test/path/file.md', false, undefined, frontmatter)

			expect(item.label).toBe('test-file.md')
		})

		it('should throw error for invalid filePath', () => {
			expect(() => new NotesHubItem('test-file.md', '', false)).toThrow('Invalid filePath provided for NotesHubItem')
			expect(() => new NotesHubItem('test-file.md', '   ', false)).toThrow('Invalid filePath provided for NotesHubItem')
		})

		it('should set correct contextValue for files and folders', () => {
			const fileItem = new NotesHubItem('test-file.md', '/test/path/file.md', false)
			const folderItem = new NotesHubItem('test-folder', '/test/path/test-folder', true)

			expect(fileItem.contextValue).toBe('notesHubFileItem')
			expect(folderItem.contextValue).toBe('notesHubFolderItem')
		})

		it('should set correct collapsibleState for files and folders', () => {
			const fileItem = new NotesHubItem('test-file.md', '/test/path/file.md', false)
			const folderItem = new NotesHubItem('test-folder', '/test/path/test-folder', true)

			expect(fileItem.collapsibleState).toBe(0) // None
			expect(folderItem.collapsibleState).toBe(1) // Collapsed
		})

		it('should set description from frontmatter when valid', () => {
			const frontmatter = { Desc: 'Custom Description' }
			const item = new NotesHubItem('test-file.md', '/test/path/file.md', false, undefined, frontmatter)

			expect(item.description).toBe('Custom Description')
		})

		it('should set tooltip to filePath', () => {
			const item = new NotesHubItem('test-file.md', '/test/path/file.md', false)

			expect(item.tooltip).toBe('/test/path/file.md')
		})
	})

	describe('label property', () => {
		it('should get label from treeItem', () => {
			mockTreeItem.label = 'Custom Label'

			const item = new NotesHubItem('test-file.md', '/test/path/file.md', false)

			expect(item.label).toBe('Custom Label')
		})

		it('should fall back to fileName when treeItem label is undefined', () => {
			mockTreeItem.label = undefined

			const item = new NotesHubItem('test-file.md', '/test/path/file.md', false)

			expect(item.label).toBe('test-file.md')
		})

		it('should set label on treeItem', () => {
			const item = new NotesHubItem('test-file.md', '/test/path/file.md', false)

			item.label = 'New Label'

			expect(mockTreeItem.label).toBe('New Label')
		})
	})

	describe('resourceUri property', () => {
		it('should get resourceUri from treeItem', () => {
			const item = new NotesHubItem('test-file.md', '/test/path/file.md', false)

			expect(item.resourceUri).toBe(mockUri)
		})

		it('should return undefined when treeItem resourceUri is undefined', () => {
			mockTreeItem.resourceUri = undefined

			const item = new NotesHubItem('test-file.md', '/test/path/file.md', false)

			expect(item.resourceUri).toBeUndefined()
		})

		it('should set resourceUri on treeItem', () => {
			const item = new NotesHubItem('test-file.md', '/test/path/file.md', false)
			const newUri = { fsPath: '/new/path/file.md' } as any

			item.resourceUri = newUri

			expect(mockTreeItem.resourceUri).toBeDefined()
		})
	})

	describe('description property', () => {
		it('should get description from treeItem', () => {
			mockTreeItem.description = 'Custom Description'

			const item = new NotesHubItem('test-file.md', '/test/path/file.md', false)

			expect(item.description).toBe('Custom Description')
		})

		it('should return undefined when treeItem description is not a string', () => {
			mockTreeItem.description = { complex: 'object' }

			const item = new NotesHubItem('test-file.md', '/test/path/file.md', false)

			expect(item.description).toBeUndefined()
		})

		it('should set description on treeItem', () => {
			const item = new NotesHubItem('test-file.md', '/test/path/file.md', false)

			item.description = 'New Description'

			expect(mockTreeItem.description).toBe('New Description')
		})
	})

	describe('tooltip property', () => {
		it('should get tooltip from treeItem', () => {
			mockTreeItem.tooltip = 'Custom Tooltip'

			const item = new NotesHubItem('test-file.md', '/test/path/file.md', false)

			expect(item.tooltip).toBe('Custom Tooltip')
		})

		it('should return undefined when treeItem tooltip is not a string', () => {
			mockTreeItem.tooltip = { complex: 'object' }

			const item = new NotesHubItem('test-file.md', '/test/path/file.md', false)

			expect(item.tooltip).toBeUndefined()
		})

		it('should set tooltip on treeItem', () => {
			const item = new NotesHubItem('test-file.md', '/test/path/file.md', false)

			item.tooltip = 'New Tooltip'

			expect(mockTreeItem.tooltip).toBe('New Tooltip')
		})
	})

	describe('contextValue property', () => {
		it('should get contextValue from treeItem', () => {
			mockTreeItem.contextValue = 'customContext'

			const item = new NotesHubItem('test-file.md', '/test/path/file.md', false)

			expect(item.contextValue).toBe('customContext')
		})

		it('should set contextValue on treeItem', () => {
			const item = new NotesHubItem('test-file.md', '/test/path/file.md', false)

			item.contextValue = 'newContext'

			expect(mockTreeItem.contextValue).toBe('newContext')
		})
	})

	describe('iconPath property', () => {
		it('should get iconPath from treeItem', () => {
			mockTreeItem.iconPath = mockThemeIcon

			const item = new NotesHubItem('test-file.md', '/test/path/file.md', false)

			expect(item.iconPath).toBe(mockThemeIcon)
		})

		it('should set iconPath on treeItem', () => {
			const item = new NotesHubItem('test-file.md', '/test/path/file.md', false)

			item.iconPath = mockThemeIcon

			expect(mockTreeItem.iconPath).toBe(mockThemeIcon)
		})
	})

	describe('collapsibleState property', () => {
		it('should get collapsibleState from treeItem', () => {
			mockTreeItem.collapsibleState = 2

			const item = new NotesHubItem('test-file.md', '/test/path/file.md', false)

			expect(item.collapsibleState).toBe(2)
		})

		it('should fall back to None when treeItem collapsibleState is undefined', () => {
			mockTreeItem.collapsibleState = undefined

			const item = new NotesHubItem('test-file.md', '/test/path/file.md', false)

			expect(item.collapsibleState).toBe(0) // None
		})

		it('should set collapsibleState on treeItem', () => {
			const item = new NotesHubItem('test-file.md', '/test/path/file.md', false)

			item.collapsibleState = 2

			expect(mockTreeItem.collapsibleState).toBe(2)
		})
	})

	describe('toVsCode method', () => {
		it('should return treeItem when toVsCode method exists', () => {
			const mockToVsCode = vi.fn().mockReturnValue('vsCodeItem')

			mockTreeItem.toVsCode = mockToVsCode

			const item = new NotesHubItem('test-file.md', '/test/path/file.md', false)
			const result = item.toVsCode()

			expect(result).toBe('vsCodeItem')
			expect(mockToVsCode).toHaveBeenCalled()
		})

		it('should return treeItem when toVsCode method does not exist', () => {
			const item = new NotesHubItem('test-file.md', '/test/path/file.md', false)
			const result = item.toVsCode()

			expect(result).toBe(mockTreeItem)
		})
	})

	describe('iconPathFromFrontmatter method', () => {
		it('should return default icon when no frontmatter provided', () => {
			const item = new NotesHubItem('test-file.md', '/test/path/file.md', false)
			const icon = item.iconPathFromFrontmatter()

			expect(icon).toBe(mockThemeIcon)
		})

		it('should return icon from Codicon frontmatter', () => {
			const frontmatter = { Codicon: 'book' }
			const item = new NotesHubItem('test-file.md', '/test/path/file.md', false)
			const icon = item.iconPathFromFrontmatter(frontmatter)

			expect(icon).toBe(mockThemeIcon)
		})

		it('should return icon from Icon frontmatter when Codicon not present', () => {
			const frontmatter = { Icon: 'star' }
			const item = new NotesHubItem('test-file.md', '/test/path/file.md', false)
			const icon = item.iconPathFromFrontmatter(frontmatter)

			expect(icon).toBe(mockThemeIcon)
		})

		it('should return default icon when frontmatter icons are invalid', () => {
			const frontmatter = { Codicon: '', Icon: null }
			const item = new NotesHubItem('test-file.md', '/test/path/file.md', false)
			const icon = item.iconPathFromFrontmatter(frontmatter)

			expect(icon).toBe(mockThemeIcon)
		})

		it('should handle priority-based theming', () => {
			const frontmatter = { Codicon: 'book', Priority: '2' }
			const item = new NotesHubItem('test-file.md', '/test/path/file.md', false)
			const icon = item.iconPathFromFrontmatter(frontmatter)

			expect(icon).toBe(mockThemeIcon)
		})

		it('should handle invalid priority gracefully', () => {
			const frontmatter = { Codicon: 'book', Priority: 'invalid' }
			const item = new NotesHubItem('test-file.md', '/test/path/file.md', false)
			const icon = item.iconPathFromFrontmatter(frontmatter)

			expect(icon).toBe(mockThemeIcon)
		})

		it('should handle negative priority', () => {
			const frontmatter = { Codicon: 'book', Priority: '-1' }
			const item = new NotesHubItem('test-file.md', '/test/path/file.md', false)
			const icon = item.iconPathFromFrontmatter(frontmatter)

			expect(icon).toBe(mockThemeIcon)
		})

		it('should handle priority above maximum', () => {
			const frontmatter = { Codicon: 'book', Priority: '10' }
			const item = new NotesHubItem('test-file.md', '/test/path/file.md', false)
			const icon = item.iconPathFromFrontmatter(frontmatter)

			expect(icon).toBe(mockThemeIcon)
		})

		it('should clean icon names with special characters', () => {
			const frontmatter = { Codicon: '[[book]]' }
			const item = new NotesHubItem('test-file.md', '/test/path/file.md', false)
			const icon = item.iconPathFromFrontmatter(frontmatter)

			expect(icon).toBe(mockThemeIcon)
		})
	})
})
