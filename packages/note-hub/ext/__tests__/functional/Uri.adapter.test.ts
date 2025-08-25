import { describe, it, expect, beforeEach, vi } from 'vitest'
import { UriAdapter } from '../../src/adapters/Uri.adapter.js'
import type { IUriFactory, IUri } from '@fux/note-hub-core'

// Import after mocking
import * as vscode from 'vscode'

// Mock vscode.Uri methods
vi.mock('vscode', () => ({
	Uri: {
		file: vi.fn(),
		parse: vi.fn(),
		joinPath: vi.fn(),
	},
}))

describe('UriAdapter', () => {
	let adapter: IUriFactory

	beforeEach(() => {
		vi.clearAllMocks()
		adapter = new UriAdapter()
	})

	describe('file URI creation', () => {
		it('should create file URI from path', () => {
			const path = '/test/file.md'
            
			const uri = adapter.file(path)
            
			expect(vscode.Uri.file).toHaveBeenCalledWith(path)
			expect(uri).toBeDefined()
			expect(uri.fsPath).toBeDefined()
			expect(uri.scheme).toBeDefined()
			expect(uri.path).toBeDefined()
		})

		it('should create file URI with correct properties', () => {
			const path = '/test/documents/note.md'
            
			// Mock the VSCode Uri.file to return specific values
			const mockUri = {
				fsPath: path,
				scheme: 'file',
				authority: '',
				path,
				query: '',
				fragment: '',
				toString: vi.fn().mockReturnValue(`file://${path}`),
				with: vi.fn().mockReturnThis(),
			}

			vi.mocked(vscode.Uri.file).mockReturnValueOnce(mockUri as any)
            
			const uri = adapter.file(path)
            
			expect(uri.fsPath).toBe(path)
			expect(uri.scheme).toBe('file')
			expect(uri.authority).toBe('')
			expect(uri.path).toBe(path)
			expect(uri.query).toBe('')
			expect(uri.fragment).toBe('')
		})

		it('should handle Windows paths', () => {
			const path = 'C:\\test\\file.md'
            
			const mockUri = {
				fsPath: path,
				scheme: 'file',
				authority: '',
				path: '/c:/test/file.md',
				query: '',
				fragment: '',
				toString: vi.fn().mockReturnValue(`file:///c:/test/file.md`),
				with: vi.fn().mockReturnThis(),
			}

			vi.mocked(vscode.Uri.file).mockReturnValueOnce(mockUri as any)
            
			const uri = adapter.file(path)
            
			expect(uri.fsPath).toBe(path)
			expect(uri.path).toBe('/c:/test/file.md')
		})

		it('should handle relative paths', () => {
			const path = './relative/file.md'
            
			const uri = adapter.file(path)
            
			expect(vscode.Uri.file).toHaveBeenCalledWith(path)
			expect(uri).toBeDefined()
		})
	})

	describe('parse URI creation', () => {
		it('should parse URI string', () => {
			const uriString = 'file:///test/file.md'
            
			const mockUri = {
				fsPath: '/test/file.md',
				scheme: 'file',
				authority: '',
				path: '/test/file.md',
				query: '',
				fragment: '',
				toString: vi.fn().mockReturnValue(uriString),
				with: vi.fn().mockReturnThis(),
			}

			vi.mocked(vscode.Uri.parse).mockReturnValueOnce(mockUri as any)
            
			const uri = adapter.parse(uriString)
            
			expect(vscode.Uri.parse).toHaveBeenCalledWith(uriString)
			expect(uri.fsPath).toBe('/test/file.md')
			expect(uri.scheme).toBe('file')
		})

		it('should handle URI with query parameters', () => {
			const uriString = 'file:///test/file.md?param=value'
            
			const mockUri = {
				fsPath: '/test/file.md',
				scheme: 'file',
				authority: '',
				path: '/test/file.md',
				query: 'param=value',
				fragment: '',
				toString: vi.fn().mockReturnValue(uriString),
				with: vi.fn().mockReturnThis(),
			}

			vi.mocked(vscode.Uri.parse).mockReturnValueOnce(mockUri as any)
            
			const uri = adapter.parse(uriString)
            
			expect(uri.query).toBe('param=value')
		})

		it('should parse non-file URI schemes', () => {
			const uriString = 'https://example.com/path'
            
			// Mock the VSCode Uri.parse for https scheme
			const mockUri = {
				fsPath: '',
				scheme: 'https',
				authority: 'example.com',
				path: '/path',
				query: '',
				fragment: '',
				toString: vi.fn().mockReturnValue(uriString),
				with: vi.fn().mockReturnThis(),
			}

			vi.mocked(vscode.Uri.parse).mockReturnValueOnce(mockUri as any)
            
			const uri = adapter.parse(uriString)
            
			expect(uri.scheme).toBe('https')
			expect(uri.authority).toBe('example.com')
			expect(uri.path).toBe('/path')
		})
	})

	describe('URI toString functionality', () => {
		it('should convert URI to string', () => {
			const path = '/test/file.md'
			const expectedString = `file://${path}`
            
			// Mock the VSCode Uri.file and toString
			const mockUri = {
				fsPath: path,
				scheme: 'file',
				authority: '',
				path,
				query: '',
				fragment: '',
				toString: vi.fn().mockReturnValue(expectedString),
				with: vi.fn().mockReturnThis(),
			}

			vi.mocked(vscode.Uri.file).mockReturnValueOnce(mockUri as any)
            
			const uri = adapter.file(path)
			const result = uri.toString()
            
			expect(result).toBe(expectedString)
			expect(mockUri.toString).toHaveBeenCalled()
		})

		it('should handle toString for parsed URIs', () => {
			const uriString = 'file:///test/parsed.md'
            
			// Mock the VSCode Uri.parse and toString
			const mockUri = {
				fsPath: '/test/parsed.md',
				scheme: 'file',
				authority: '',
				path: '/test/parsed.md',
				query: '',
				fragment: '',
				toString: vi.fn().mockReturnValue(uriString),
				with: vi.fn().mockReturnThis(),
			}

			vi.mocked(vscode.Uri.parse).mockReturnValueOnce(mockUri as any)
            
			const uri = adapter.parse(uriString)
			const result = uri.toString()
            
			expect(result).toBe(uriString)
			expect(mockUri.toString).toHaveBeenCalled()
		})
	})

	describe('URI with() functionality', () => {
		it('should create modified URI with different path', () => {
			const originalPath = '/test/file.md'
			const newPath = '/test/modified.md'
            
			// Mock the original URI
			const mockOriginalUri = {
				fsPath: originalPath,
				scheme: 'file',
				authority: '',
				path: originalPath,
				query: '',
				fragment: '',
				toString: vi.fn().mockReturnValue(`file://${originalPath}`),
				with: vi.fn(),
			}
            
			// Mock the modified URI
			const mockModifiedUri = {
				fsPath: newPath,
				scheme: 'file',
				authority: '',
				path: newPath,
				query: '',
				fragment: '',
				toString: vi.fn().mockReturnValue(`file://${newPath}`),
				with: vi.fn().mockReturnThis(),
			}
            
			mockOriginalUri.with.mockReturnValueOnce(mockModifiedUri as any)
			vi.mocked(vscode.Uri.file).mockReturnValueOnce(mockOriginalUri as any)
            
			const uri = adapter.file(originalPath)
			const modifiedUri = uri.with({ path: newPath })
            
			expect(mockOriginalUri.with).toHaveBeenCalledWith({ path: newPath })
			expect(modifiedUri.path).toBe(newPath)
		})

		it('should create modified URI with different scheme', () => {
			const path = '/test/file.md'
			const change = { scheme: 'https' }
            
			// Mock the original URI
			const mockOriginalUri = {
				fsPath: path,
				scheme: 'file',
				authority: '',
				path,
				query: '',
				fragment: '',
				toString: vi.fn().mockReturnValue(`file://${path}`),
				with: vi.fn(),
			}
            
			// Mock the modified URI
			const mockModifiedUri = {
				fsPath: '',
				scheme: 'https',
				authority: '',
				path,
				query: '',
				fragment: '',
				toString: vi.fn().mockReturnValue(`https://localhost${path}`),
				with: vi.fn().mockReturnThis(),
			}
            
			mockOriginalUri.with.mockReturnValueOnce(mockModifiedUri as any)
			vi.mocked(vscode.Uri.file).mockReturnValueOnce(mockOriginalUri as any)
            
			const uri = adapter.file(path)
			const modifiedUri = uri.with(change)
            
			expect(mockOriginalUri.with).toHaveBeenCalledWith(change)
			expect(modifiedUri.scheme).toBe('https')
		})

		it('should handle multiple with() calls', () => {
			const originalPath = '/test/file.md'
            
			// Create a more complex mock setup for chained with() calls
			const mockUri = {
				fsPath: originalPath,
				scheme: 'file',
				authority: '',
				path: originalPath,
				query: '',
				fragment: '',
				toString: vi.fn().mockReturnValue(`file://${originalPath}`),
				with: vi.fn().mockImplementation((change: any) => ({
					...mockUri,
					...change,
					with: vi.fn().mockReturnThis(),
				})),
			}
            
			vi.mocked(vscode.Uri.file).mockReturnValueOnce(mockUri as any)
            
			const uri = adapter.file(originalPath)
			const step1 = uri.with({ query: 'step=1' })
			const step2 = step1.with({ fragment: 'section1' })
            
			expect(mockUri.with).toHaveBeenCalledWith({ query: 'step=1' })
			expect(step2).toBeDefined()
		})
	})

	describe('error handling', () => {
		it('should handle invalid file paths gracefully', () => {
			const invalidPath = ''
            
			expect(() => adapter.file(invalidPath)).not.toThrow()
			expect(vscode.Uri.file).toHaveBeenCalledWith(invalidPath)
		})

		it('should handle invalid URI strings gracefully', () => {
			const invalidUri = 'not-a-valid-uri'
            
			expect(() => adapter.parse(invalidUri)).not.toThrow()
			expect(vscode.Uri.parse).toHaveBeenCalledWith(invalidUri)
		})

		it('should handle VSCode Uri.file throwing errors', () => {
			const path = '/test/file.md'
			const error = new Error('Invalid path')
            
			vi.mocked(vscode.Uri.file).mockImplementationOnce(() => {
				throw error
			})
            
			expect(() => adapter.file(path)).toThrow(error)
		})

		it('should handle VSCode Uri.parse throwing errors', () => {
			const uriString = 'invalid-uri'
			const error = new Error('Invalid URI')
            
			vi.mocked(vscode.Uri.parse).mockImplementationOnce(() => {
				throw error
			})
            
			expect(() => adapter.parse(uriString)).toThrow(error)
		})
	})

	describe('integration scenarios', () => {
		it('should handle complete file URI workflow', () => {
			const basePath = '/test/workspace'
			const fileName = 'note.md'
			const fullPath = `${basePath}/${fileName}`
            
			// Mock for file creation
			const mockFileUri = {
				fsPath: fullPath,
				scheme: 'file',
				authority: '',
				path: fullPath,
				query: '',
				fragment: '',
				toString: vi.fn().mockReturnValue(`file://${fullPath}`),
				with: vi.fn().mockReturnThis(),
			}

			vi.mocked(vscode.Uri.file).mockReturnValueOnce(mockFileUri as any)
            
			// Create file URI
			const fileUri = adapter.file(fullPath)
            
			// Convert to string
			const uriString = fileUri.toString()
            
			// Parse back from string
			vi.mocked(vscode.Uri.parse).mockReturnValueOnce(mockFileUri as any)

			const parsedUri = adapter.parse(uriString)
            
			expect(fileUri.fsPath).toBe(fullPath)
			expect(parsedUri.fsPath).toBe(fullPath)
			expect(uriString).toBe(`file://${fullPath}`)
		})

		it('should handle URI transformation workflow', () => {
			const originalPath = '/test/original.md'
			const backupPath = '/test/backup.md'
            
			// Mock original URI
			const mockOriginalUri = {
				fsPath: originalPath,
				scheme: 'file',
				authority: '',
				path: originalPath,
				query: '',
				fragment: '',
				toString: vi.fn().mockReturnValue(`file://${originalPath}`),
				with: vi.fn(),
			}
            
			// Mock backup URI
			const mockBackupUri = {
				fsPath: backupPath,
				scheme: 'file',
				authority: '',
				path: backupPath,
				query: 'backup=true',
				fragment: '',
				toString: vi.fn().mockReturnValue(`file://${backupPath}?backup=true`),
				with: vi.fn().mockReturnThis(),
			}
            
			mockOriginalUri.with.mockReturnValueOnce(mockBackupUri as any)
			vi.mocked(vscode.Uri.file).mockReturnValueOnce(mockOriginalUri as any)
            
			// Create original URI
			const originalUri = adapter.file(originalPath)
            
			// Transform to backup URI
			const backupUri = originalUri.with({
				path: backupPath,
				query: 'backup=true',
			})
            
			expect(originalUri.fsPath).toBe(originalPath)
			expect(backupUri.path).toBe(backupPath)
			expect(backupUri.query).toBe('backup=true')
		})
	})

	describe('create method', () => {
		it('should return existing IUri as-is', () => {
			const existingUri: IUri = {
				fsPath: '/test/file.md',
				scheme: 'file',
				authority: '',
				path: '/test/file.md',
				query: '',
				fragment: '',
				toString: () => 'file:///test/file.md',
				with: vi.fn().mockReturnThis(),
			}
            
			const result = adapter.create(existingUri)
            
			expect(result).toBe(existingUri)
		})

		it('should convert VSCode URI to IUri', () => {
			const vscodeUri = {
				fsPath: '/test/file.md',
				scheme: 'file',
				authority: 'test',
				path: '/test/file.md',
				query: 'param=value',
				fragment: 'section',
				toString: () => 'file://test/test/file.md?param=value#section',
				with: vi.fn().mockReturnThis(),
			}
            
			const result = adapter.create(vscodeUri)
            
			expect(result.fsPath).toBe('/test/file.md')
			expect(result.scheme).toBe('file')
			expect(result.authority).toBe('test')
			expect(result.path).toBe('/test/file.md')
			expect(result.query).toBe('param=value')
			expect(result.fragment).toBe('section')
		})

		it('should handle string path by calling file method', () => {
			const path = '/test/file.md'
            
			const mockUri = {
				fsPath: path,
				scheme: 'file',
				authority: '',
				path,
				query: '',
				fragment: '',
				toString: vi.fn().mockReturnValue(`file://${path}`),
				with: vi.fn().mockReturnThis(),
			}

			vi.mocked(vscode.Uri.file).mockReturnValueOnce(mockUri as any)
            
			const result = adapter.create(path)
            
			expect(vscode.Uri.file).toHaveBeenCalledWith(path)
			expect(result.fsPath).toBe(path)
		})

		it('should return default URI for invalid input', () => {
			const mockUri = {
				fsPath: '/',
				scheme: 'file',
				authority: '',
				path: '/',
				query: '',
				fragment: '',
				toString: vi.fn().mockReturnValue('file:///'),
				with: vi.fn().mockReturnThis(),
			}

			vi.mocked(vscode.Uri.file).mockReturnValueOnce(mockUri as any)
            
			const result = adapter.create(null)
            
			expect(vscode.Uri.file).toHaveBeenCalledWith('/')
			expect(result.fsPath).toBe('/')
		})
	})

	describe('joinPath method', () => {
		it('should join paths correctly', () => {
			const baseUri: IUri = {
				fsPath: '/base/path',
				scheme: 'file',
				authority: '',
				path: '/base/path',
				query: '',
				fragment: '',
				toString: () => 'file:///base/path',
				with: vi.fn().mockReturnThis(),
			}
            
			const mockJoinedUri = {
				fsPath: '/base/path/sub/file.md',
				scheme: 'file',
				authority: '',
				path: '/base/path/sub/file.md',
				query: '',
				fragment: '',
				toString: vi.fn().mockReturnValue('file:///base/path/sub/file.md'),
				with: vi.fn().mockReturnThis(),
			}

			vi.mocked(vscode.Uri.file).mockReturnValueOnce(baseUri as any)
			vi.mocked(vscode.Uri.joinPath).mockReturnValueOnce(mockJoinedUri as any)
            
			const result = adapter.joinPath(baseUri, 'sub', 'file.md')
            
			expect(vscode.Uri.joinPath).toHaveBeenCalledWith(baseUri as any, 'sub', 'file.md')
			expect(result.fsPath).toBe('/base/path/sub/file.md')
			expect(result.path).toBe('/base/path/sub/file.md')
		})

		it('should handle single path segment', () => {
			const baseUri: IUri = {
				fsPath: '/base',
				scheme: 'file',
				authority: '',
				path: '/base',
				query: '',
				fragment: '',
				toString: () => 'file:///base',
				with: vi.fn().mockReturnThis(),
			}
            
			const mockJoinedUri = {
				fsPath: '/base/file.md',
				scheme: 'file',
				authority: '',
				path: '/base/file.md',
				query: '',
				fragment: '',
				toString: vi.fn().mockReturnValue('file:///base/file.md'),
				with: vi.fn().mockReturnThis(),
			}

			vi.mocked(vscode.Uri.file).mockReturnValueOnce(baseUri as any)
			vi.mocked(vscode.Uri.joinPath).mockReturnValueOnce(mockJoinedUri as any)
            
			const result = adapter.joinPath(baseUri, 'file.md')
            
			expect(vscode.Uri.joinPath).toHaveBeenCalledWith(baseUri as any, 'file.md')
			expect(result.fsPath).toBe('/base/file.md')
		})

		it('should handle empty path segments', () => {
			const baseUri: IUri = {
				fsPath: '/base',
				scheme: 'file',
				authority: '',
				path: '/base',
				query: '',
				fragment: '',
				toString: () => 'file:///base',
				with: vi.fn().mockReturnThis(),
			}
            
			const mockJoinedUri = {
				fsPath: '/base',
				scheme: 'file',
				authority: '',
				path: '/base',
				query: '',
				fragment: '',
				toString: vi.fn().mockReturnValue('file:///base'),
				with: vi.fn().mockReturnThis(),
			}

			vi.mocked(vscode.Uri.file).mockReturnValueOnce(baseUri as any)
			vi.mocked(vscode.Uri.joinPath).mockReturnValueOnce(mockJoinedUri as any)
            
			const result = adapter.joinPath(baseUri, '', '')
            
			expect(vscode.Uri.joinPath).toHaveBeenCalledWith(baseUri as any, '', '')
			expect(result.fsPath).toBe('/base')
		})
	})

	describe('with method', () => {
		it('should create new URI with changes', () => {
			const originalUri: IUri = {
				fsPath: '/test/file.md',
				scheme: 'file',
				authority: '',
				path: '/test/file.md',
				query: '',
				fragment: '',
				toString: () => 'file:///test/file.md',
				with: vi.fn().mockReturnThis(),
			}
            
			const mockNewUri = {
				fsPath: '/test/file.md',
				scheme: 'file',
				authority: '',
				path: '/test/file.md',
				query: 'param=value',
				fragment: '',
				toString: vi.fn().mockReturnValue('file:///test/file.md?param=value'),
				with: vi.fn().mockReturnThis(),
			}
            
			// Mock the with method to return a new URI
			const withSpy = vi.fn().mockReturnValue(mockNewUri)
			const uriWithMock = { ...originalUri, with: withSpy }
            
			const result = uriWithMock.with({ query: 'param=value' })
            
			expect(withSpy).toHaveBeenCalledWith({ query: 'param=value' })
			expect(result).toBe(mockNewUri)
		})
	})
})
