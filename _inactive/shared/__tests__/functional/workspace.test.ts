import { describe, it, expect, vi } from 'vitest'

describe('Workspace Comprehensive Tests', () => {
	describe('WorkspaceAdapter', () => {
		it('delegates to vscode.workspace APIs', async () => { //>
			vi.resetModules()
			vi.mock('vscode', () => {
				const workspace = {
					getConfiguration: vi.fn().mockReturnValue({}),
					fs: { sentinel: true },
					workspaceFolders: [{ name: 'root' }],
					onDidChangeConfiguration: vi.fn().mockReturnValue({ dispose: vi.fn() }),
					createFileSystemWatcher: vi.fn().mockReturnValue({}),
					openTextDocument: vi.fn().mockResolvedValue({ uri: { fsPath: '/x' } }),
				}

				class RelativePattern { constructor(public base: string, public pattern: string) {} }
				return { workspace, RelativePattern }
			})

			const { WorkspaceAdapter } = await import('../../src/vscode/adapters/Workspace.adapter.js')
			const { TextDocumentAdapter } = await import('../../src/vscode/adapters/TextDocument.adapter.js')
			const a = new WorkspaceAdapter()

			expect(a.getConfiguration('x')).toEqual({})

			const vs: any = await import('vscode')

			expect(a.fs).toBe(vs.workspace.fs)

			const vs2: any = await import('vscode')

			expect(a.workspaceFolders).toBe(vs2.workspace.workspaceFolders)
			a.onDidChangeConfiguration(() => {})
			expect(vs2.workspace.onDidChangeConfiguration).toHaveBeenCalled()

			a.createFileSystemWatcher('*.ts')

			const vs1: any = await import('vscode')

			expect(vs1.workspace.createFileSystemWatcher).toHaveBeenCalled()
			a.createFileSystemWatcher({ base: '/b', pattern: '**/*.ts' } as any)
			expect(vs1.workspace.createFileSystemWatcher).toHaveBeenCalledTimes(2)

			const doc = await a.openTextDocument('/x')

			expect(doc).toBeInstanceOf(TextDocumentAdapter)
		}) //<
	})

	describe('WorkspaceCCPAdapter', () => {
		it('delegates to underlying workspace adapter', async () => { //>
			const base = {
				workspaceFolders: [{ uri: { fsPath: '/r' }, name: 'r' }],
				getConfiguration: (s: string) => ({ get: (k: string) => `${s}.${k}` }),
				onDidChangeConfiguration: (l: any) => ({ dispose: () => l({ affectsConfiguration: (x: string) => x === 'ccp' }) }),
				createFileSystemWatcher: (p: any) => ({ p }),
				fs: { readFile: async () => '' },
				openTextDocument: async (u: any) => ({ uri: u }),
			} as any
			const { WorkspaceCCPAdapter } = await import('../../src/vscode/adapters/WorkspaceCCP.adapter.js')
			const a = new WorkspaceCCPAdapter(base)

			expect(a.workspaceFolders?.[0].uri).toBe('/r')
			expect(a.asRelativePath('/x')).toBe('/x')
			expect(a.get('s', 'k')).toBe('s.k')
			expect(a.createFileSystemWatcher('*.md')).toEqual({ p: '*.md' })
			expect(a.getConfiguration('s').get('k')).toBe('s.k')
			expect(a.fs).toBe(base.fs)
			expect((await a.openTextDocument('/f')).uri).toBe('/f')

			const disp = a.onDidChangeConfiguration(() => void 0)

			expect(typeof disp.dispose).toBe('function')
			// invoke returned disposer to trigger inner listener path
			disp.dispose()
		}) //<
	})
})
