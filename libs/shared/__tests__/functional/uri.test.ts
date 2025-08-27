import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { VSCodeUriFactory } from '../../src/vscode/adapters/VSCodeUriFactory.js'
import { UriAdapter } from '../../src/vscode/adapters/Uri.adapter.js'

describe('URI Comprehensive Tests', () => {
	describe('VSCodeUriFactory', () => {
		let factory: VSCodeUriFactory
		let consoleSpy: any

		beforeEach(() => {
			factory = new VSCodeUriFactory()
			consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
		})

		afterEach(() => {
			consoleSpy.mockRestore()
		})

		describe('file', () => {
			it('should handle valid paths correctly', () => {
				const result = factory.file('/valid/path')

				expect(result).toBeDefined()
				expect(result.path).toBe('/valid/path')
			})

			it('should warn and return fallback for null path', () => {
				const result = factory.file(null as any)
				
				expect(consoleSpy).toHaveBeenCalledWith('[VSCodeUriFactory] Invalid path provided to file():', null)
				expect(result).toBeDefined()
				expect(result.path).toBe('/invalid-path')
			})

			it('should warn and return fallback for undefined path', () => {
				const result = factory.file(undefined as any)
				
				expect(consoleSpy).toHaveBeenCalledWith('[VSCodeUriFactory] Invalid path provided to file():', undefined)
				expect(result).toBeDefined()
				expect(result.path).toBe('/invalid-path')
			})

			it('should warn and return fallback for empty string path', () => {
				const result = factory.file('')
				
				expect(consoleSpy).toHaveBeenCalledWith('[VSCodeUriFactory] Invalid path provided to file():', '')
				expect(result).toBeDefined()
				expect(result.path).toBe('/invalid-path')
			})

			it('should warn and return fallback for whitespace-only path', () => {
				const result = factory.file('   ')
				
				expect(consoleSpy).toHaveBeenCalledWith('[VSCodeUriFactory] Invalid path provided to file():', '   ')
				expect(result).toBeDefined()
				expect(result.path).toBe('/invalid-path')
			})

			it('should warn and return fallback for non-string path', () => {
				const result = factory.file(123 as any)
				
				expect(consoleSpy).toHaveBeenCalledWith('[VSCodeUriFactory] Invalid path provided to file():', 123)
				expect(result).toBeDefined()
				expect(result.path).toBe('/invalid-path')
			})
		})

		describe('joinPath', () => {
			it('should filter out invalid path segments', () => {
				const baseUri = factory.file('/base')
				const result = factory.joinPath(baseUri, 'valid', '', '   ', null as any, 'also-valid')
				
				expect(result).toBeDefined()
				// Should only include valid paths: 'valid' and 'also-valid'
				expect(result.path).toBe('/base/valid/also-valid')
			})

			it('should handle all invalid segments', () => {
				const baseUri = factory.file('/base')
				const result = factory.joinPath(baseUri, '', null as any, undefined as any)
				
				expect(result).toBeDefined()
				// Should just return base path when all segments are invalid
				expect(result.path).toBe('/base')
			})

			it('should handle mixed valid and invalid segments', () => {
				const baseUri = factory.file('/base')
				const result = factory.joinPath(baseUri, 'valid1', '', 'valid2', null as any, 'valid3')
				
				expect(result).toBeDefined()
				// Should only include valid paths: 'valid1', 'valid2', 'valid3'
				expect(result.path).toBe('/base/valid1/valid2/valid3')
			})
		})

		describe('dirname', () => {
			it('should handle URI with no path', () => {
				const mockUri = { path: '' } as any
				const result = factory.dirname(mockUri)
				
				expect(result).toBeDefined()
				expect(result.path).toBe('/')
			})

			it('should handle URI with null path', () => {
				const mockUri = { path: null } as any
				const result = factory.dirname(mockUri)
				
				expect(result).toBeDefined()
				expect(result.path).toBe('/')
			})

			it('should handle URI with undefined path', () => {
				const mockUri = { path: undefined } as any
				const result = factory.dirname(mockUri)
				
				expect(result).toBeDefined()
				expect(result.path).toBe('/')
			})
		})

		describe('create() and error catch path', () => {
			it('create wraps uri and file() works with Mockly', async () => {
				vi.resetModules()

				// Break circular import between VSCodeUriFactory and UriAdapter default-factory
				vi.mock('../../src/vscode/adapters/Uri.adapter.js', () => ({
					UriAdapter: class {

						constructor(public uri: any) {}

						get path() { return this.uri.path }

						get fsPath() { return this.uri.fsPath }
					
					},
				}))

				const { VSCodeUriFactory } = await import('../../src/vscode/adapters/VSCodeUriFactory.js')
				const f = new VSCodeUriFactory()

				// Mockly doesn't throw errors, it creates URIs successfully
				const result = f.file('/will-not-throw') as any

				expect(result.path).toBe('/will-not-throw')

				const created = f.create({ fsPath: '/ok', path: '/ok' } as any) as any

				expect(created.path).toBe('/ok')
			})
		})

		describe('logging (warn)', () => {
			it('emits warn on invalid path in file()', async () => {
				vi.resetModules()
				vi.mock('vscode', () => ({
					Uri: {
						file: (p: string) => ({ fsPath: p, path: p, toString: () => `file://${p}` }),
						joinPath: (base: any, ...segs: string[]) => ({ fsPath: [base.fsPath, ...segs].join('/'), path: [base.path, ...segs].join('/') }),
					},
				}))

				// Break circular import between VSCodeUriFactory and UriAdapter default-factory
				vi.mock('../../src/vscode/adapters/Uri.adapter.js', () => ({
					UriAdapter: class {

						constructor(public uri: any) {}
						get path() { return this.uri.fsPath }
						get fsPath() { return this.uri.fsPath }
					
					},
				}))

				const warnSpy = vi.spyOn(console, 'warn')
				const { VSCodeUriFactory } = await import('../../src/vscode/adapters/VSCodeUriFactory.js')
				const f = new VSCodeUriFactory()

				const _res = f.file('')

				expect(warnSpy).toHaveBeenCalled()

				const args = warnSpy.mock.calls.at(-1) ?? []

				expect(String(args[0])).toContain('Invalid path provided to file()')
			})
		})
	})

	describe('UriAdapter', () => {
		describe('instance methods', () => {
			it('handles edge cases gracefully', () => {
				// Test empty path
				const emptyUri = {
					path: '',
					query: '',
					fsPath: '',
					toString: () => 'file:///',
				}
				
				const emptyAdapter = new UriAdapter(emptyUri as any)

				expect(emptyAdapter.path).toBe('')
				expect(emptyAdapter.fsPath).toBe('')

				// Test root path
				const rootUri = {
					path: '/',
					query: '',
					fsPath: '/',
					toString: () => 'file:///',
				}
				
				const rootAdapter = new UriAdapter(rootUri as any)

				expect(rootAdapter.path).toBe('/')
				expect(rootAdapter.fsPath).toBe('/')
			})
		})
	})
})
