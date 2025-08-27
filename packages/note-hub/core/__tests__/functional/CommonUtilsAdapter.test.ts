import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { CommonUtilsAdapter } from '../../src/adapters/CommonUtilsAdapter.js'

describe('CommonUtilsAdapter', () => {
	let adapter: CommonUtilsAdapter
	let consoleSpy: {
		error: ReturnType<typeof vi.spyOn>
		info: ReturnType<typeof vi.spyOn>
		warn: ReturnType<typeof vi.spyOn>
	}

	beforeEach(() => {
		adapter = new CommonUtilsAdapter()
		consoleSpy = {
			error: vi.spyOn(console, 'error').mockImplementation(() => {}),
			info: vi.spyOn(console, 'info').mockImplementation(() => {}),
			warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
		}
	})

	afterEach(() => {
		vi.restoreAllMocks()
	})

	describe('errMsg', () => {
		it('should log error message without error object', () => {
			adapter.errMsg('Test error message')

			expect(consoleSpy.error).toHaveBeenCalledWith('Test error message', '')
		})

		it('should log error message with error object', () => {
			const error = new Error('Test error')

			adapter.errMsg('Test error message', error)

			expect(consoleSpy.error).toHaveBeenCalledWith('Test error message', error)
		})

		it('should handle empty message', () => {
			adapter.errMsg('')

			expect(consoleSpy.error).toHaveBeenCalledWith('', '')
		})

		it('should handle null error object', () => {
			adapter.errMsg('Test error message', null)

			expect(consoleSpy.error).toHaveBeenCalledWith('Test error message', '')
		})
	})

	describe('infoMsg', () => {
		it('should log info message', () => {
			adapter.infoMsg('Test info message')

			expect(consoleSpy.info).toHaveBeenCalledWith('Test info message')
		})

		it('should handle empty message', () => {
			adapter.infoMsg('')

			expect(consoleSpy.info).toHaveBeenCalledWith('')
		})

		it('should handle long message', () => {
			const longMessage = 'A'.repeat(1000)

			adapter.infoMsg(longMessage)

			expect(consoleSpy.info).toHaveBeenCalledWith(longMessage)
		})
	})

	describe('warnMsg', () => {
		it('should log warning message', () => {
			adapter.warnMsg('Test warning message')

			expect(consoleSpy.warn).toHaveBeenCalledWith('Test warning message')
		})

		it('should handle empty message', () => {
			adapter.warnMsg('')

			expect(consoleSpy.warn).toHaveBeenCalledWith('')
		})

		it('should handle special characters in message', () => {
			const specialMessage = 'Test message with special chars: !@#$%^&*()'

			adapter.warnMsg(specialMessage)

			expect(consoleSpy.warn).toHaveBeenCalledWith(specialMessage)
		})
	})

	describe('integration', () => {
		it('should handle multiple message types', () => {
			adapter.infoMsg('Info message')
			adapter.warnMsg('Warning message')
			adapter.errMsg('Error message')

			expect(consoleSpy.info).toHaveBeenCalledWith('Info message')
			expect(consoleSpy.warn).toHaveBeenCalledWith('Warning message')
			expect(consoleSpy.error).toHaveBeenCalledWith('Error message', '')
		})

		it('should maintain separate call counts', () => {
			adapter.infoMsg('Info 1')
			adapter.infoMsg('Info 2')
			adapter.warnMsg('Warning 1')
			adapter.errMsg('Error 1')

			expect(consoleSpy.info).toHaveBeenCalledTimes(2)
			expect(consoleSpy.warn).toHaveBeenCalledTimes(1)
			expect(consoleSpy.error).toHaveBeenCalledTimes(1)
		})
	})
})
