import { describe, it, expect, vi } from 'vitest'

describe('coverage-only: CommonUtilsAdapter extra branches', () => {
	it('errMsg maps undefined/empty to "Unknown error" and normalizes whitespace/control', async () => {
		const win = { showErrorMessage: vi.fn() }
		const { CommonUtilsAdapter } = await import('../../src/vscode/adapters/CommonUtils.adapter.js')
		const a = new CommonUtilsAdapter(win)

		// undefined → Unknown error
		a.errMsg(undefined as any)
		expect(win.showErrorMessage).toHaveBeenCalledWith('Unknown error')

		// whitespace only → Unknown error
		a.errMsg('   \n\t  ')
		expect(win.showErrorMessage).toHaveBeenCalledWith('Unknown error')

		// control/newlines normalized and trimmed
		a.errMsg('  bad\nmsg\t\x07 ')
		expect(win.showErrorMessage).toHaveBeenCalledWith('badmsg')
	})
})

