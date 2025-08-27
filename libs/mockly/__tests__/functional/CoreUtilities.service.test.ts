import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { CoreUtilitiesService } from '../../src/services/CoreUtilities.service.js'
import { LogLevel } from '../../src/_vscCore/vscEnums.js'

describe('CoreUtilitiesService', () => {
	let service: CoreUtilitiesService
	let consoleSpy: {
		log: ReturnType<typeof vi.fn>
		info: ReturnType<typeof vi.fn>
		warn: ReturnType<typeof vi.fn>
		error: ReturnType<typeof vi.fn>
		debug: ReturnType<typeof vi.fn>
		trace: ReturnType<typeof vi.fn>
	}

	beforeEach(() => {
		service = new CoreUtilitiesService()
		
		// Spy on console methods
		consoleSpy = {
			log: vi.spyOn(console, 'log').mockImplementation(() => {}),
			info: vi.spyOn(console, 'info').mockImplementation(() => {}),
			warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
			error: vi.spyOn(console, 'error').mockImplementation(() => {}),
			debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
			trace: vi.spyOn(console, 'trace').mockImplementation(() => {}),
		}
	})

	afterEach(() => {
		vi.restoreAllMocks()
	})

	describe('formatLogMessage', () => {
		it('should format string messages correctly', () => {
			const result = service.formatLogMessage('test message')
			expect(result).toBe('test message')
		})

		it('should format object messages as JSON', () => {
			const testObj = { key: 'value', number: 42 }
			const result = service.formatLogMessage(testObj)
			expect(result).toBe('{"key":"value","number":42}')
		})

		it('should format Error objects with stack trace', () => {
			const testError = new Error('test error')
			testError.stack = 'Error: test error\n    at test'
			const result = service.formatLogMessage(testError)
			expect(result).toBe('Error: test error\n    at test')
		})

		it('should handle objects that cannot be serialized', () => {
			const circularObj: any = {}
			circularObj.self = circularObj
			
			const result = service.formatLogMessage(circularObj)
			expect(result).toBe('[Object (serialization failed)]')
		})
	})

	describe('log level management', () => {
		it('should have Warning as default log level', () => {
			// Default level is Warning, so Info should not log
			service.info('test message')
			expect(consoleSpy.info).not.toHaveBeenCalled()
		})

		it('should log when message level is >= current level', () => {
			service.setLogLevel(LogLevel.Info)
			service.info('test message')
			expect(consoleSpy.info).toHaveBeenCalledWith('[INFO] test message')
		})

		it('should not log when message level is < current level', () => {
			service.setLogLevel(LogLevel.Error)
			service.info('test message')
			expect(consoleSpy.info).not.toHaveBeenCalled()
		})

		it('should not log when log level is Off', () => {
			service.setLogLevel(LogLevel.Off)
			service.error('test error')
			expect(consoleSpy.error).not.toHaveBeenCalled()
		})
	})

	describe('logging methods', () => {
		beforeEach(() => {
			service.setLogLevel(LogLevel.Trace)
		})

		it('should log trace messages correctly', () => {
			service.trace('trace message')
			expect(consoleSpy.trace).toHaveBeenCalledWith('[TRACE] trace message')
		})

		it('should log debug messages correctly', () => {
			service.debug('debug message')
			expect(consoleSpy.debug).toHaveBeenCalledWith('[DEBUG] debug message')
		})

		it('should log info messages correctly', () => {
			service.info('info message')
			expect(consoleSpy.info).toHaveBeenCalledWith('[INFO] info message')
		})

		it('should log warning messages correctly', () => {
			service.warn('warning message')
			expect(consoleSpy.warn).toHaveBeenCalledWith('[WARN] warning message')
		})

		it('should log error messages correctly', () => {
			service.error('error message')
			expect(consoleSpy.error).toHaveBeenCalledWith('[ERROR] error message')
		})

		it('should handle multiple optional parameters', () => {
			service.info('message', 'param1', 'param2')
			expect(consoleSpy.info).toHaveBeenCalledWith('[INFO] message', 'param1', 'param2')
		})

		it('should handle object parameters', () => {
			const obj = { test: 'value' }
			service.info('message', obj)
			expect(consoleSpy.info).toHaveBeenCalledWith('[INFO] message', obj)
		})
	})

	describe('setLogLevel', () => {
		it('should change log level and log the change', () => {
			service.setLogLevel(LogLevel.Debug)
			expect(consoleSpy.info).toHaveBeenCalledWith('[INFO] Log level set to: Debug')
		})

		it('should allow setting to Off level', () => {
			service.setLogLevel(LogLevel.Off)
			service.info('this should not log')
			expect(consoleSpy.info).not.toHaveBeenCalledWith('[INFO] this should not log')
		})

		it('should allow setting to Trace level', () => {
			service.setLogLevel(LogLevel.Trace)
			service.trace('this should log')
			expect(consoleSpy.trace).toHaveBeenCalledWith('[TRACE] this should log')
		})
	})

	describe('edge cases', () => {
		it('should handle undefined messages gracefully', () => {
			service.setLogLevel(LogLevel.Info)
			service.info(undefined as any)
			expect(consoleSpy.info).toHaveBeenCalledWith('[INFO] undefined')
		})

		it('should handle null messages gracefully', () => {
			service.setLogLevel(LogLevel.Info)
			service.info(null as any)
			expect(consoleSpy.info).toHaveBeenCalledWith('[INFO] null')
		})

		it('should handle empty string messages', () => {
			service.setLogLevel(LogLevel.Info)
			service.info('')
			expect(consoleSpy.info).toHaveBeenCalledWith('[INFO] ')
		})
	})
}) 