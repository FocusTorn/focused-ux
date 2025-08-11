import { describe, it, expect, beforeEach, vi } from 'vitest'
import '../setup'

// Mockly provides node.fs functionality - no need to mock fs/promises manually
// Use Mockly's built-in services for all VSCode and Node.js operations

describe('NotesHubActionService - Create Note', () => {
	let svc: any
	let iWorkspace: any
	let iWindow: any
	let iProviderManager: any
	let iCommonUtils: any
	let iPathUtils: any
	let iPathJoin: any
	let iPathParse: any
	let iPathExtname: any
	let iFspAccess: any
	let UriAdapter: any

	beforeEach(async () => {
		// Import after mocking to get the mocked versions
		const { NotesHubActionService } = await import('../../../core/src/services/NotesHubAction.service.js')
		const { NotesHubItem: _NotesHubItem } = await import('../../../core/src/models/NotesHubItem.js')
		const { UriAdapter: ActualUriAdapter } = await import('@fux/shared')

		// Create mock dependencies
		iWorkspace = {
			fs: {
				writeFile: vi.fn().mockResolvedValue(undefined),
				readFile: vi.fn().mockResolvedValue(new TextEncoder().encode('content')),
				createDirectory: vi.fn().mockResolvedValue(undefined),
				stat: vi.fn().mockResolvedValue({ type: 1 }),
			},
			openTextDocument: vi.fn().mockResolvedValue({ uri: 'mock-doc-uri' }),
		}

		iWindow = {
			showInputBox: vi.fn().mockResolvedValue('TestNote.md'),
			showTextDocument: vi.fn().mockResolvedValue(undefined),
			showErrorMessage: vi.fn(),
			showWarningMessage: vi.fn(),
		}

		iProviderManager = {
			getProviderForNote: vi.fn().mockResolvedValue({
				refresh: vi.fn(),
				getNotesHubItem: vi.fn().mockResolvedValue({
					fileName: 'TestNote.md',
					filePath: '/notes/project/TestNote.md',
					isDirectory: false,
				}),
				revealNotesHubItem: vi.fn().mockResolvedValue(undefined),
			}),
			revealNotesHubItem: vi.fn().mockResolvedValue(undefined),
		}

		iCommonUtils = {
			errMsg: vi.fn(),
			infoMsg: vi.fn(),
			delay: vi.fn(),
		}

		iPathUtils = {
			sanitizePath: (path: string) => path,
			getDottedPath: vi.fn(),
		}

		iPathJoin = vi.fn((...paths: string[]) => paths.join('/'))
		iPathParse = vi.fn((path: string) => {
			const lastDot = path.lastIndexOf('.')

			if (lastDot === -1) {
				return { name: path, ext: '' }
			}
			return { name: path.substring(0, lastDot), ext: path.substring(lastDot) }
		})
		iPathExtname = vi.fn((path: string) => {
			const lastDot = path.lastIndexOf('.')

			return lastDot === -1 ? '' : path.substring(lastDot)
		})

		// Create mock node.fs functions with Vitest mocks
		iFspAccess = vi.fn().mockResolvedValue(undefined) // Mock successful access

		// Create service instance
		svc = new NotesHubActionService(
			{ subscriptions: [], workspaceState: {}, globalState: {}, secrets: {}, extensionUri: { fsPath: '' }, extensionPath: '', storageUri: { fsPath: '' }, logUri: { fsPath: '' }, extensionMode: 1, environmentVariableCollection: {}, extension: { id: '', extensionUri: { fsPath: '' }, extensionPath: '', isBuiltin: false, packageJSON: {} } } as any, // context
			iWindow,
			iWorkspace,
			{ clipboard: { readText: vi.fn(), writeText: vi.fn() } }, // env
			iCommonUtils,
			{ getFrontmatter: vi.fn(), getFrontmatter_validateFrontmatter: vi.fn() }, // frontmatterUtils
			iPathUtils,
			iProviderManager,
			{ executeCommand: vi.fn(), registerCommand: vi.fn() }, // commands
			iPathJoin,
			vi.fn(), // dirname
			vi.fn(), // basename
			iPathParse,
			iPathExtname,
			iFspAccess,
			vi.fn(), // rename
			{ Unknown: 0, File: 1, Directory: 2, SymbolicLink: 64 }, // fileType
		)

		// Get UriAdapter for URI creation
		UriAdapter = ActualUriAdapter
	})

	describe('newNoteInFolder', () => {
		it('creates note with valid folder input', async () => {
			// Arrange
			const folder = {
				label: 'folder',
				filePath: '/notes/project',
				isDirectory: true,
				resourceUri: UriAdapter.file('/notes/project'),
			} as any

			// Mock input box to return a valid filename
			iWindow.showInputBox = vi.fn().mockResolvedValue('TestNote.md')

			// Act
			await svc.newNoteInFolder(folder)

			// Assert
			expect(iProviderManager.getProviderForNote).toHaveBeenCalledWith(folder)
			expect(iWorkspace.openTextDocument).toHaveBeenCalled()
			expect(iWindow.showTextDocument).toHaveBeenCalled()
		})

		it('rejects non-directory items', async () => {
			// Arrange
			const file = {
				label: 'file.md',
				filePath: '/notes/project/file.md',
				isDirectory: false,
				resourceUri: UriAdapter.file('/notes/project/file.md'),
			} as any

			// Act
			await svc.newNoteInFolder(file)

			// Assert
			expect(iCommonUtils.errMsg).toHaveBeenCalledWith('This command can only be used on a valid folder.')
			expect(iProviderManager.getProviderForNote).not.toHaveBeenCalled()
		})

		it('rejects items without resourceUri', async () => {
			// Arrange
			const folder = {
				label: 'folder',
				filePath: '/notes/project',
				isDirectory: true,
				resourceUri: undefined,
			} as any

			// Act
			await svc.newNoteInFolder(folder)

			// Assert
			expect(iCommonUtils.errMsg).toHaveBeenCalledWith('This command can only be used on a valid folder.')
			expect(iProviderManager.getProviderForNote).not.toHaveBeenCalled()
		})

		it('handles provider not found', async () => {
			// Arrange
			const folder = {
				label: 'folder',
				filePath: '/notes/project',
				isDirectory: true,
				resourceUri: UriAdapter.file('/notes/project'),
			} as any

			iProviderManager.getProviderForNote = vi.fn().mockResolvedValue(null)

			// Act
			await svc.newNoteInFolder(folder)

			// Assert
			expect(iCommonUtils.errMsg).toHaveBeenCalledWith('Could not determine provider for the target folder.')
			expect(iWorkspace.openTextDocument).not.toHaveBeenCalled()
		})

		it('handles no filename input', async () => {
			// Arrange
			const folder = {
				label: 'folder',
				filePath: '/notes/project',
				isDirectory: true,
				resourceUri: UriAdapter.file('/notes/project'),
			} as any

			iWindow.showInputBox = vi.fn().mockResolvedValue(undefined)

			// Act
			await svc.newNoteInFolder(folder)

			// Assert
			expect(iWorkspace.openTextDocument).not.toHaveBeenCalled()
		})

		it('handles empty filename input', async () => {
			// Arrange
			const folder = {
				label: 'folder',
				filePath: '/notes/project',
				isDirectory: true,
				resourceUri: UriAdapter.file('/notes/project'),
			} as any

			iWindow.showInputBox = vi.fn().mockResolvedValue('')

			// Act
			await svc.newNoteInFolder(folder)

			// Assert
			expect(iWorkspace.openTextDocument).not.toHaveBeenCalled()
		})

		it('creates note with default .md extension when none provided', async () => {
			// Arrange
			const folder = {
				label: 'folder',
				filePath: '/notes/project',
				isDirectory: true,
				resourceUri: UriAdapter.file('/notes/project'),
			} as any

			iWindow.showInputBox = vi.fn().mockResolvedValue('TestNote')

			// Act
			await svc.newNoteInFolder(folder)

			// Assert
			expect(iPathJoin).toHaveBeenCalledWith('/notes/project', 'TestNote.md')
			expect(iWorkspace.openTextDocument).toHaveBeenCalled()
		})

		it('creates note with custom extension when provided', async () => {
			// Arrange
			const folder = {
				label: 'folder',
				filePath: '/notes/project',
				isDirectory: true,
				resourceUri: UriAdapter.file('/notes/project'),
			} as any

			iWindow.showInputBox = vi.fn().mockResolvedValue('TestNote.txt')

			// Act
			await svc.newNoteInFolder(folder)

			// Assert
			expect(iPathJoin).toHaveBeenCalledWith('/notes/project', 'TestNote.txt')
			expect(iWorkspace.openTextDocument).toHaveBeenCalled()
		})

		it('rejects invalid file extensions', async () => {
			// Arrange
			const folder = {
				label: 'folder',
				filePath: '/notes/project',
				isDirectory: true,
				resourceUri: UriAdapter.file('/notes/project'),
			} as any

			iWindow.showInputBox = vi.fn()
				.mockResolvedValueOnce('TestNote.invalid')
				.mockResolvedValueOnce('TestNote.md')

			// Act
			await svc.newNoteInFolder(folder)

			// Assert
			expect(iWindow.showErrorMessage).toHaveBeenCalledWith(
				'Invalid extension: \'.invalid\'. Allowed: .md, .txt, .txte',
			)
			// Should retry and succeed with valid extension
			expect(iWorkspace.openTextDocument).toHaveBeenCalled()
		})

		it('refreshes provider after note creation', async () => {
			// Arrange
			const folder = {
				label: 'folder',
				filePath: '/notes/project',
				isDirectory: true,
				resourceUri: UriAdapter.file('/notes/project'),
			} as any

			const mockProvider = {
				refresh: vi.fn(),
				getNotesHubItem: vi.fn().mockResolvedValue({
					fileName: 'TestNote.md',
					filePath: '/notes/project/TestNote.md',
					isDirectory: false,
				}),
			}

			iProviderManager.getProviderForNote = vi.fn().mockResolvedValue(mockProvider)

			// Act
			await svc.newNoteInFolder(folder)

			// Assert
			expect(mockProvider.refresh).toHaveBeenCalled()
		})

		it('reveals newly created note item', async () => {
			// Arrange
			const folder = {
				label: 'folder',
				filePath: '/notes/project',
				isDirectory: true,
				resourceUri: UriAdapter.file('/notes/project'),
			} as any

			const mockProvider = {
				refresh: vi.fn(),
				getNotesHubItem: vi.fn().mockResolvedValue({
					fileName: 'TestNote.md',
					filePath: '/notes/project/TestNote.md',
					isDirectory: false,
				}),
			}

			iProviderManager.getProviderForNote = vi.fn().mockResolvedValue(mockProvider)

			// Act
			await svc.newNoteInFolder(folder)

			// Assert
			expect(iProviderManager.revealNotesHubItem).toHaveBeenCalledWith(
				mockProvider,
				expect.objectContaining({
					fileName: 'TestNote.md',
					filePath: '/notes/project/TestNote.md',
				}),
				true,
			)
		})

		it('handles errors during note creation gracefully', async () => {
			// Arrange
			const folder = {
				label: 'folder',
				filePath: '/notes/project',
				isDirectory: true,
				resourceUri: UriAdapter.file('/notes/project'),
			} as any

			iWorkspace.openTextDocument = vi.fn().mockRejectedValue(new Error('Failed to open document'))

			// Act
			await svc.newNoteInFolder(folder)

			// Assert
			expect(iCommonUtils.errMsg).toHaveBeenCalledWith('Failed to create new note', expect.any(Error))
		})
	})

	describe('newNoteAtRoot', () => {
		it('creates root note for project provider', async () => {
			// Arrange
			const mockProvider = {
				notesDir: '/notes/project',
				refresh: vi.fn(),
				getNotesHubItem: vi.fn().mockResolvedValue({
					fileName: 'project',
					filePath: '/notes/project',
					isDirectory: true,
				}),
			}

			iProviderManager.getProviderInstance = vi.fn().mockReturnValue(mockProvider)

			// Mock the input box to return a valid filename
			vi.spyOn(svc, 'getNewFileNameWithExtension')
				.mockResolvedValue({ newName: 'TestNote', newExtension: '.md' })

			// Act
			await svc.newNoteAtRoot('project')

			// Assert
			expect(iProviderManager.getProviderInstance).toHaveBeenCalledWith('project')
		})

		it('creates root note for remote provider', async () => {
			// Arrange
			const mockProvider = {
				notesDir: '/notes/remote',
				refresh: vi.fn(),
				getNotesHubItem: vi.fn().mockResolvedValue({
					fileName: 'remote',
					filePath: '/notes/remote',
					isDirectory: true,
				}),
			}

			iProviderManager.getProviderInstance = vi.fn().mockReturnValue(mockProvider)

			// Mock the input box to return a valid filename
			vi.spyOn(svc, 'getNewFileNameWithExtension')
				.mockResolvedValue({ newName: 'TestNote', newExtension: '.md' })

			// Act
			await svc.newNoteAtRoot('remote')

			// Assert
			expect(iProviderManager.getProviderInstance).toHaveBeenCalledWith('remote')
		})

		it('creates root note for global provider', async () => {
			// Arrange
			const mockProvider = {
				notesDir: '/notes/global',
				refresh: vi.fn(),
				getNotesHubItem: vi.fn().mockResolvedValue({
					fileName: 'global',
					filePath: '/notes/global',
					isDirectory: true,
				}),
			}

			iProviderManager.getProviderInstance = vi.fn().mockReturnValue(mockProvider)

			// Mock the input box to return a valid filename
			vi.spyOn(svc, 'getNewFileNameWithExtension')
				.mockResolvedValue({ newName: 'TestNote', newExtension: '.md' })

			// Act
			await svc.newNoteAtRoot('global')

			// Assert
			expect(iProviderManager.getProviderInstance).toHaveBeenCalledWith('global')
		})

		it('handles provider not found', async () => {
			// Arrange
			iProviderManager.getProviderInstance = vi.fn().mockReturnValue(null)

			// Act
			await svc.newNoteAtRoot('nonexistent')

			// Assert
			expect(iCommonUtils.errMsg).toHaveBeenCalledWith(
				'Notes Hub provider \'nonexistent\' is not enabled or available.',
			)
		})

		it('handles errors during root note creation', async () => {
			// Arrange
			const mockProvider = {
				notesDir: '/notes/project',
				refresh: vi.fn(),
				getNotesHubItem: vi.fn().mockResolvedValue({
					fileName: 'project',
					filePath: '/notes/project',
					isDirectory: true,
				}),
			}

			iProviderManager.getProviderInstance = vi.fn().mockReturnValue(mockProvider)

			// Mock newNoteInFolder to throw an error
			vi.spyOn(svc, 'newNoteInFolder').mockRejectedValue(new Error('Failed to create note'))

			// Act & Assert
			await expect(svc.newNoteAtRoot('project')).rejects.toThrow('Failed to create note')
		})
	})

	describe('getNewFileNameWithExtension', () => {
		it('returns undefined when no input provided', async () => {
			// Arrange
			iWindow.showInputBox = vi.fn().mockResolvedValue(undefined)

			// Act
			const result = await svc.getNewFileNameWithExtension('TestNote')

			// Assert
			expect(result).toBeUndefined()
		})

		it('returns undefined when empty input provided', async () => {
			// Arrange
			iWindow.showInputBox = vi.fn().mockResolvedValue('')

			// Act
			const result = await svc.getNewFileNameWithExtension('TestNote')

			// Assert
			expect(result).toBeUndefined()
		})

		it('adds default .md extension when none provided', async () => {
			// Arrange
			iWindow.showInputBox = vi.fn().mockResolvedValue('TestNote')

			// Act
			const result = await svc.getNewFileNameWithExtension('TestNote')

			// Assert
			expect(result).toEqual({ newName: 'TestNote', newExtension: '.md' })
		})

		it('preserves valid .md extension', async () => {
			// Arrange
			iWindow.showInputBox = vi.fn().mockResolvedValue('TestNote.md')

			// Act
			const result = await svc.getNewFileNameWithExtension('TestNote')

			// Assert
			expect(result).toEqual({ newName: 'TestNote', newExtension: '.md' })
		})

		it('preserves valid .txt extension', async () => {
			// Arrange
			iWindow.showInputBox = vi.fn().mockResolvedValue('TestNote.txt')

			// Act
			const result = await svc.getNewFileNameWithExtension('TestNote')

			// Assert
			expect(result).toEqual({ newName: 'TestNote', newExtension: '.txt' })
		})

		it('preserves valid .txte extension', async () => {
			// Arrange
			iWindow.showInputBox = vi.fn().mockResolvedValue('TestNote.txte')

			// Act
			const result = await svc.getNewFileNameWithExtension('TestNote')

			// Assert
			expect(result).toEqual({ newName: 'TestNote', newExtension: '.txte' })
		})

		it('rejects invalid extensions and retries', async () => {
			// Arrange
			iWindow.showInputBox = vi.fn()
				.mockResolvedValueOnce('TestNote.invalid')
				.mockResolvedValueOnce('TestNote.md')

			// Act
			const result = await svc.getNewFileNameWithExtension('TestNote')

			// Assert
			expect(iWindow.showErrorMessage).toHaveBeenCalledWith(
				'Invalid extension: \'.invalid\'. Allowed: .md, .txt, .txte',
			)
			expect(result).toEqual({ newName: 'TestNote', newExtension: '.md' })
		})

		it('handles case-insensitive extension validation', async () => {
			// Arrange
			iWindow.showInputBox = vi.fn().mockResolvedValue('TestNote.MD')

			// Act
			const result = await svc.getNewFileNameWithExtension('TestNote')

			// Assert
			// The implementation converts to lowercase for validation, so .MD becomes .md
			expect(result).toEqual({ newName: 'TestNote', newExtension: '.md' })
		})

		it('uses custom prompt and default extension', async () => {
			// Arrange
			iWindow.showInputBox = vi.fn().mockResolvedValue('CustomNote')

			// Act
			const result = await svc.getNewFileNameWithExtension('CustomNote', 'Enter note name:', '.txt')

			// Assert
			expect(result).toEqual({ newName: 'CustomNote', newExtension: '.txt' })
		})
	})
})
