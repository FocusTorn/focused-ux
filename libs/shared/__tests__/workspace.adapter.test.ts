import { describe, it, expect, vi } from 'vitest'

describe('WorkspaceAdapter', () => {
	it('delegates to vscode.workspace APIs', async () => {
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

		const { WorkspaceAdapter } = await import('../src/vscode/adapters/Workspace.adapter.js')
		const { TextDocumentAdapter } = await import('../src/vscode/adapters/TextDocument.adapter.js')
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
	})
})
