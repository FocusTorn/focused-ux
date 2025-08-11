// Test setup for Note Hub
import { vi } from 'vitest'

// Mockly handles all VSCode mocking through the vscode-test-adapter.ts
// No need to manually mock vscode APIs - Mockly provides everything we need
// This includes: workspace, window, commands, extensions, env, Uri, Position, Range, etc.

// Mock UriAdapter globally for tests
vi.mock('@fux/shared', async () => {
	const actual = await vi.importActual('@fux/shared') as any

	return {
		...actual,
		UriAdapter: {
			...actual.UriAdapter,
			file: vi.fn((path: string) => ({
				uri: { fsPath: path, toString: () => `file://${path}` },
				fsPath: path,
				toString: () => `file://${path}`,
			})),
			create: vi.fn((uri: any) => ({
				uri: { fsPath: uri.fsPath || uri.path || uri, toString: () => `file://${uri.fsPath || uri.path || uri}` },
				fsPath: uri.fsPath || uri.path || uri,
				toString: () => `file://${uri.fsPath || uri.path || uri}`,
			})),
			joinPath: vi.fn((base: any, ...paths: string[]) => {
				const basePath = base.fsPath || base.path || base
				const fullPath = [basePath, ...paths].join('/').replace(/\/+/g, '/')

				return {
					uri: { fsPath: fullPath, toString: () => `file://${fullPath}` },
					fsPath: fullPath,
					toString: () => `file://${fullPath}`,
				}
			}),
		},
	}
})

// Silence console noise in tests (and make assertions easy)
console.log = vi.fn()
console.info = vi.fn()
console.warn = vi.fn()
console.error = vi.fn()
