import { describe, it, expect } from 'vitest'

describe('WorkspaceCCPAdapter', () => {
	it('delegates to underlying workspace adapter', async () => {
		const base = {
			workspaceFolders: [{ uri: { fsPath: '/r' }, name: 'r' }],
			getConfiguration: (s: string) => ({ get: (k: string) => `${s}.${k}` }),
			onDidChangeConfiguration: (l: any) => ({ dispose: () => l({ affectsConfiguration: (x: string) => x === 'ccp' }) }),
			createFileSystemWatcher: (p: any) => ({ p }),
			fs: { readFile: async () => '' },
			openTextDocument: async (u: any) => ({ uri: u }),
		} as any
		const { WorkspaceCCPAdapter } = await import('../src/vscode/adapters/WorkspaceCCP.adapter.js')
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
	})
})
