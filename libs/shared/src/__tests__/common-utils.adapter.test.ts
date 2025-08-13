import { describe, it, expect, vi } from 'vitest'

describe('CommonUtilsAdapter', () => {
	it('errMsg sanitizes and calls window.showErrorMessage', async () => {
		const win = { showErrorMessage: vi.fn() }
		const { CommonUtilsAdapter } = await import('../vscode/adapters/CommonUtils.adapter.js')
		const a = new CommonUtilsAdapter(win)

		a.errMsg('  bad\nmsg\t\x07 ')
		expect(win.showErrorMessage).toHaveBeenCalledWith('badmsg')
	})

	it('delay resolves after given ms', async () => {
		const { CommonUtilsAdapter } = await import('../vscode/adapters/CommonUtils.adapter.js')
		const a = new CommonUtilsAdapter({ showErrorMessage: vi.fn() })
		const start = Date.now()

		await a.delay(10)
		expect(Date.now() - start).toBeGreaterThanOrEqual(9)
	})
})
