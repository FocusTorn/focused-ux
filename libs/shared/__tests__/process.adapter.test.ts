import { describe, it, expect, vi } from 'vitest'

describe('ProcessAdapter', () => {
	it('delegates exec and returns workspace root', async () => {
		vi.resetModules()
		vi.mock('node:child_process', () => ({ exec: vi.fn((cmd: string, _opts: any, cb: any) => cb(null, 'ok', '')) }))

		const { ProcessAdapter } = await import('../src/vscode/adapters/Process.adapter.js')
		const workspace = { workspaceFolders: [{ uri: { fsPath: 'D:/root' } }] }
		const a = new ProcessAdapter(workspace as any)
		let out = ''

		a.exec('echo hi', { cwd: 'D:/root' }, (_e, stdout) => { out = stdout })
		expect(out).toBe('ok')
		expect(a.getWorkspaceRoot()).toBe('D:/root')
	})
})
